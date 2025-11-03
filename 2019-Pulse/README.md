# 💓 Pulse - Decentralized Chat Application

A fully decentralized chat application built on Polkadot Hub where all messages are stored on-chain, ensuring complete message history and censorship resistance.

**Live Demo**: https://pulse-hazel.vercel.app/

---

## 🌟 Features

### Core Features
- **🔒 Fully On-Chain**: All public messages are permanently stored on the Polkadot Hub blockchain
- **📜 Complete History**: Never miss a message - access the full chat history anytime
- **🌐 Decentralized**: No central server - powered by Polkadot Hub smart contracts
- **👤 User Profiles**: Set username, personal signature, and avatar
- **🎨 Modern UI**: Beautiful, responsive design with real-time updates
- **🔗 Wallet Integration**: Connect with MetaMask, Talisman, or SubWallet

### Social Features
- **👥 Groups**: Create and join public/private groups with on-chain message history
- **📢 Channels**: Subscribe to broadcast channels for announcements
- **💬 Private Messages**: Encrypted peer-to-peer messaging
- **👫 Friends**: Add and manage your friend list

### 🤖 AI Assistant (NEW!)
- **💡 Smart Reply**: AI-generated intelligent responses based on context
- **✨ Content Polish**: Automatically improve and refine your messages
- **📝 Daily Summary**: Auto-generate summaries of today's conversations
- **🎫 NFT-Gated**: Mint AI NFT for **10 PAS** to unlock lifetime access


---

## 🏗️ Architecture

### Smart Contracts (6 contracts)
- **Language**: Solidity ^0.8.9
- **VM**: PolkaVM (compiled via resolc)
- **Network**: Polkadot Hub TestNet
- **Contracts**:
  - `PulseChat`: User registration & public messages
  - `PulseGroups`: Group management & messages
  - `PulseChannels`: Channel subscriptions & broadcasts
  - `PulseFriends`: Friend relationships
  - `PulsePrivateMessages`: Encrypted private chats
  - `PulseAI`: AI assistant NFT access control

### Frontend
- **Framework**: React 18 + Vite
- **Wallet Connection**: RainbowKit + Wagmi
- **Blockchain Library**: viem
- **Styling**: Custom CSS with modern design
- **State Management**: React hooks

### AI Backend
- **Server**: Express.js
- **AI Provider**: Groq API (FREE)
- **Model**: Llama 3.1 8B Instant
- **Features**: Smart reply, content polish, chat summary

