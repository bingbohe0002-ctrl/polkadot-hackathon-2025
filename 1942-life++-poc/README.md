# Life++ PoC - 基于 Polkadot REVM 的认知证明系统

## 🎯 项目概述

Life++ PoC 是一个基于 Polkadot REVM 的**认知证明系统**，为 AI 代理、机器人和数字孪生提供可验证的认知过程证明。项目实现了完整的端到端解决方案，从智能合约到用户界面。

## 🏗️ 项目架构

```
+================================================================+
|                    Life++ PoC 系统架构                          |
+================================================================+
|                                                                |
|  [机器人/数字孪生层]                                              |
|  +------------------+      +------------------+                |
|  |   Robot SDK      | ---> |  AHIN Indexer     |               |
|  |   (TypeScript)   |      |  (Express.js)    |                |
|  +------------------+      +------------------+                |
|                                |                               |
|                                v                               |
|  [IPFS 存储层]                                                  |
|  +------------------+ +------------------+ +------------------+|
|  |   证据包存储      | |   元数据存储      | |   推理过程存储      ||
|  +------------------+ +------------------+ +------------------+|
|                                |                               |
|                                v                               |
|  [区块链层 - PassetHub 测试网]                                   |
|  +------------------+ +------------------+ +------------------+|
|  |  PoC Registry    | |   PoC Ledger     | |   CATK Token     ||
|  |   代理注册        | |   证明验证        | |   代币激励         ||
|  +------------------+ +------------------+ +------------------+|
|  +------------------+ +------------------+                     |
|  |  Action Proof    | |  Legal Wrapper   |                     |
|  |      NFT         | |    合规管理       |                     |
|  |   行动证书        | |                  |                     |
|  +------------------+ +------------------+                     |
|                                |                               |
|                                v                               |
|  [验证层]                                                       |
|  +------------------+ +------------------+ +------------------+|
|  | Validator Daemon | |    CAT 算法      | |  多验证器网络       ||
|  |                  | |   4阶段验证       | |   共识机制         ||
|  +------------------+ +------------------+ +------------------+|
|                                                                |
+================================================================+
```

## 🎯 项目核心功能

### 1) 核心智能合约
- **PoC Registry**: 代理注册和身份管理
- **PoC Ledger**: 认知证明提交和验证
- **CATK Token**: ERC-20 代币，用于质押和激励
- **Action Proof NFT**: ERC-721 证书，代表已验证的认知行动
- **Legal Wrapper**: 合规性和司法管辖区管理

### 2) 链下服务架构
- **AHIN Indexer**: 证据打包、IPFS 上传、区块链交互
- **Validator Daemon**: 运行 CAT 算法进行证明验证
- **Robot SDK**: TypeScript/Python SDK，提供标准化 API
- **IPFS 存储**: 去中心化证据包存储

### 3) 技术特性
- **REVM 兼容**: 基于 Polkadot REVM，支持以太坊工具链
- **跨链支持**: 利用 Polkadot 生态的跨链能力
- **可扩展性**: 模块化设计，支持多种验证算法
- **安全性**: 多重验证机制，确保认知证明的真实性

### 4) 应用场景
- **AI 代理验证**: 为 AI 系统提供可验证的认知过程证明
- **机器人认证**: 确保机器人行为的真实性和可追溯性
- **数字孪生**: 为数字孪生系统提供认知状态验证
- **跨链集成**: 利用 Polkadot 生态实现跨链认知证明

## 🔄 业务工作流程

### 完整认知证明流程

