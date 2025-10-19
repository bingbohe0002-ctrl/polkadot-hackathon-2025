// server.ts
import express from "express";
import fs from "fs";
import crypto from "crypto";
import { Client, type Signer, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { recoverMessageAddress } from "viem";
import { hexToBytes } from "viem/utils";
import cors from "cors";


type InviteRecord = {
  token: string;
  groupId: string;
  inviter?: string;
  expiresAt: number; // ms since epoch
  used: boolean;
  nonce?: string | null;
  lastUsedAt?: number | null;
};
// ----------------- 配置区 -----------------

const DB_FILE = "./invites.json";
const ADMIN_TOKEN_ENV = "APiToken";
const ADMIN_PK = "0x6184e768e74610ed655c0aa3cb64ecd898a4d1f51a9ca76d0189acf578674cb3";
const XMTP_ENV = "production";
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
const app = express();
app.use(express.json());

// 管理端创建邀请（需认证 header: x-admin-token）--- 核心
app.post("/api/invite/create", async (req, res) => {
  try {
    if (!requireAdminAuth(req)) return res.status(401).json({ error: "unauthorized" });

    const { groupId, inviter, ttlSec = 60 * 60 * 24 } = req.body;
    if (!groupId) return res.status(400).json({ error: "missing groupId" });

    // 校验 groupId 是否存在（不会创建群）
    const client = await makeAdminClientIfNeeded();
    const groupConv = await client.conversations.getConversationById(groupId);
    if (!groupConv) {
      return res.status(400).json({ error: "group not found" });
    }

    // 生成并保存 invite
    const token = genToken(12);
    const rec: InviteRecord = {
      token,
      groupId,
      inviter,
      expiresAt: Date.now() + ttlSec * 1000,
      used: false,
      nonce: null,
      lastUsedAt: null,
    };
    invites.set(token, rec);
    saveInvites(invites);

    // 生成按群的邀请链接（路径形式，便于前端路由）
    const adminAddress = adminAccount.address.toLowerCase();
    const url = `${req.protocol}://${req.get("host")}/join/${encodeURIComponent(groupId)}/${token}`;
    console.log(`创建邀请 token=${token} group=${groupId} inviter=${inviter ?? "(none)"} expiresIn=${ttlSec}s`);
    return res.json({ token, url, expiresAt: rec.expiresAt, adminAddress, groupId });
  } catch (e) {
    console.error("create invite error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// 前端获取 nonce（赎回前的签名挑战）
// 可通过 token 查询，同时返回该 token 对应的 groupId（方便前端直接使用）
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
    return res.json({ nonce, groupId: info.groupId });
  } catch (e) {
    console.error("nonce error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * 赎回邀请：
 * body: { token, groupId, inboxId?, address, signature }
 * - 要求 front-end 在请求中包含 groupId（防错）
 */
app.post("/api/invite/redeem", async (req, res) => {
  try {
    const { token, groupId: providedGroupId, inboxId: providedInboxId, address, signature } = req.body as {
      token?: string;
      groupId?: string;
      inboxId?: string | undefined;
      address?: string;
      signature?: string;
    };

    if (!token || !providedGroupId || !address || !signature) {
      return res.status(400).json({ error: "missing fields (token,groupId,address,signature required)" });
    }

    const info = invites.get(token);
    if (!info) return res.status(404).json({ error: "invalid token" });

    // 强校验：请求里的 groupId 必须和 invite 中存储的一致
    if (info.groupId !== providedGroupId) {
      console.warn("请求中的 groupId 与 invite 中的 groupId 不匹配", { provided: providedGroupId, expected: info.groupId });
      return res.status(400).json({ error: "groupId does not match invite" });
    }

    if (info.expiresAt < Date.now()) return res.status(400).json({ error: "token expired" });
    if (!info.nonce) return res.status(400).json({ error: "nonce not issued for this token" });

    // 1) 验签：使用 viem 的 recoverMessageAddress 恢复签名地址
    let recovered: string;
    try {
      recovered = (recoverMessageAddress as any)({ message: info.nonce, signature }) as string;
    } catch (e) {
      console.warn("verify signature failed:", e);
      return res.status(400).json({ error: "invalid signature" });
    }
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: "signature does not match address" });
    }

    // 2) optional: 验证 inboxId 属于 address（推荐）
    const client = await makeAdminClientIfNeeded();

    let inboxId = providedInboxId ?? null;
    if (!inboxId) {
      try {
        const dm = await client.conversations.newDm(address);
        inboxId = dm?.id;
        if (!inboxId) {
          return res.status(400).json({ error: "xmtp_not_registered", message: "please create XMTP client in browser and retry with inboxId" });
        }
      } catch (e) {
        console.warn("admin newDm failed (likely user not registered):", e);
        return res.status(400).json({ error: "xmtp_not_registered", message: "please create XMTP client in browser and retry with inboxId" });
      }
    } else {
      try {
        const dm = await client.conversations.newDm(address);
        const expected = dm?.id;
        if (!expected) {
          return res.status(400).json({ error: "xmtp_not_registered", message: "address has no inboxId (not registered?)" });
        }
        if (expected !== inboxId) {
          console.warn("提交的 inboxId 与系统查询到的不一致", { expected, provided: inboxId });
          return res.status(400).json({ error: "inboxId does not match address" });
        }
      } catch (e) {
        console.error("验证 inboxId 时出错:", e);
        return res.status(500).json({ error: "internal error validating inboxId" });
      }
    }

    // 3) 把 inboxId 加入群（以 admin 身份）
    try {
      const groupConv = await client.conversations.getConversationById(info.groupId);
      if (!groupConv) {
        return res.status(404).json({ error: "group not found" });
      }
      await (groupConv as any).addMembers([inboxId]);
    } catch (e) {
      console.error("addMembers failed:", e);
      return res.status(500).json({ error: "failed to add member to group" });
    }

    // 4) 更新 invite 记录并保存
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

// 新：按群的 join 页面（路径形式）
app.get("/join/:group/:token", (req, res) => {
  const token = String(req.params.token ?? "");
  const group = String(req.params.group ?? "");
  // 你可以返回一个渲染页面或简单 JSON 引导；这里返回 JSON 方便调试/前端集成
  res.json({ message: "Use your app to redeem this invite via /api/invite/nonce and /api/invite/redeem", token, group });
});

// 查看 token 状态（admin 认证）
app.get("/api/invite/status", (req, res) => {
  if (!requireAdminAuth(req)) return res.status(401).json({ error: "unauthorized" });
  const token = String(req.query.token ?? "");
  if (!token) return res.status(400).json({ error: "missing token" });
  const info = invites.get(token);
  if (!info) return res.status(404).json({ error: "not found" });
  return res.json(info);
});

// 启动 server
app.listen(PORT, () => {
  console.log(`Invite server listening on http://localhost:${PORT} (XMTP env=${XMTP_ENV})`);
});
