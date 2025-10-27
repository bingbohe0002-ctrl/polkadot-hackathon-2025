# DeciCourt 技术文档

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

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

## 合约接口

### JuryToken (ERC20)
- `name()`: 获取代币名称
- `symbol()`: 获取代币符号  
- `balanceOf(address)`: 查询余额
- `transfer(address, uint256)`: 转账

### DeciCourt (主合约)
- `registerJuror()`: 注册陪审员
- `createCase(address, string)`: 创建案件
- `commitVote(uint256, bytes32)`: 提交投票承诺
- `revealVote(uint256, uint8, uint256)`: 揭示投票
- `resolveCase(uint256)`: 结算案件

## 测试网信息

**网络**: Passet Hub Testnet  
**Chain ID**: 420420422  
**RPC**: https://testnet-passet-hub-eth-rpc.polkadot.io  
**浏览器**: https://blockscout-passet-hub.parity-testnet.parity.io/

**已部署合约**:
- JuryToken: `0x07eB8A200793Ec7055ADD629C926cE6c65DC68Ac`
- DeciCourt: `0x1A327ff18EF54eCF1B0AE4F885B78eCcF00A003E`


## 核心特性

1. **去中心化仲裁**: 无需传统司法介入
2. **经济激励**: 基于代币的奖惩机制
3. **透明公正**: 链上记录所有流程
4. **防作弊机制**: 承诺-揭示投票
5. **声誉系统**: 基于历史表现的信用机制