# 多链市值喂价系统设计文档

## 概述

本系统实现了基于 Chainlink 的多链市值监控和投票开奖机制，支持动态配置竞争链，在投票期结束时自动检查是否有任意竞争链市值超过 BTC，并触发开奖。

## 系统架构

### 核心合约

1. **BTCOracle** - 多链市值预言机
2. **VotingContract** - 投票合约
3. **VotingTicket** - 投票券代币
4. **StakingContract** - 质押合约
5. **vDOT** - 包装代币

### 数据流

```
Chainlink Price Feeds → BTCOracle → VotingContract → 开奖结果
```

## 核心功能

### 1. 多竞争链动态配置

#### 竞争链数据结构

```solidity
struct CompetitorChain {
    string name;                    // 链名称
    address priceFeed;              // Chainlink 价格源地址
    uint256 circulatingSupply;      // 流通供应量
    bool isActive;                  // 是否激活
    uint256 lastUpdatedTime;        // 最后更新时间
}
```

#### 管理功能

- `addCompetitor()` - 添加新的竞争链
- `updateCompetitorSupply()` - 更新流通供应量
- `setCompetitorActive()` - 启用/禁用竞争链
- `updateBTCSupply()` - 更新 BTC 流通供应量

### 2. 市值计算逻辑

#### 改进的市值计算

```solidity
function _getMarketCaps() internal view returns (
    uint256 btcCap,
    uint256[] memory competitorCaps
) {
    // 获取 BTC 市值
    btcCap = calculateMarketCap(btcPrice, btcCirculatingSupply);

    // 获取所有激活竞争链市值
    for (uint256 i = 0; i < competitorCount; i++) {
        if (competitors[i].isActive) {
            competitorCaps[i] = calculateMarketCap(price, supply);
        }
    }
}
```

### 3. 开奖触发机制

#### 自动触发

- 24小时快照机制
- 投票期结束时自动检查
- 任意竞争链市值超过 BTC 时立即开奖

#### 手动触发

- `finalizeVotingPeriod()` - 管理员手动结算投票期
- 适用于投票期结束后未自动开奖的情况

### 4. 快照数据结构

```solidity
struct MarketSnapshot {
    uint256 timestamp;
    uint256 btcMarketCap;
    mapping(uint256 => uint256) competitorMarketCaps;
    uint256 highestCompetitorCap;
    uint256 winningCompetitorId;
    VoteResult result;
}
```

## 部署配置

### Chainlink 价格源地址

#### Mainnet

- BTC/USD: `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`
- ETH/USD: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- BNB/USD: `0x14e613AC84a31f709eadbdFd89ac0C5C2f9b8b5`

#### Testnet (Goerli)

- BTC/USD: `0xA39434A63A52E749F02807ae27335515BA4b07F7`
- ETH/USD: `0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e`

### 初始竞争链配置

1. **Ethereum**
   - 流通供应量: 1.2亿 ETH
   - 价格源: ETH/USD

2. **BNB Chain**
   - 流通供应量: 1.55亿 BNB
   - 价格源: BNB/USD

### 市值阈值设置

- BTC 市值阈值: 1万亿美元
- 竞争链市值阈值: 5000亿美元

## 使用方法

### 1. 部署合约

```bash
# 部署多链预言机系统
npx hardhat run scripts/deploy-multi-chain-oracle.js --network hardhat

# 测试功能
npx hardhat run scripts/test-btc-oracle.js --network hardhat
```

### 2. 添加竞争链

```javascript
// 添加 Solana 竞争链
await btcOracle.addCompetitor(
  "Solana",
  "0x...", // SOL/USD price feed
  ethers.parseEther("550000000"), // 5.5亿 SOL
);
```

### 3. 更新供应量

```javascript
// 更新 ETH 流通供应量
await btcOracle.updateCompetitorSupply(
  0, // Ethereum ID
  ethers.parseEther("125000000"), // 新供应量
);
```