```
++===============================================================+
|                      认知证明业务流程                             |
++===============================================================+
|                                                                |
|  [1] 代理注册阶段                                                |
|  +------------------+      +------------------+                |
|  |  机器人/代理      | ---> |  PoC Registry     |                |
|  |  提交注册信息      |      |  存储代理 CID      |               |
|  +------------------+      +------------------+                |
|                                                                |
|  [2] 认知过程执行                                                |
|  +------------------+      +------------------+                |
|  |  接收任务输入      | ---> |  执行认知推理       |               |
|  |  (传感器数据)      |      |  (AI 决策过程)     |               |
|  +------------------+      +------------------+                |
|                                                                |
|  [3] 证据打包阶段                                                |
|  +------------------+      +------------------+                |
|  |  AHIN Indexer    | ---> |  IPFS 存储         |               |
|  |  打包证据数据      |      |  生成证据 CID       |              |
|  +------------------+      +------------------+                |
|                                                                |
|  [4] 区块链提交阶段                                              |
|  +------------------+      +------------------+               |
|  |  PoC Ledger      | ---> |  生成证明 ID       |               |
|  |  提交证明哈希      |      |  记录时间戳         |              |
|  +------------------+      +------------------+               |
|                                                               |
|  [5] 验证阶段                                                  |
|  +------------------+      +------------------+               |
|  | Validator Daemon | ---> |  CAT 算法验证       |              |
|  | 运行验证算法       |      |  四阶段验证流程      |              |
|  +------------------+      +------------------+               |
|                                                               |
|  [6] 结果生成阶段                                               |
|  +------------------+      +------------------+               |
|  |  Action NFT      | ---> |  CATK 代币         |              |
|  |  生成行动证书      |      |  奖励分配           |              |
|  +------------------+      +------------------+                |
|                                                                |
++===============================================================+
```

### 详细业务流程说明

#### 1️⃣ **代理注册阶段**
- **输入**: 机器人/代理的基本信息、元数据哈希
- **处理**: 通过 `PoCRegistry.registerAgent()` 注册代理
- **输出**: 代理 CID（内容标识符）存储在区块链上
- **数据生成**: 
  - 代理地址 → CID 映射
  - 注册时间戳
  - 质押金额记录

#### 2️⃣ **认知过程执行**
- **输入**: 传感器数据、任务指令、环境信息
- **处理**: 机器人执行认知推理，生成决策过程
- **输出**: 结构化的认知过程数据
- **数据生成**:
  - 输入数据包
  - 推理步骤序列
  - 输出结果
  - 元数据（模型版本、置信度等）

#### 3️⃣ **证据打包阶段**
- **输入**: 完整的认知过程数据
- **处理**: AHIN Indexer 将数据打包成结构化证据
- **输出**: IPFS 上的证据包
- **数据生成**:
  - 证据包 CID
  - Merkle 树根哈希
  - 加密签名
  - 时间戳和版本信息

#### 4️⃣ **区块链提交阶段**
- **输入**: 证据包 CID 和元数据
- **处理**: 通过 `PoCLedger.submitProof()` 提交证明
- **输出**: 区块链上的证明记录
- **数据生成**:
  - 证明 ID（唯一标识符）
  - 证据哈希
  - 提交时间戳
  - 交易哈希

#### 5️⃣ **验证阶段**
- **输入**: 提交的证明数据
- **处理**: Validator Daemon 运行 CAT 算法
- **输出**: 验证结果和评分
- **数据生成**:
  - 语法检查结果
  - 因果一致性评分
  - 意图匹配度
  - 对抗鲁棒性测试结果

#### 6️⃣ **结果生成阶段**
- **输入**: 验证通过的证明
- **处理**: 生成 NFT 证书和分配奖励
- **输出**: 可验证的认知行动证书
- **数据生成**:
  - Action Proof NFT（ERC-721）
  - CATK 代币奖励
  - 链排名更新
  - 合规记录

### 业务价值体现

#### 🎯 **对机器人/代理的价值**
- **可验证性**: 每个认知决策都有区块链证明
- **可信度**: 通过多验证器网络确保真实性
- **激励**: 通过 CATK 代币获得经济激励
- **声誉**: 建立基于验证的声誉系统

#### 🏢 **对企业的价值**
- **审计合规**: 满足监管要求的可审计记录
- **质量控制**: 确保 AI 系统的决策质量
- **风险控制**: 通过验证机制降低 AI 风险
- **品牌信任**: 建立基于技术的信任机制

#### 🌐 **对生态的价值**
- **标准化**: 建立认知证明的行业标准
- **互操作性**: 跨平台、跨链的证明互认
- **创新激励**: 鼓励更好的认知算法发展
- **数据价值**: 创造可验证的认知数据资产

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 1. 克隆项目
```bash
git clone <repository-url>
cd polk-contract
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境

#### 3.1 环境变量配置
```bash
# 方式A：一键生成开发者环境
node scripts/create-developer-env.js

