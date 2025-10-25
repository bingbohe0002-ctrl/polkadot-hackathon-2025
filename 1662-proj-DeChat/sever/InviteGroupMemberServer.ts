// server.ts
// 顶部导入区
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import crypto from "crypto";
import { Client, type Signer, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { recoverMessageAddress } from "viem";
import { hexToBytes } from "viem/utils";

type InviteRecord = {
  token: string;
  groupId: string;
  inviter?: string;
  expiresAt: number; // ms since epoch
  used: boolean; // 保留字段以兼容现有逻辑/展示（但不再作为强制一次性标志）
  nonce?: string | null;
  lastUsedAt?: number | null; // 新增：记录上次被使用的时间（ms）
};

const DB_FILE = "./invites.json";
const ADMIN_TOKEN_ENV = "APiToken";
const ADMIN_PK = "0x31f2deea57b9b3f6ff7a6b97f89f67d73e79b98b04b23d62559334b19c2440fb"; // 必须提供 admin 私钥
const XMTP_ENV = "production"; // 'dev' 或 'production'
const PORT = Number(process.env.PORT ?? 3000);

if (!ADMIN_PK) {
  console.error("请在环境变量 ADMIN_PK 中提供 admin 私钥（仅用于 demo）");
  process.exit(1);
}

// ---------- 简易持久化 ----------
function loadInvites(): Map<string, InviteRecord> {
  try {
    if (!fs.existsSync(DB_FILE)) return new Map();
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const arr: InviteRecord[] = JSON.parse(raw || "[]");
    return new Map(arr.map((r) => [r.token, r]));
  } catch (e) {
    console.warn("加载 invites.json 失败，使用空数据：", e);
    return new Map();
  }
}
function saveInvites(map: Map<string, InviteRecord>) {
  const arr = Array.from(map.values());
  fs.writeFileSync(DB_FILE, JSON.stringify(arr, null, 2), "utf8");
}

// ---------- Invite 存储 ----------
const invites = loadInvites();

// ---------- admin XMTP client 单例 ----------
const adminAccount = privateKeyToAccount(ADMIN_PK);
let adminClient: Client | null = null;

async function makeAdminClientIfNeeded() {
  if (adminClient) return adminClient;

  const signer: Signer = {
    type: "EOA",
    getIdentifier: async () => ({
      identifier: adminAccount.address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string | Uint8Array | unknown): Promise<Uint8Array> => {
      const msgBytes: Uint8Array =
        message instanceof Uint8Array
          ? message
          : new TextEncoder().encode(typeof message === "string" ? message : String(message ?? ""));
      // 直接使用 viem 的 Account.signMessage，保持返回类型为 Hex
      const sigHex = await adminAccount.signMessage({ message: Buffer.from(msgBytes).toString() });
      return hexToBytes(sigHex);
    },
  };

  adminClient = await Client.create(signer, { env: XMTP_ENV });
  console.log("admin XMTP client 初始化完成，address:", adminAccount.address);
  return adminClient;
}

// ---------- Helpers ----------
function genToken(len = 12) {
  return crypto.randomBytes(len).toString("hex");
}
function genNonce(len = 16) {
  return crypto.randomBytes(len).toString("hex");
}

function requireAdminAuth(req: express.Request): boolean {
  const header = req.header("x-admin-token") ?? "";
  return header === ADMIN_TOKEN_ENV;
}

// ---------- Express app ----------
// Express 初始化
const app = express();
app.use(express.json());

// TODO:创建接口-管理端创建邀请（需认证 header: x-admin-token）--- 核心
app.post("/api/invite/create", async (req, res) => {
  try {
    if (!requireAdminAuth(req)) return res.status(401).json({ error: "unauthorized" });

    const { groupId, inviter, ttlSec = 60 * 60 * 24 } = req.body;
    if (!groupId) return res.status(400).json({ error: "missing groupId" });

    const token = genToken(12);
    const rec: InviteRecord = {
      token,
      groupId,
      inviter,
      expiresAt: Date.now() + ttlSec * 1000,
      used: false, // 保留字段（不再作为一次性校验）
      nonce: null,
      lastUsedAt: null,
    };
    invites.set(token, rec);
    saveInvites(invites);
    const url = `${req.protocol}://${req.get("host")}/join?group=${encodeURIComponent(groupId)}&token=${token}`;
    console.log(`创建邀请 token=${token} group=${groupId} inviter=${inviter ?? "(none)"} expiresIn=${ttlSec}s`);
    return res.json({ token, url, expiresAt: rec.expiresAt });
  } catch (e) {
    console.error("create invite error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// 前端获取 nonce（赎回前的签名挑战）
app.get("/api/invite/nonce", (req, res) => {
  try {
    const token = String(req.query.token ?? "");
    const info = invites.get(token);
    if (!info) return res.status(404).json({ error: "invalid token" });
    if (info.expiresAt < Date.now()) return res.status(400).json({ error: "token expired" });
    // 生成一次性 nonce 并保存
    const nonce = genNonce(16);
    info.nonce = nonce;
    invites.set(token, info);
    saveInvites(invites);
    return res.json({ nonce });
  } catch (e) {
    console.error("nonce error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * 赎回邀请：
 * body: { token, inboxId, address, signature }
 * - signature 是对 /api/invite/nonce 返回的 nonce 的签名（wallet.signMessage(nonce)）
 *
 * 修改说明（你要求按时间生效）：本方法不再把 token 作为“一次性”强制使用。
 * 只要 token 未过期（info.expiresAt > now），并且验签/校验通过，就允许多次赎回（多人可用）。
 * 为便于审计，会在每次成功时写入 lastUsedAt。
 */
app.post("/api/invite/redeem", async (req, res) => {
  try {
    const { token, inboxId, address, signature } = req.body as {
      token?: string;
      inboxId?: string;
      address?: string;
      signature?: string;
    };
    if (!token || !inboxId || !address || !signature) {
      return res.status(400).json({ error: "missing fields (token,inboxId,address,signature required)" });
    }
    const info = invites.get(token);
    if (!info) return res.status(404).json({ error: "invalid token" });
    // **不再**：if (info.used) return res.status(400).json({ error: "token already used" });
    if (info.expiresAt < Date.now()) return res.status(400).json({ error: "token expired" });
    if (!info.nonce) return res.status(400).json({ error: "nonce not issued for this token" });

    // 1) 验签：使用 viem 的 recoverMessageAddress 恢复签名地址
    let recovered: string;
    try {
      // recoverMessageAddress 在 viem 中会返回签名恢复的地址
      recovered = (recoverMessageAddress as any)({ message: info.nonce, signature }) as string;
      // 如果你的 viem 版本是 async，需要用: recovered = await recoverMessageAddress({ message: info.nonce, signature });
    } catch (e) {
      console.warn("verify signature failed:", e);
      return res.status(400).json({ error: "invalid signature" });
    }
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: "signature does not match address" });
    }

    // 2) optional: 验证 inboxId 属于 address（推荐）
    const client = await makeAdminClientIfNeeded();
    try {
      // 使用 DM 的 id 作为 inboxId 校验
      const dm = await client.conversations.newDm(address);
      const expected = dm.id;
      if (!expected) {
        console.warn("未能解析 inboxId for", address);
        return res.status(400).json({ error: "address has no inboxId (not registered?)" });
      }
      if (expected !== inboxId) {
        console.warn("提交的 inboxId 与系统查询到的不一致", { expected, provided: inboxId });
        return res.status(400).json({ error: "inboxId does not match address" });
      }
    } catch (e) {
      console.error("验证 inboxId 时出错:", e);
      return res.status(500).json({ error: "internal error validating inboxId" });
    }

    // 3) 把 inboxId 加入群（以 admin 身份）
    try {
      const groupConv = await client.conversations.getConversationById(info.groupId);
      if (!groupConv) {
        return res.status(404).json({ error: "group not found" });
      }
      // addMembers 接受 inboxId 列表
      await (groupConv as any).addMembers([inboxId]);
    } catch (e) {
      console.error("addMembers failed:", e);
      return res.status(500).json({ error: "failed to add member to group" });
    }

    // 4) 标记为已使用（**已改为仅记录 lastUsedAt，不再阻止再次使用**）并保存
    // info.used = true; // <- 不再设为 true，这样 token 可以在失效前被复用
    info.lastUsedAt = Date.now();
    info.nonce = null;
    invites.set(token, info);
    saveInvites(invites);

    console.log(`Invite redeemed: token=${token} address=${address} inboxId=${inboxId} group=${info.groupId}`);
    return res.json({ ok: true, groupId: info.groupId });
  } catch (e) {
    console.error("redeem error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// 可选：查看 token 状态（admin 认证）
app.get("/api/invite/status", (req, res) => {
  if (!requireAdminAuth(req)) return res.status(401).json({ error: "unauthorized" });
  const token = String(req.query.token ?? "");
  if (!token) return res.status(400).json({ error: "missing token" });
  const info = invites.get(token);
  if (!info) return res.status(404).json({ error: "not found" });
  return res.json(info);
});

// 简单 join 页面（只返回 JSON 引导用，不做 UI）
app.get("/join", (req, res) => {
  const token = String(req.query.token ?? "");
  const group = String(req.query.group ?? "");
  res.json({ message: "Use your app to redeem this invite via /api/invite/nonce and /api/invite/redeem", token, group });
});

// 启动 server
app.listen(PORT, () => {
  console.log(`Invite server listening on http://localhost:${PORT} (XMTP env=${XMTP_ENV})`);
});