### 4. 手动结算投票期

```javascript
// 投票期结束后手动结算
await btcOracle.finalizeVotingPeriod(1);
```

## 查询接口

### 竞争链信息

- `getCompetitorInfo(uint256 competitorId)` - 获取单个竞争链信息
- `getAllCompetitors()` - 获取所有竞争链信息

### 快照数据

- `getSnapshotCount(uint256 votingPeriodId)` - 获取快照数量
- `getSnapshot(uint256 votingPeriodId, uint256 snapshotIndex)` - 获取指定快照
- `getCompetitorMarketCap(uint256 votingPeriodId, uint256 snapshotIndex, uint256 competitorId)` - 获取竞争链市值

### 投票期状态

- `isVotingPeriodResolved(uint256 votingPeriodId)` - 检查是否已开奖
- `getVotingEndTime(uint256 votingPeriodId)` - 获取投票期结束时间

## 事件日志

### 竞争链管理事件

- `CompetitorAdded(uint256 indexed competitorId, string name, address priceFeed)`
- `CompetitorUpdated(uint256 indexed competitorId, uint256 newSupply)`
- `CompetitorStatusChanged(uint256 indexed competitorId, bool active)`
- `BTCSupplyUpdated(uint256 newSupply)`

### 快照和开奖事件

- `MarketSnapshotTaken(uint256 indexed votingPeriodId, uint256 btcCap, uint256 highestCompetitorCap, uint256 winningCompetitorId)`
- `VotingPeriodFinalized(uint256 indexed votingPeriodId, uint256 correctYear)`

## 安全考虑

### 访问控制

- 所有管理功能仅限 Owner 调用
- Oracle 合约地址验证
- 紧急暂停机制

### 数据验证

- 价格源地址验证
- 供应量合理性检查
- 时间间隔验证

### 防重放攻击

- 投票期状态检查
- 快照时间间隔控制
- 重复开奖防护

## 扩展性

### 添加新的竞争链

1. 调用 `addCompetitor()` 添加新的价格源和供应量
2. 系统自动开始监控该竞争链的市值
3. 无需修改其他合约代码

### 集成其他数据源

- 支持 Chainlink Functions 获取更复杂的市值数据
- 可扩展支持自定义 API 数据源
- 支持多数据源聚合验证

### 自动化部署

- 支持 Chainlink Automation 定时触发快照
- 可配置不同的快照间隔
- 支持条件触发开奖

## 监控和运维

### 关键指标监控

- 价格源可用性
- 快照执行状态
- 市值计算准确性
- 开奖触发时机

### 告警机制

- 价格源异常告警
- 快照失败告警
- 市值异常波动告警

### 数据备份

- 快照历史数据
- 配置变更记录
- 事件日志完整性

## 升级路径

### 合约升级

- 使用代理模式支持逻辑升级
- 保持状态数据不变
- 向后兼容性保证

### 功能扩展

- 支持更多投票选项
- 添加复杂的开奖条件
- 集成 DeFi 协议

## 测试策略

### 单元测试

- 市值计算准确性
- 竞争链管理功能
- 开奖触发逻辑

### 集成测试

- 与 Chainlink 价格源交互
- 跨合约调用验证
- 端到端流程测试

### 压力测试

- 大量竞争链场景
- 高频快照执行
- 并发访问处理

## 总结

多链市值喂价系统提供了灵活、可扩展的比特币市值预测投票解决方案。通过动态配置竞争链、实时市值监控和自动开奖机制，系统能够准确反映市场变化并公平地分配奖励。

关键优势：

- **灵活性**: 支持动态添加/删除竞争链
- **准确性**: 可更新流通供应量保证市值计算准确
- **自动化**: 24小时自动快照，投票期结束时自动判定
- **透明性**: 完整的快照历史和事件日志
- **安全性**: Owner 控制关键参数，防止恶意操作