# 方式B：直接使用已配置的环境文件
# .env.passetHub 文件已包含所有必要配置
```

#### 3.2 加载环境变量
**重要**: 由于项目使用 `.env.passetHub` 文件存储配置，需要手动加载环境变量：

```bash
# 加载环境变量（每次运行测试前都需要执行）
source .env.passetHub

# 验证环境变量加载成功
echo "私钥: $PRIVATE_KEY"
echo "合约地址: $CATK_ADDRESS"
echo "部署者地址: $DEPLOYER_ADDRESS"
```

**注意**: 
- 每次运行测试前都需要执行 `source .env.passetHub`
- 确保你的钱包私钥已正确配置在 `.env.passetHub` 文件中
- 私钥格式必须是 EVM 格式，不是 Substrate 格式

### 4. 合约部署（可选）

> **📝 说明**: 合约已在 PassetHub 测试网部署完成，无需重新部署。若执行部署脚本，不影响业务运行，程序会自动更新合约地址。

#### 4.1 部署智能合约（可选）
```bash
# 部署智能合约到 PassetHub 测试网
npm run deploy:passethub

# 查看部署结果
npm run show:deployment-data
```

### 5. 测试验证流程

#### 5.1 加载环境变量
```bash
# 重要：每次运行测试前都需要加载环境变量
source .env.passetHub

# 验证环境变量加载成功
echo "私钥: $PRIVATE_KEY"
echo "合约地址: $CATK_ADDRESS"
```

#### 5.2 测试前数据记录
```bash
# 记录当前部署状态和合约地址
npm run show:deployment-data

# 检查钱包余额和网络状态
npm run check:network-status
```

#### 5.3 运行功能测试
```bash
# 运行完整的评审测试
npm run hackathon:test

# 运行 PassetHub 专项测试
npm run test:passethub
```

#### 5.4 测试后数据分析
```bash
# 分析测试结果和数据变化
npm run analyze:test-results

# 显示测试产生的数据变化
npm run show:deployment-data
```

### 6. 启动服务
```bash
# 启动 AHIN Indexer
npm run indexer:start

# 启动 Validator Daemon
npm run validator:start
```

## 📋 已部署合约地址

**PassetHub 测试网部署地址**:
- **PoC Registry**: `0x...` (代理注册合约)
- **PoC Ledger**: `0x...` (证明验证合约)
- **CATK Token**: `0x...` (代币合约)
- **Action Proof NFT**: `0x...` (NFT 合约)
- **Legal Wrapper**: `0x...` (合规合约)

## 🧪 测试验证

### 评审测试脚本

#### 重要：钱包配置验证
**评审使用自己的钱包就可以成功调用** - 这是黑客松的核心要求！

```bash
# 1. 加载你的钱包环境变量
source .env.passetHub

# 2. 验证你的钱包已加载
echo "你的私钥: $PRIVATE_KEY"
echo "你的地址: $DEPLOYER_ADDRESS"

# 3. 运行评审测试（使用你的钱包）
npm run hackathon:test
```

#### 验证钱包参与测试
测试完成后，你应该能看到：
- ✅ **你的钱包余额变化** - 消耗了 Gas 费用
- ✅ **你的钱包参与了交易** - 在区块浏览器中可见
- ✅ **你的钱包获得了代币** - CATK 代币余额变化

#### 添加CATK代币到钱包
**重要**: 测试完成后，您需要在钱包中手动添加CATK代币才能看到余额：

1. **在钱包中找到"添加代币"功能**
   - 通常在钱包的"代币"或"资产"页面
   - 选择"自定义代币"或"导入代币"

2. **选择正确的网络**
   - 网络: `Paseo PassetHub TestNet`
   - 确保钱包连接到PassetHub测试网

3. **输入CATK代币信息**
   ```
   代币合约地址（若合约部署需使用最新地址）: 0x2e8880cAdC08E9B438c6052F5ce3869FBd6cE513
   代币符号: CATK (自动获取)
   小数位数: 18 (自动获取)
   ```

4. **完成添加**
   - 点击"下一步"或"添加代币"
   - 钱包会自动获取代币信息
   - 添加后即可看到CATK余额

**注意**: 这是测试网络的限制，钱包无法自动检测自定义代币，需要手动添加。

### 评审测试脚本
```bash
# 运行完整的评审测试
npm run hackathon:test
```

### 手动验证
1. 访问 [PassetHub 测试网浏览器](https://polkadot.js.org/apps/?rpc=wss://testnet-passet-hub-rpc.polkadot.io)
2. 输入合约地址查看部署状态
3. 调用合约函数验证功能

## 🔄 合约部署说明

### 当前状态
- ✅ **合约已部署**: 所有智能合约已在 PassetHub 测试网部署完成
- ✅ **地址已配置**: `.env.passetHub` 文件包含所有合约地址
- ✅ **可直接测试**: 无需重新部署即可运行测试

### 重复部署的影响
- ✅ **技术上安全**: 不会破坏现有系统
- ✅ **功能正常**: 每次都会成功部署新合约
- ✅ **自动更新**: 程序会自动更新合约地址配置
- ⚠️ **消耗资源**: 每次部署都会消耗 Gas 费用

### 重复部署前的准备
```bash
# 1. 备份当前部署信息
cp deployments/passetHub-deployment.json deployments/passetHub-deployment-backup.json