---

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js v22.13.1 or later
- npm v6.13.4 or later
- A Web3 wallet (MetaMask, Talisman, or SubWallet)
- PAS test tokens from [Polkadot Faucet](https://faucet.polkadot.io/?parachain=1111)

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd Pulse-main

# Install dependencies
npm install
```

### 2. Configuration

Create a `.env` file in the project root:

```bash
# Private key for contract deployment (REQUIRED)
PRIVATE_KEY=0xyour_private_key_here

# WalletConnect Project ID (Get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# AI Service (Optional - already has built-in API key)
VITE_AI_SERVICE_URL=http://localhost:3001
AI_SERVICE_PORT=3001
```

**Note**: AI service has a built-in Groq API key, so no additional configuration needed for AI features!

### 3. Compile Smart Contracts

```bash
npm run compile
```

This will compile all 6 contracts to PolkaVM bytecode and generate ABIs.

### 4. Deploy Smart Contracts

```bash
npm run deploy
```

This will:
- Deploy all 6 contracts to Polkadot Hub TestNet
- Save contract addresses to `src/contracts/deployment.json`
- Display deployment summary

### 5. Run Application

**Option 1: Full Stack (Frontend + AI Service)**
```bash
npm run dev:full
```

**Option 2: Separate Terminals**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - AI Service
npm run ai-service
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **AI Service**: http://localhost:3001

### 6. Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

---

## 📖 Usage Guide

### First Time Users

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Register Profile**: 
   - Enter a unique username (required)
   - Add personal signature (optional)
   - Add avatar URL (optional)
   - Click "Create Profile & Join Chat"
3. **Start Chatting**: Send your first message!

### Using Groups

1. Click "My Groups" button
2. Click "Create Group" to create a new group
3. Share the invite link or add members by address
4. All group messages are stored on-chain

### Using Channels

1. Click "My Channels" button
2. Browse available channels in "Discover"
3. Subscribe to channels you're interested in
4. Channel owners can broadcast messages to all subscribers

### Using AI Assistant

1. **Mint AI NFT** (one-time, 10 PAS):
   - Click the 🤖 button next to the message input
   - Click "Mint AI NFT to Unlock"
   - Confirm the transaction
   - Wait for confirmation

2. **Use AI Features**:
   - **Smart Reply**: Type your message → Click 🤖 → Select "Smart Reply"
   - **Polish Text**: Type your message → Click 🤖 → Select "Polish Text"
   - **Daily Summary**: Click 🤖 → Select "Summarize Today"

3. **Apply AI Results**:
   - Review the AI-generated content
   - Click "Use Reply" or "Use Polished Text" to apply to input box
   - Edit if needed, then send

### Private Messages

- Click on any user's avatar or username
- Opens a private chat modal
- Messages are encrypted and stored on-chain
- Free to use after initial setup

---

## 🛠️ Development

### Project Structure

```
Pulse-main/
├── contracts/              # Solidity smart contracts
│   ├── PulseChat.sol
│   ├── PulseGroups.sol
│   ├── PulseChannels.sol
│   ├── PulseFriends.sol
│   ├── PulsePrivateMessages.sol
│   └── PulseAI.sol
├── server/                 # AI backend service
│   └── ai-service.js
├── scripts/                # Build and deployment scripts
│   ├── compile.js
│   └── deploy.js
├── src/
│   ├── components/         # React components
│   │   ├── AIAssistant.jsx
│   │   ├── ChatRoom.jsx
│   │   ├── GroupList.jsx
│   │   ├── GroupChat.jsx
│   │   ├── ChannelList.jsx
│   │   ├── Channel.jsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   └── useContract.js
│   ├── config/             # Configuration files
│   │   ├── chains.js
│   │   └── wagmi.js
│   ├── styles/             # CSS files
│   ├── contracts/          # Generated contract artifacts
│   ├── App.jsx
│   └── main.jsx
├── .env                    # Environment variables (create this)
├── package.json
└── README.md
```

### Key Technologies

- **@parity/resolc**: Solidity to PolkaVM compiler
- **viem**: Ethereum library for TypeScript
- **wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI
- **Vite**: Build tool and dev server
- **Express**: AI service backend
- **Groq API**: Free AI model provider

### Smart Contract Functions

#### PulseChat
```solidity
registerUser(string username, string signature, string avatarUrl)
sendMessage(string content)
getLatestMessages(uint256 count)
getAllUsers()
```

#### PulseGroups
```solidity
createGroup(string name)
joinGroup(uint256 groupId)
sendGroupMessage(uint256 groupId, string content)
getGroupMembers(uint256 groupId)
```

#### PulseChannels
```solidity
createChannel(string name)
subscribeChannel(uint256 channelId)
sendChannelMessage(uint256 channelId, string content)
getChannelSubscribers(uint256 channelId)
```

#### PulseAI
```solidity
mintAINFT() payable
checkAIAccess(address user)
getUserNFTs(address user)
```

---

## 🌐 Network Information

### Polkadot Hub TestNet

- **Network Name**: Polkadot Hub TestNet
- **Chain ID**: 420420422
- **Currency**: PAS
- **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **Block Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io/
- **Faucet**: https://faucet.polkadot.io/?parachain=1111

### AI Service

- **Port**: 3001
- **API**: Groq (Free tier)
- **Model**: Llama 3.1 8B Instant


---

## 💰 Costs & Pricing

### Blockchain Costs (PAS Tokens)
- User Registration: ~0.001-0.002 PAS
- Send Message: ~0.0005-0.001 PAS
- Create Group/Channel: ~0.001-0.002 PAS
- **AI NFT Mint**: 10 PAS (one-time, lifetime access)

### AI Costs
- **FREE**: All AI features are free to use after minting NFT
- Powered by Groq's free API tier
- No additional charges

---

## 🔒 Security Notes

- **Never commit your private key**: Always use `.env` file (gitignored)
- **Test on TestNet first**: Always test thoroughly before MainNet
- **Smart contract limits**: 
  - Username: max 50 characters
  - Message: max 1000 characters
  - Code size: max 100KB (PolkaVM limit)
- **AI Privacy**: Messages sent to AI are processed but not stored

---

## 🐛 Troubleshooting

### "Contract not available" error
- Make sure you've compiled the contracts: `npm run compile`
- Make sure you've deployed the contracts: `npm run deploy`
- Check that `src/contracts/deployment.json` exists

### Transaction failed
- Ensure you have enough PAS tokens
- Check that you're connected to Polkadot Hub TestNet
- Try increasing gas limit in your wallet

### AI Service not working
- Check if AI service is running on port 3001
- Visit http://localhost:3001/health to verify
- Make sure you're using `npm run dev:full` or running `npm run ai-service` separately

### Username already taken
- Try a different username
- Use the "Check" button before registering

### Messages not appearing
- Wait a few seconds for blockchain confirmation
- Click refresh or reload the page
- Check network connectivity

---

## 📚 Documentation

- **[AI Features Guide](./AI_FEATURE.md)**: Complete AI functionality documentation
- **[AI Quick Start](./AI_QUICKSTART.md)**: 3-minute AI setup guide
- **[Changelog](./CHANGELOG.md)**: Version history and updates
- **[Security](./SECURITY.md)**: Security best practices

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🔗 Links

### Documentation
- [Polkadot Documentation](https://docs.polkadot.com/)
- [PolkaVM Documentation](https://docs.polkadot.com/polkadot-protocol/smart-contract-basics/polkavm-design/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)

### Tools & Services
- [Groq AI Console](https://console.groq.com/)
- [RainbowKit](https://www.rainbowkit.com/)
- [WalletConnect](https://cloud.walletconnect.com/)

---

## ⚠️ Disclaimer

This is a beta application built on Polkadot Hub TestNet. PolkaVM smart contracts with Ethereum compatibility are in **early-stage development and may be unstable or incomplete**. Use at your own risk.

**For Production Use**:
- Always test thoroughly
- Use separate wallets for testing
- Never share your private keys
- Verify all transactions before confirming

---

## 🎯 Roadmap

- [x] Basic chat functionality
- [x] User profiles
- [x] Group chat
- [x] Channels
- [x] Private messages
- [x] Friend system
- [x] AI assistant integration
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Voice/Video calls
- [ ] File sharing (IPFS)
- [ ] DAO governance

---

## 👥 Team

Built with ❤️ by the Pulse team on Polkadot Hub

---

## 🙏 Acknowledgments

- Polkadot team for the amazing PolkaVM technology
- Groq for providing free AI API access
- The open-source community

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-03

**Star ⭐ this repo if you find it useful!**
