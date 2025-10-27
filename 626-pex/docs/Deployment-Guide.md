# PEX 在 AssetHub 测试网的端到端部署与前端运行指南

本指南将手把手教你如何在 AssetHub 测试网上部署 PEX 全套合约（核心、现货、治理），并运行前端进行交互。即使是刚接触 web3 的开发者，也能一步一步完成部署与使用。

> 目标：
> - 使用你自己的私钥账户进行合约部署（不使用公共地址）
> - 部署完成后，将 `GOVERNOR_ROLE` 授予你指定的地址
> - 将部署快照同步到前端，使应用可正常解析并使用你刚部署的合约
> - 启动前端，验证 `Perpetual` 与 `Spot` 页面功能

---

## 1. 环境准备

- 操作系统：macOS（其他系统亦可，本指南以 macOS 为例）
- 必备软件：
  - Node.js `>= 18` 与 npm `>= 8`（建议使用 Node 20）
  - Git（用于获取或更新项目）
  - Hardhat（随依赖安装）
  - Foundry（用于 forge 编译；可选但推荐）
  - 一个 EVM 钱包（如 MetaMask）

- 安装依赖（在项目根目录执行）：
  - `npm run install:all`（安装后端与前端依赖）
  - 若未安装 Foundry，可参考官方安装脚本（可选）：
    - `curl -L https://foundry.paradigm.xyz | bash`
    - 安装后运行 `foundryup`

---

## 2. 创建部署账户并领取 PAS 测试币

- 使用钱包（如 MetaMask）创建一个新账户，或使用现有账户。
- 导出私钥（必须保密）：
  - MetaMask：账户详情 → 导出私钥（需输入钱包密码）→ 获得形如 `0x` 开头、后面 64 位十六进制字符串的私钥。

- 在部署前为该账户领取 PAS 测试币：
  - 打开 `https://faucet.polkadot.io/`
  - Network选Polkadot testnet (Paseo)，Chain选Passet Hub: smart contracts
  - 输入你的 AssetHub EVM 地址（钱包地址）
  - 通过验证码后提交，即可领取 100 PAS（每 24 小时可领取一次）
  - 若需要为特定 parachain 领取，可点击“Use custom chain id”并填写相应 parachain ID（详见页面说明）

> 说明：PAS 是 AssetHub 测试网的原生 gas 代币。部署与后续管理操作均需要一定数量 PAS 以支付交易费用。

---

## 3. 配置环境变量 `.env`

在项目根目录创建 `.env` 文件，用于配置部署所需的私钥和相关地址。示例（请按需修改）：

```
# 使用你自己的私钥（必须以 0x 开头的 64 位十六进制，不能全 0）
PRIVATE_KEY=0x<你的64位私钥>

# AssetHub 测试网 RPC（可使用默认，无需修改）
ASSETHUB_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io

# Token 地址
USDC_ADDRESS=0x38bfa3e4Ad582a04de3fb518Dcb8e2b94D3F6226
BTC_ADDRESS=0x07f2055e0c9BD7330796F60BD54a2ABBcD2478A2
USDT_ADDRESS=0xF709b6038335E303eA7597bc19887E29508F3be8

# 也可以用你自己的，仅测试用的话用我已经部署好的默认的即可
# USDC_ADDRESS=0x<AssetHub上USDC地址>
# BTC_ADDRESS=0x<AssetHub上BTC地址>
# USDT_ADDRESS=0x<AssetHub上USDT地址>

# 费用归集地址（可选，不设置则使用部署者地址）
TREASURY_ADDRESS=0x<你的归集地址>

# 治理参数（可选，有默认值）
VOTING_BLOCKS=40
APPROVAL_BPS=8000
```

注意事项：
- `PRIVATE_KEY` 必须有效且非全 0。例如：`0xabcdef...` 共 66 个字符（含前缀）。
- USDC、BTC 地址需要是 AssetHub 测试网已有的 ERC-20 合约地址。若不确定，可咨询你的团队或使用额外脚本检查。
- `.env` 不应提交到版本库（已在 .gitignore 中）。

---

## 4. 编译合约

在项目根目录执行：

- 首选：`npm run build:contracts`（会运行 `forge build` 与 `npx hardhat compile`）
- 若未安装 Foundry：`npx hardhat compile`（只用 Hardhat 编译亦可）

