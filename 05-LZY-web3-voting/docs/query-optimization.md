# 区块链查询优化策略

## 概述

为了减少对区块链的查询频率，提高应用性能并降低 RPC 节点负载，我们对各个页面的数据查询进行了优化。

## 优化策略

### 1. BTCOracle Hook 优化 (`useBTCOracle`)

#### 查询分类

**静态数据（不自动刷新）**

- `currentVotingPeriod` - 当前投票期 ID
- `competitorCount` - 竞争链数量
- `getAllCompetitors` - 所有竞争链信息

这些数据通常不会频繁变化，禁用自动刷新（`refetchInterval: false`）。

**动态数据（30秒刷新）**

- `snapshotCount` - 快照数量
- `latestSnapshot` - 最新快照数据
- `votingPeriodInfo` - 投票期信息
- `lastSnapshotTime` - 最后快照时间
- `canTakeSnapshot` - 是否可以拍摄快照

这些数据需要定期更新，但不需要太频繁，设置为 30 秒刷新一次。

**价格数据（60秒刷新）**

- `btcPrice` - BTC 价格

价格数据变化相对平缓，设置为 60 秒刷新一次。

### 2. VotingContract Hook 优化

**投票页面（需要实时性）**

- `ticketBalance` - 5秒刷新（用户需要看到余额变化）
- `userVoteCount` - 5秒刷新（投票后需要更新）

**开奖页面（不需要实时性）**

- `getUserVotingHistory` - 仅在钱包连接且投票期已开奖时手动调用
- 不使用自动轮询

### 3. 页面级优化

#### Reveal 页面 (`/reveal`)

**数据加载策略：**

1. BTCOracle 数据：30秒轮询
2. 用户投票历史：只在以下情况加载
   - 钱包已连接
   - 投票期已开奖
   - 不自动刷新，仅加载一次

**优化效果：**

- 未连接钱包：每30秒查询约 8 次
- 已连接但未开奖：每30秒查询约 8 次
- 已连接且已开奖：首次加载查询约 9 次，后续每30秒查询约 8 次

#### Vote 页面 (`/vote`)

**数据加载策略：**

1. 投票券余额：5秒轮询（需要实时看到余额变化）
2. 投票历史：实时更新
3. 投票期信息：5秒轮询

**原因：**

- 投票页面需要更高的实时性
- 用户投票后需要立即看到余额变化

#### Stake 页面 (`/stake`)

**数据加载策略：**

1. 质押余额：5秒轮询
2. 质押历史：按需加载

## 查询频率对比

### 优化前

- 所有数据：默认 Wagmi 轮询（约 4-5 秒）
- 估计每分钟查询：~150 次

### 优化后

- 静态数据：不刷新（0 次/分钟）
- 动态数据：30秒（2 次/分钟）
- 价格数据：60秒（1 次/分钟）
- 估计每分钟查询：~30-40 次

**查询减少：约 75%**

## 实施建议

### 1. 根据页面类型调整

**需要实时性的页面：**

- 投票页面
- 质押页面
- 交易页面

保持较短的轮询间隔（5-10秒）。

**信息展示页面：**

- 开奖页面
- 统计页面
- 历史记录页面

使用较长的轮询间隔（30-60秒）或按需加载。

### 2. 使用缓存策略

```typescript
// Wagmi 的 query 配置
query: {
  refetchInterval: 30000,      // 30秒自动刷新
  refetchOnWindowFocus: false, // 禁用窗口聚焦刷新
  staleTime: 20000,            // 20秒内认为数据新鲜
  cacheTime: 60000,            // 缓存60秒
}
```

### 3. 按需加载数据

```typescript
// 只在需要时调用
React.useEffect(() => {
  if (shouldLoad) {
    void fetchData();
  }
}, [shouldLoad]);
```

### 4. 批量查询

如果可能，将多个查询合并为单个合约调用：

```solidity
// 合约端
function getBatchData() external view returns (
    uint256 balance,
    uint256 voteCount,
    bool canVote
) {
    // 返回多个数据
}
```

## 监控和调优

### 关键指标

1. **RPC 调用次数**
   - 目标：< 50 次/分钟/用户
2. **页面加载时间**
   - 目标：< 2 秒
3. **数据新鲜度**
   - 关键数据：< 10 秒延迟
   - 一般数据：< 60 秒延迟

### 调优建议

1. **监控实际查询频率**

   ```typescript
   // 添加日志
   console.log(`[Query] ${functionName} called`);
   ```

2. **根据用户行为调整**
   - 用户活跃时：增加刷新频率
   - 用户不活跃：降低刷新频率

3. **使用 WebSocket（如果可用）**
   - 监听合约事件
   - 只在事件发生时更新数据

## 最佳实践

1. **避免不必要的查询**

   ```typescript
   // ❌ 不好
   const { data } = useReadContract({
     functionName: "getData",
     query: { refetchInterval: 1000 },
   });

   // ✅ 好
   const { data } = useReadContract({
     functionName: "getData",
     query: {
       refetchInterval: 30000,
       enabled: isVisible,
     },
   });
   ```

2. **禁用不必要的自动刷新**

   ```typescript
   query: {
     refetchOnWindowFocus: false,
     refetchOnReconnect: false,
     refetchOnMount: false,
   }
   ```

3. **使用条件查询**
   ```typescript
   query: {
     enabled: !!address && needsData,
   }
   ```

## 总结

通过合理的查询优化策略：

- ✅ 减少了 75% 的区块链查询
- ✅ 提高了应用响应速度
- ✅ 降低了 RPC 节点负载
- ✅ 保持了必要的数据实时性

记住：**不是所有数据都需要实时更新，按需优化是关键！**
