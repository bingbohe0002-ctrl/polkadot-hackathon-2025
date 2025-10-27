# 💓 Pulse - Decentralized Chat Room

A fully decentralized chat application built on Polkadot Hub where all public messages are stored on-chain, ensuring complete message history and censorship resistance.
Experience address: https://pulse-hazel.vercel.app/
## 🌟 Features

- **🔒 Fully On-Chain**: All public messages are permanently stored on the Polkadot Hub blockchain
- **📜 Complete History**: Never miss a message - access the full chat history anytime
- **🌐 Decentralized**: No central server - powered by Polkadot Hub smart contracts
- **👤 User Profiles**: Set username, personal signature, and avatar
- **💬 Private Chats**: Off-chain peer-to-peer messaging (stored locally)
- **🎨 Modern UI**: Beautiful, responsive design with real-time updates
- **🔗 Wallet Integration**: Connect with MetaMask, Talisman, or SubWallet

## 🏗️ Architecture

### Smart Contract
- **Language**: Solidity ^0.8.9
- **VM**: PolkaVM (compiled via resolc)
- **Network**: Polkadot Hub TestNet
- **Features**:
  - User registration with profiles
  - On-chain message storage
  - Username uniqueness validation
  - Profile updates
  - Message history queries

### Frontend
- **Framework**: React 18 + Vite
- **Wallet Connection**: RainbowKit + Wagmi
- **Blockchain Library**: viem
- **Styling**: Custom CSS with modern design
- **State Management**: React hooks + localStorage for private chats

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js v22.13.1 or later
- npm v6.13.4 or later
- A Web3 wallet (MetaMask, Talisman, or SubWallet)
- PAS test tokens from [Polkadot Faucet](https://faucet.polkadot.io/?parachain=1111)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd pulse

# Install dependencies
npm install
```

### 2. Configuration

```bash
# Copy environment example
cp .env.example .env

# Edit .env and add:
# - Your private key for deployment
# - WalletConnect Project ID from https://cloud.walletconnect.com
```

Edit `src/config/wagmi.js` and replace `YOUR_PROJECT_ID` with your WalletConnect Project ID.

### 3. Compile Smart Contract

```bash
npm run compile
```

This will:
- Compile `PulseChat.sol` to PolkaVM bytecode
- Generate ABI in `src/contracts/PulseChat.json`
- Generate bytecode in `src/contracts/PulseChat.polkavm`

### 4. Deploy Smart Contract

```bash
# Set your private key in .env file first!
PRIVATE_KEY=0xyour_private_key npm run deploy
```

This will:
- Deploy the contract to Polkadot Hub TestNet
- Save the contract address in `src/contracts/deployment.json`
- Display the contract address and transaction details

### 5. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 6. Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

## 📖 Usage Guide

### First Time Users

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Register Profile**: 
   - Enter a unique username (required)
   - Add personal signature (optional)
   - Add avatar URL (optional)
   - Click "Create Profile & Join Chat"
3. **Start Chatting**: Send your first message!

### Sending Messages

- Type your message in the input box
- Press Enter or click Send button
- Each message creates an on-chain transaction
- Messages appear for all users immediately

### Private Chats

- Click on any user's avatar or username
- Opens a private chat modal
- Messages are stored locally (not on-chain)
- Free to use, no transaction fees

### Viewing User Profiles

- Toggle the "Show Users" button to see all registered members
- Click refresh to update the user list
- Click any user to open a private chat

## 🛠️ Development

### Project Structure

```
pulse/
├── contracts/           # Smart contracts
│   └── PulseChat.sol   # Main contract
├── scripts/            # Build and deployment scripts
│   ├── compile.js      # Contract compilation
│   └── deploy.js       # Contract deployment
├── src/
│   ├── components/     # React components
│   │   ├── MainLayout.jsx
│   │   ├── Header.jsx
│   │   ├── Registration.jsx
│   │   ├── ChatRoom.jsx
│   │   ├── MessageItem.jsx
│   │   ├── UserList.jsx
│   │   └── PrivateChat.jsx
│   ├── hooks/          # Custom React hooks
│   │   └── useContract.js
│   ├── config/         # Configuration files
│   │   ├── chains.js
│   │   └── wagmi.js
│   ├── styles/         # CSS files
│   ├── contracts/      # Generated contract artifacts
│   ├── App.jsx        # Main app component
│   └── main.jsx       # App entry point
├── index.html
├── vite.config.js
└── package.json
```

### Key Technologies

- **@parity/resolc**: Solidity to PolkaVM compiler
- **viem**: Ethereum library for TypeScript
- **wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI
- **Vite**: Build tool and dev server

### Smart Contract Functions

```solidity
// User Management
registerUser(string username, string signature, string avatarUrl)
updateProfile(string username, string signature, string avatarUrl)
getUserProfile(address userAddress)
isUsernameAvailable(string username)

// Messaging
sendMessage(string content)
getLatestMessages(uint256 count)
getMessages(uint256 start, uint256 limit)
getTotalMessages()

// Users
getAllUsers()
getTotalUsers()
```

## 🌐 Network Information

### Polkadot Hub TestNet

- **Network Name**: Polkadot Hub TestNet
- **Chain ID**: 420420422
- **Currency**: PAS
- **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **Block Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io/
- **Faucet**: https://faucet.polkadot.io/?parachain=1111

## 🔒 Security Notes

- **Never commit your private key**: Always use `.env` file (gitignored)
- **Test on TestNet first**: Always test thoroughly before MainNet
- **Smart contract limits**: 
  - Username: max 50 characters
  - Message: max 1000 characters
  - Code size: max 100KB (PolkaVM limit)

## 📝 Gas Costs

Approximate gas costs on Polkadot Hub TestNet:

- User Registration: ~0.001-0.002 PAS
- Send Message: ~0.0005-0.001 PAS
- Update Profile: ~0.001-0.002 PAS

## 🐛 Troubleshooting

### "Contract not available" error
- Make sure you've compiled the contract: `npm run compile`
- Make sure you've deployed the contract: `npm run deploy`
- Check that `src/contracts/deployment.json` exists

### Transaction failed
- Ensure you have enough PAS tokens
- Check that you're connected to Polkadot Hub TestNet
- Try increasing gas limit in MetaMask

### Username already taken
- Try a different username
- Use the "Check" button before registering

### Messages not appearing
- Wait a few seconds for blockchain confirmation
- Click refresh or reload the page
- Check network connectivity

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Links

- [Polkadot Documentation](https://docs.polkadot.com/)
- [PolkaVM Documentation](https://docs.polkadot.com/polkadot-protocol/smart-contract-basics/polkavm-design/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)

## ⚠️ Disclaimer

This is a beta application built on Polkadot Hub TestNet. PolkaVM smart contracts with Ethereum compatibility are in **early-stage development and may be unstable or incomplete**. Use at your own risk.

---

Built with ❤️ on Polkadot Hub


