# DeciCourt Smart Contracts

去中心化法庭智能合约系统，基于 Polkadot Hub 部署。

## 📋 项目结构

```text
deci_court/
├── contracts/          # 智能合约
│   ├── DeciCourt.sol  # 主合约 - 去中心化法庭系统
│   └── JuryToken.sol  # ERC20 代币合约
├── ignition/           # Hardhat Ignition 部署模块
│   └── modules/
├── scripts/            # 交互脚本
├── test/              # 测试文件
└── hardhat.config.js  # Hardhat 配置
```

## 🚀 已部署合约

**网络**: Passet Hub Testnet (Chain ID: 420420422)

- **JuryToken**: `0x07eB8A200793Ec7055ADD629C926cE6c65DC68Ac`
- **DeciCourt**: `0x1A327ff18EF54eCF1B0AE4F885B78eCcF00A003E`

**区块浏览器**: https://blockscout-passet-hub.parity-testnet.parity.io/

## 🔧 快速开始

### 安装依赖
```bash
npm install
```

### 编译合约
```bash
npx hardhat compile
```

### 运行测试
```bash
npx hardhat test
```

### 部署合约
```bash
npx hardhat ignition deploy ./ignition/modules/DeciCourtModule.js --network passethub
```

### 交互测试
```bash
npx hardhat run scripts/interact.js --network passethub
```

## 💡 核心功能

- **陪审员管理**: 注册、质押、声誉系统
- **案件管理**: 创建案件、分配陪审员
- **投票系统**: 承诺-揭示投票机制
- **上诉机制**: 支持案件上诉和二审
- **经济激励**: 基于 JURY 代币的激励机制

## 🛠 技术栈

- **区块链**: Polkadot Hub (PolkAVM)
- **开发框架**: Hardhat
- **合约语言**: Solidity ^0.8.19
- **部署工具**: Hardhat Ignition