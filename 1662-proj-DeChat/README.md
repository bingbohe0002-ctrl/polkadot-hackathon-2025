# 🛰️ DeChat — A Decentralized Group Chat with NFT Access Control & On-Chain Red Packets

**Built for Polkadot Hackathon 2025**  
**Keywords:** XMTP • NFT Gating • Token Red Packets • Polkadot • Web3 Social  
**DeChat Team:** PlatinumWords  
**Team Members:** Bingbohe, Victoria

**PPT:** [https://docs.google.com/presentation/d/1sGkVdruY3AlNpNYEKwfjLN5pAG88Qg52Kf8_XmsE3Fk/edit?usp=sharing](https://docs.google.com/presentation/d/1sGkVdruY3AlNpNYEKwfjLN5pAG88Qg52Kf8_XmsE3Fk/edit?usp=sharing)<br/>
**DEMO:** [https://youtu.be/YTQa2RdQOgU](https://youtu.be/YTQa2RdQOgU)

---

## 🚀 1. Project Overview

**DeChat** is a decentralized group chat platform built on the **Polkadot ecosystem**, powered by the **XMTP communication protocol**.  
It introduces **NFT-based access control** and **on-chain token red packets**, bringing a new level of secure, permissioned, and incentivized interaction to Web3 communities.

### 🔗 Decentralized Social Experience

- Users can join private chat groups via **invitation link** or **QR code**.  
- The system automatically verifies NFT ownership on **Polkadot**, allowing only verified users to enter.  
- Within the group, members can **send and claim on-chain red packets** — token rewards that are transferred directly and trustlessly between wallets.  
- Red packets come in **Normal**, **Advanced**, and **Super** tiers, corresponding to NFT levels.  
- The higher the NFT level, the greater the rewards — turning on-chain identity into community-driven value.

<img width="2854" height="1406" alt="4def9ea9068040a32144e75cedfc9006" src="https://github.com/user-attachments/assets/625e7d1c-0491-402c-aace-0d14e81bcec6" />

---

## 🌟 2. Key Features

| Feature | Description |
|:--|:--|
| 🔗 QR / Link-based Group Join | Join exclusive communities via invitation link or QR code. |
| 🪙 NFT Access Control | Only users holding specific NFTs can access private chats. |
| 💬 Decentralized Messaging | End-to-end encrypted communication powered by XMTP. |
| 🧧 On-Chain Red Packets | Tokens are sent and claimed directly on-chain — instant settlement. |
| 💎 Tiered Red Packet System | Unlock higher-level red packets with higher NFT levels. |
| 🎯 Gamified Engagement | Red packets + NFT integration to boost community activity. |

---

## 🧠 3. Tech Stack Overview

| Layer | Technology | Description |
|:--|:--|:--|
| Messaging Protocol | **XMTP** | Decentralized secure chat protocol |
| Blockchain | **Polkadot** | On-chain NFT and token management |
| Frontend | **React + XMTP Browser SDK** | UI and user interactions |
| Smart Contracts | **Solidity + Hardhat** | NFT verification & red packet logic |
| Backend Service | **Node.js + TypeScript** | Invite group members & manage access |
| Wallet Integration | **EVM-Compatible Wallets** | Wallet connection, token transfer |

---

## 🧩 4. System Architecture
```
┌───────────────────────────────────────┐
│ Frontend │
│ React + XMTP SDK + Wallet Integration │
└───────────────┬───────────────────────┘
│
┌───────────────▼───────────────────────┐
│ Smart Contracts │
│ NFT Access + Red Packet Logic │
└───────────────┬───────────────────────┘
│
┌───────────────▼───────────────────────┐
│ Backend Services │
│ InviteGroupMemberServer (TypeScript) │
└───────────────────────────────────────┘
```
### 💎 Smart Contract Addresses
- **NFT Contract:** `0x6728823f07dCDd30e6ed33e677598deFc85bE37F`  
- **Red Packet Contract:** `0xbC2d5f073fb937c67A70E3F0CbbF9dF061edf592`

---

## ⚙️ 5. Project Structure & Setup

### 🧭 Folder Overview
```
1662-proj-DeChat/
├── DeChatFront/ # Frontend (React + XMTP)
├── contracts/ # Solidity smart contracts
├── server/ # Node/TypeScript backend service
├── Script/ # Helper scripts for deployment/testing
├── test/ # Hardhat tests
└── README.md # This file
```
### 🧰 Installation & Run

**Frontend**
```
cd DeChatFront
npm install
npm start
```
**Backend Service**
```
npx ts-node './server/InviteGroupMemberServer.ts'
```
**Smart Contracts**
```
cd contracts
npm install         
npx hardhat compile
npx hardhat test
```
## 🧭 6. Interaction Preview
Login Page – Connect wallet and authenticate.<br/>
Create Group – Define NFT gating rules.<br/>
Invite Members – Generate QR or link invitations.<br/>
Send Red Packets – Choose amount, token, and distribution.<br/>
Group Chat View – Real-time messages, NFT display, red packet claiming.b<br/>
## 🧪 7. User Flow
| Step | Action          | Description                                 |
| :--: | :-------------- | :------------------------------------------ |
|  1️⃣ | Login           | Connect wallet to access the DApp           |
|  2️⃣ | Create Group    | Define group info & NFT requirement         |
|  3️⃣ | Invite Members  | Generate invitation link or QR code         |
|  4️⃣ | Send Red Packet | Distribute on-chain token rewards           |
|  5️⃣ | Chat & Claim    | Chat, interact, and claim rewards instantly |

## 🧭 8. Summary
| Aspect           | Description                                                             |
| :--------------- | :---------------------------------------------------------------------- |
| 🧠 Concept       | Web3-native group chat integrating NFT access and on-chain interactions |
| 🧩 Architecture  | Modular system: frontend + smart contracts + XMTP + backend             |
| 💬 Interaction   | Fully decentralized communication and asset transfer                    |
| 🚀 Innovation    | Identity-driven token incentives (“NFT = Access + Reward”)              |
| 🌐 Deployability | Easy to set up and extend for any Web3 community or DAO                 |