编译成功后会生成 `artifacts/` 等文件。

---

## 5. 一键部署到 AssetHub 测试网

部署脚本：`scripts/deploy-assethub-all.js`

该脚本会完成以下工作：
- 部署核心模块（`OracleAdapter`、`MarginVault`、`PerpMarket`、`RiskEngine`、`FeeCollector`、`OrderBook`）并做好互相引用的“布线”
- 将 USDC/BTC（以及可选的 USDT）添加为抵押物
- 创建并配置 `BTC-USD` 永续市场
- 部署现货模块（`SpotMarket`、`SpotOrderBook`），添加并激活 `PAS/USDC` 与 `USDC/PAS` 市场
- 部署治理模块（`TokenListingGovernor` 原生 PAS 版）并授予其 `SpotMarket.GOVERNOR_ROLE`
- 将部署结果保存到 `deployments/assethub/deployment.json`

执行命令（在项目根目录）：

```
npx hardhat run --network assethub scripts/deploy-assethub-all.js
```

预期输出：
- 控制台打印部署者地址、链 ID（AssetHub 为 `420420422`）、余额等信息
- 逐个模块的地址（如 `SpotMarket: 0x...`）
- 成功添加并激活现货市场的交易哈希
- 保存快照：`deployments/assethub/deployment.json`

常见错误与处理：
- `Expected valid bigint: 0 < bigint < curve.n`
  - 原因：`PRIVATE_KEY` 未设置、格式错误或为全 0
  - 处理：确保 `.env` 中为有效私钥（`0x` + 64 位十六进制，且非全 0）
- `缺少 USDC 或 BTC 地址...`
  - 原因：未提供 `USDC_ADDRESS` 或 `BTC_ADDRESS`
  - 处理：在 `.env` 正确填入 AssetHub 上已部署的 ERC-20 地址

---

## 6. 授予 GOVERNOR_ROLE 给指定地址

部署脚本已自动将 `GOVERNOR_ROLE` 授予 `TokenListingGovernor`。如果你需要将该权限额外授予其他运营或机器人地址，可运行：

脚本：`scripts/grant-spot-governor.js`

环境变量：
- `PRIVATE_KEY`：必须为当前 `SpotMarket` 的 `DEFAULT_ADMIN_ROLE` 管理员的私钥（通常是部署者）
- `TARGET_ADDR`：你希望授予 `GOVERNOR_ROLE` 的目标地址
- `SPOT_MARKET_ADDR`：可选，不提供时脚本会从 `deployments/assethub/deployment.json` 读取

执行命令（在项目根目录）：

```
# 将 TARGET_ADDR 替换为你希望授予权限的地址
export TARGET_ADDR=0xYourTargetGovernorAddress
npx hardhat run --network assethub scripts/grant-spot-governor.js
```

预期输出：
- 打印签名者（管理员）地址与 `SpotMarket` 地址
- 交易哈希与授予结果（`Granted GOVERNOR_ROLE to ...`）

若出现管理员权限不足：
- 确保 `PRIVATE_KEY` 对应的地址已经是 `SpotMarket` 的 `DEFAULT_ADMIN_ROLE`
- 若不是，可用 `scripts/grant-default-admin-assethub.js`（需当前管理员执行）将 `DEFAULT_ADMIN_ROLE` 授予你的部署者地址，然后重试

---

## 7. 同步部署快照到前端

前端会从 `frontend/src/lib/contracts/deployed-assethub.json` 读取 AssetHub 的合约与 Token 地址。请将部署后的快照合并到该文件中。

1) 拷贝或合并 `deployments/assethub/deployment.json` 的关键信息到：

- `frontend/src/lib/contracts/deployed-assethub.json`

示例结构（请替换为你实际部署输出中的地址与字段）：

```json
{
  "contracts": {
    "OracleAdapter": "0x...",
    "MarginVault": "0x...",
    "OrderBook": "0x...",
    "PerpMarket": "0x...",
    "RiskEngine": "0x...",
    "FeeCollector": "0x...",
    "SpotMarket": "0x...",
    "SpotOrderBook": "0x...",
    "TokenListingGovernor": "0x..."
  },
  "tokens": {
    "USDC": "0x...",
    "BTC": "0x...",
    "USDT": "0x..."  
  },
  "markets": ["BTC-USD", "PAS/USDC", "USDC/PAS"],
  "network": "assethub-testnet",
  "chainId": 420420422,
  "deployer": "0xYourDeployerAddress",
  "timestamp": "2025-..."
}
```

