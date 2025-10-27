# 部署指南

## 环境准备

### 必需工具
- Node.js >= 18.17
- Yarn >= 1.22
- Git

### 环境变量配置

1. Hardhat 环境变量 (.env):
```bash
DEPLOYER_PRIVATE_KEY=    # 部署账户私钥
```

2. Next.js 环境变量 (.env.local):
```bash
PINATA_API_KEY=         # Pinata API密钥
PINATA_API_SECRET=      # Pinata API密钥
MYSQL_HOST=            # MySQL主机地址
MYSQL_USER=            # MySQL用户名
MYSQL_PASSWORD=        # MySQL密码
MYSQL_DATABASE=        # MySQL数据库名
NEXT_PUBLIC_PINATA_API_KEY=
NEXT_PUBLIC_PINATA_API_SECRET=
```

## 本地开发部署

1. 克隆项目:
```bash
git clone <repository-url>
cd <project-name>
```

2. 安装依赖:
```bash
yarn install
```

3. 启动本地区块链:
```bash
yarn chain
```

4. 部署合约:
```bash
yarn deploy
```

5. 启动前端:
```bash
yarn start
```

## 测试网部署

### Sepolia 测试网

1. 配置网络:
```typescript
// hardhat.config.ts
sepolia: {
  url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  accounts: [process.env.DEPLOYER_PRIVATE_KEY],
}
```

2. 部署到 Sepolia:
```bash
yarn deploy --network sepolia
```

3. 验证合约:
```bash
yarn verify --network sepolia
```

### Base Sepolia 测试网

1. 配置网络:
```typescript
// hardhat.config.ts
baseSepolia: {
  url: "https://sepolia.base.org",
  accounts: [process.env.DEPLOYER_PRIVATE_KEY],
}
```

2. 部署到 Base Sepolia:
```bash
yarn deploy --network baseSepolia
```

## 生产环境部署

### 智能合约部署

1. 配置主网:
```typescript
// hardhat.config.ts
mainnet: {
  url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
  accounts: [process.env.DEPLOYER_PRIVATE_KEY],
}
```

2. 部署到主网:
```bash
yarn deploy --network mainnet
```

3. 验证合约:
```bash
yarn verify --network mainnet
```

### 前端部署

1. 构建前端:
```bash
cd packages/nextjs
yarn build
```

2. Vercel 部署:
```bash
vercel
```

## 数据库部署

1. 创建数据库:
```sql
CREATE DATABASE nft_platform;
```

2. 创建表:
```sql
-- NFT主表
CREATE TABLE nfts (
  nft_id BIGINT PRIMARY KEY,
  token_uri TEXT NOT NULL,
  mint_item TIMESTAMP NOT NULL,
  owner VARCHAR(42) NOT NULL,
  state INTEGER NOT NULL,
  royalty_fee_numerator INTEGER NOT NULL
);

-- 收藏表
CREATE TABLE nft_collections (
  nft_id BIGINT,
  user_address VARCHAR(42),
  collected_at DATETIME NOT NULL,
  PRIMARY KEY (nft_id, user_address)
);

-- 举报表
CREATE TABLE nft_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nft_id BIGINT NOT NULL,
  reporter_address VARCHAR(42) NOT NULL,
  reason TEXT NOT NULL,
  reported_at DATETIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  UNIQUE KEY unique_report (nft_id, reporter_address)
);

-- gas费用记录表
CREATE TABLE gas_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tx_hash VARCHAR(66) NOT NULL,
  method_name VARCHAR(100) NOT NULL,
  gas_used BIGINT NOT NULL,
  gas_price BIGINT NOT NULL,
  total_cost DECIMAL(65,0) NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  block_number BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  status VARCHAR(20) DEFAULT 'success'
);
```

## 监控与维护

1. 设置日志监控
2. 配置告警机制
3. 定期备份数据
4. 更新依赖包
5. 检查合约安全性

## 常见问题

1. 部署失败
- 检查网络配置
- 确认账户余额
- 验证 gas 设置

2. 合约验证失败
- 确认合约源码
- 检查编译器版本
- 验证构造函数参数

3. 前端部署问题
- 检查环境变量
- 确认构建配置
- 验证API地址 