# 2. 重新部署（如果需要）
npm run deploy:passethub

# 3. 验证新部署
npm run show:deployment-data

# 4. 更新环境配置（如果需要）
nano .env.passetHub
```

## 🔧 开发指南

### 项目结构
```
├── contracts/                    # 智能合约源码
│   ├── PoCRegistry.sol          # 代理注册合约
│   ├── PoCLedger.sol            # 证明验证合约
│   ├── CognitiveAssetToken.sol  # CATK 代币合约
│   ├── ActionProofNFT.sol       # 行动证明 NFT 合约
│   └── LegalWrapper.sol         # 合规管理合约
├── scripts/                     # 部署和测试脚本
│   ├── deploy.js               # 合约部署脚本
│   ├── hackathon-test.js       # 评审测试脚本
│   ├── test-passethub.js       # PassetHub 测试脚本
│   ├── start-passethub-services.js # 服务启动脚本
│   └── show-deployment-data.js # 部署数据展示脚本
├── src/                        # 链下服务源码
│   ├── ahin-indexer/           # AHIN 索引器服务
│   │   └── server.ts           # Express.js 服务器
│   ├── validator/              # 验证器服务
│   │   ├── ValidatorDaemon.ts  # 验证器守护进程
│   │   └── CognitiveAlignmentTest.ts # CAT 算法实现
│   ├── robot-sdk/              # 机器人 SDK
│   │   └── RobotSDK.ts         # 机器人 SDK 实现
│   └── types.ts                # 类型定义
├── examples/                    # 使用示例
│   └── robot-example.ts        # 机器人使用示例
├── test/                       # 测试文件
│   └── PoCLedger.test.js       # 合约单元测试
├── docs/                       # 文档
│   └── sprint_backlog.md       # 开发计划
├── deployments/                 # 部署记录
│   ├── passetHub-deployment.json # PassetHub 部署记录
│   └── localhost-deployment.json  # 本地部署记录
├── artifacts/                   # 编译产物
├── cache/                      # 编译缓存
├── docker-compose.yml          # Docker 配置
├── hardhat.config.js          # Hardhat 配置
├── package.json                # 项目依赖
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 项目说明
```

### 主要脚本
- `npm run deploy:passethub` - 部署到 PassetHub
- `npm run hackathon:test` - 评审测试
- `npm run indexer:start` - 启动索引器
- `npm run validator:start` - 启动验证器

## 🌐 网络配置

### PassetHub 测试网
- **RPC**: `https://testnet-passet-hub-eth-rpc.polkadot.io`
- **Chain ID**: `420420422`
- **代币符号**: `PAS`
- **水龙头**: [PassetHub Faucet](https://faucet.polkadot.io/)
- **浏览器**: [Polkadot.js Apps](https://polkadot.js.org/apps/)

## 📚 文档资源

- **项目文档**: 查看 `README.md`
- **部署指南**: 运行 `node scripts/create-developer-env.js` 生成 `.env.passetHub`，或直接使用已配置的 `.env.passetHub` 文件
- **测试脚本**: 查看 `scripts/hackathon-test.js`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 技术讨论: [GitHub Discussions]

---

**注意**: 这是一个黑客松项目，用于演示基于 Polkadot REVM 的认知证明系统。生产环境使用前请进行充分的安全审计。