2) 设置前端 RPC（可选）：
- 在 `frontend/.env.local` 中添加：

```
NEXT_PUBLIC_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
```

说明：
- 前端默认链（`DEFAULT_CHAIN_ID`）已设为 `420420422`。
- AssetHub 的 `SpotMarket`、`SpotOrderBook`、`OracleAdapter` 等地址将从 `deployed-assethub.json` 中读取。

---

## 8. 启动前端并使用

在项目根目录或前端目录执行：

```
cd frontend
npm install
npm run dev
```

- 开发服务器默认监听 `http://localhost:3000/`
- 在浏览器打开后：
  - 导航栏上将看到 `Perpetual`（已替换原 `Trading` 文案）
  - `Perpetual` 页面（`/trading`）：选择并查看 `BTC-USD` 永续市场
  - `Spot` 页面（`/spot`）：应能看到 `PAS/USDC` 与 `USDC/PAS` 市场

### 连接钱包到 AssetHub 测试网

在 MetaMask 中手动添加网络：
- 网络名称：`AssetHub Testnet`
- RPC URL：`https://testnet-passet-hub-eth-rpc.polkadot.io`
- Chain ID：`420420422`
- 货币符号：`PAS`
- 区块浏览器：`https://blockscout-passet-hub.parity-testnet.parity.io/`

> 连接到该网络后，即可在前端与合约交互（下单、查看订单簿、历史等）。请确保你的账户余额有足够 PAS 用于支付 gas。

---

## 9. 验证与辅助脚本（可选）

- 检查 AssetHub USDC 信息：

```
npx hardhat run --network assethub scripts/check-assethub-usdc.js
```

- 列出现货市场（如需自定义脚本读取 `deployed-assethub.json` 并打印 `PAS/USDC` / `USDC/PAS` 状态，可参考 `scripts/list-spot-markets.js` 思路做简单修改）。

---

## 10. 常见问题与排查

- 私钥错误：
  - 错误信息：`Expected valid bigint: 0 < bigint < curve.n`
  - 原因：`PRIVATE_KEY` 未设置、格式错误或为全 0
  - 解决：确保 `.env` 中为有效私钥（`0x` + 64 位十六进制，且非全 0）

- 余额不足：
  - 部署或授予角色时报错，`insufficient funds for intrinsic transaction cost`
  - 解决：到 `https://faucet.polkadot.io/` 再次领取 PAS（每 24h 可领取一次）

- RPC 不通或链 ID 不匹配：
  - 解决：确认 `ASSETHUB_RPC_URL` 与前端 `NEXT_PUBLIC_RPC_URL` 指向 `https://testnet-passet-hub-eth-rpc.polkadot.io`
  - 部署输出中的链 ID 应为 `420420422`

- 前端无法解析合约地址：
  - 解决：确保 `frontend/src/lib/contracts/deployed-assethub.json` 中的合约与 Token 地址与你刚部署的地址一致；不要混用旧快照

- 现货市场未激活：
  - 说明：部署脚本已尝试添加并激活 `PAS/USDC` 与 `USDC/PAS`
  - 若未激活，可使用拥有 `GOVERNOR_ROLE` 的地址调用 `activateMarket(marketId)` 或通过治理脚本处理

---

## 11. 命令速查

- 安装与编译：
  - `npm run install:all`
  - `npm run build:contracts`

- 一键部署到 AssetHub：
  - `npx hardhat run --network assethub scripts/deploy-assethub-all.js`

- 授予 GOVERNOR_ROLE：
  - `export TARGET_ADDR=0x...`
  - `npx hardhat run --network assethub scripts/grant-spot-governor.js`

- 启动前端：
  - `cd frontend && npm run dev`

---

## 12. 安全提示

- 切勿将真实私钥提交到代码仓库或分享给他人。
- 建议在部署完成后，尽快将运维所需权限分配到专用的运营或机器人地址，降低风险。
- 如需更细致的权限管理（如分配 `DEFAULT_ADMIN_ROLE`），请使用对应授权脚本并确保调用者具备当前管理员权限。

---

祝你部署顺利！如果遇到问题，可结合本指南的排查章节逐步定位并解决，或与团队协作确认 Token 地址与网络环境配置。