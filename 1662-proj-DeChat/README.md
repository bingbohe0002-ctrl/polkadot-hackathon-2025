🚀 1. Project Overview 
DeChat is a decentralized group chat platform built on the Polkadot ecosystem, powered by the XMTP communication protocol.
It introduces NFT-based access control and on-chain token red packets, bringing a new level of secure, permissioned, and incentivized interaction to Web3 communities.

Decentralized Social Experience
Users can join private chat groups via invitation link or QR code.
The system automatically verifies NFT ownership on Polkadot, allowing only verified users to enter.
Within the group, members can send and claim on-chain red packets — token rewards that are transferred directly and trustlessly between wallets.
Red packets come in Normal, Advanced, and Super tiers, corresponding to NFT levels.
The higher the NFT level, the greater the rewards — turning on-chain identity into community-driven value.

🌟 2. Key Features
Feature	Description
🔗 QR / Link-based Group Join	Join exclusive communities via invitation link or QR code.
🪙 NFT Access Control	Only users holding specific NFTs can access private chats.
💬 Decentralized Messaging	End-to-end encrypted communication powered by XMTP.
🧧 On-Chain Red Packets	Tokens are sent and claimed directly on-chain — instant settlement.
💎 Tiered Red Packet System	Unlock higher-level red packets with higher NFT levels.
🎯 Gamified Engagement	Red packets + NFT integration to boost community activity.
🧠 3. Tech Stack Overview
Layer	Technology	Description
Messaging Protocol	XMTP
	Decentralized secure chat protocol
Blockchain	Polkadot
	On-chain NFT and token management
Frontend	React + XMTP Browser SDK	UI and user interactions
Smart Contracts	Solidity + Hardhat	NFT verification & red packet logic
Backend Service	Node.js + TypeScript	Invite group members & manage access
Wallet Integration	EVM-Compatible Wallets	Wallet connection, token transfer
🧩 4. System Architecture
┌───────────────────────────────────────┐
│               Frontend                │
│ React + XMTP SDK + Wallet Integration │
└───────────────┬───────────────────────┘
                │
┌───────────────▼───────────────────────┐
│            Smart Contracts            │
│   NFT Access + Red Packet Logic       │
└───────────────┬───────────────────────┘
                │
┌───────────────▼───────────────────────┐
│          Backend Services             │
│ InviteGroupMemberServer (TypeScript)  │
└───────────────────────────────────────┘

💎 Smart Contract Addresses

NFT Contract: 0x9E8e3572363469eA1bEdd9a9a674C723CAD7b002

Red Packet Contract: 0xbC2d5f073fb937c67A70E3F0CbbF9dF061edf592

⚙️ 5. Project Structure & Setup
🧭 Folder Overview
1662-proj-DeChat/
├── DeChatFront/                # Frontend (React + XMTP)
├── contracts/                  # Solidity smart contracts
├── server/                     # Node/TypeScript backend service
├── Script/                     # Helper scripts for deployment/testing
├── test/                       # Hardhat tests
└── README.md                   # This file

🧰 Installation & Run
Frontend
cd DeChatFront
npm install
npm start

Backend Service
npx ts-node '../1662-proj-DeChat/server/InviteGroupMemberServer.ts'

Smart Contracts
cd contracts
npx hardhat compile
npx hardhat test

XMTP SDK Reference

XMTP V3 Browser SDK
https://docs.xmtp.org/chat-apps/sdks/browser#get-started-with-the-xmtp-browser-sdk

🧭 6. Interaction Preview

Login Page — Connect wallet and authenticate.

Create Group — Define NFT gating rules.

Invite Members — Generate QR or link invitations.

Send Red Packets — Choose amount, token, and distribution.

Group Chat View — Real-time messages, NFT display, red packet claiming.

(Sample screenshots are included in the original repository.)

🧪 7. User Flow
Step	Action	Description
1️⃣	Login	Connect wallet to access the DApp
2️⃣	Create Group	Define group info & NFT requirement
3️⃣	Invite Members	Generate invitation link or QR code
4️⃣	Send Red Packet	Distribute on-chain token rewards
5️⃣	Chat & Claim	Chat, interact, and claim rewards instantly
🛠️ 8. Markdown Implementation Notes

To reproduce the same visual effects in your own README:

Element	Markdown Syntax
Title / Section	#, ##, ### headings
Icons & Emojis	Add Unicode emoji like 💬, 🧧, 🚀
Code Blocks	bash / typescript for syntax highlighting
Tables	Use `
Images	![Alt Text](path/to/image.png)
Links	[XMTP Docs](https://docs.xmtp.org/)
Contracts	Inline code with backticks `0x...`
🧭 9. Summary
Aspect	Description
🧠 Concept	Web3-native group chat integrating NFT access and on-chain interactions
🧩 Architecture	Modular system: frontend + smart contracts + XMTP + backend
💬 Interaction	Fully decentralized communication and asset transfer
🚀 Innovation	Identity-driven token incentives (“NFT = Access + Reward”)
🌐 Deployability	Easy to set up and extend for any Web3 community or DAO
🪪 License

MIT License
Copyright © 2025
DeChat Team — OneBlockPlus / Polkadot Hackathon 2025

Would you like me to generate a dual-language version (English + Simplified Chinese) next — formatted side-by-side or section-by-section for better international readability?
