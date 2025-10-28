// server.ts
require('dotenv').config({ path: '../.env' });
import express from "express";
import fs from "fs";
import crypto from "crypto";
import cors from "cors";
import { Client, type Signer, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { hexToBytes } from "viem/utils";

type InviteRecord = {
  token: string;
  groupId: string;
  inviter?: string;
  expiresAt: number; // ms since epoch
  used: boolean;
  nonce?: string | null;
  lastUsedAt?: number | null;
};

const DB_FILE = "./invites.json";
const ADMIN_TOKEN_ENV = "APiToken";
const ADMIN_PK =  process.env.PRIVATE_KEY as `0x${string}`;
const XMTP_ENV = "production";
const PORT = Number(process.env.PORT ?? 3001);

if (!ADMIN_PK) {
  console.error("请在环境变量 ADMIN_PK 中提供 admin 私钥");
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
let adminClientPromise: Promise<Client> | null = null;

async function getAdminClient(): Promise<Client> {
  if (adminClientPromise) return adminClientPromise;

  adminClientPromise = (async () => {
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

    const client = await Client.create(signer, { env: XMTP_ENV });
    console.log("admin XMTP client 初始化完成，address:", adminAccount.address);
    return client;
  })();

  return adminClientPromise;
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
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// 获取 nonce
app.get("/api/invite/nonce", async (req, res) => {
  try {
    const token = String(req.query.token ?? "");
    const info = invites.get(token);
    if (!info) return res.status(404).json({ error: "invalid token" });
    if (info.expiresAt < Date.now()) return res.status(400).json({ error: "token expired" });

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

// 赎回 invite
app.post("/api/invite/redeem", async (req, res) => {
  try {
    const { inboxId, groupId } = req.body as { inboxId?: string; groupId?: string };

    if (!inboxId || !groupId) {
      return res.status(400).json({ error: "missing fields (inboxId, groupId required)" });
    }

    const client = await getAdminClient(); // 确保 client 已初始化

    // 打印确认 client 已初始化
    console.log("✅ Admin client initialized");
    console.log("Admin address:", adminAccount.address);

    try {
      const conversations = await client.conversations.list();
      console.log("✅ Conversations list:", conversations);

      // 获取 group conversation
      const groupConv = await client.conversations.getConversationById(groupId);
      if (!groupConv) {
        console.log("❌ Group not found:", groupId);
        return res.status(404).json({ error: "group not found" });
      }

      // 打印 group 信息
      console.log("Group info:", {
        id: (groupConv as any).id,
        topic: (groupConv as any).topic,
        members: (groupConv as any).members,
      });

      // 添加成员
      await (groupConv as any).addMembers([inboxId]);
      console.log(`✅ Member added: inboxId=${inboxId} group=${groupId}`);

      // 再次打印 group 成员确认
      console.log("Updated group members:", (groupConv as any).members);

      return res.json({ ok: true, groupId });
    } catch (e) {
      console.error("addMembers failed:", e);
      return res.status(500).json({ error: "failed to add member" });
    }
  } catch (e) {
    console.error("redeem error:", e);
    return res.status(500).json({ error: String(e) });
  }
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

// 简单 join 页面
app.get("/join", (req, res) => {
  const token = String(req.query.token ?? "");
  const group = String(req.query.group ?? "");
  res.json({ message: "Use your app to redeem this invite via /api/invite/nonce and /api/invite/redeem", token, group });
});

// 启动 server
app.listen(PORT, () => {
  console.log(`Invite server listening on http://localhost:${PORT} (XMTP env=${XMTP_ENV})`);
});
