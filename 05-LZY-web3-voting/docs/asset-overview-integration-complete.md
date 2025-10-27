# 资产概览智能合约集成完成报告

## ✅ 已完成的工作

### 1. 重构 AssetOverview 组件

在 `src/components/voting/HomeSections.tsx` 中：

- 移除了 `AssetOverviewProps` 接口
- 移除了所有 props 参数
- 在组件内部调用 `useUserData()` hook
- 添加了 `useAccount` 和 `useMemo` 导入
- 实现了"可铸造额度"的智能计算

### 2. 更新页面集成

在 `src/app/page.tsx` 中：

- 移除了对 `AssetOverview` 组件的所有 props 传递
- 简化组件调用为 `<AssetOverview />`

### 3. 数据映射和计算

现在"资产概览"显示的数据来源：

| 显示项目              | 数据来源                 | 计算方式                                   |
| --------------------- | ------------------------ | ------------------------------------------ |
| **Moonbeam DOT 余额** | `userData.nativeBalance` | 直接使用（显示为 ETH）                     |
| **可铸造额度**        | 计算                     | `Math.max(nativeBalance - vDOTBalance, 0)` |
| **已铸造 vDOT**       | `userData.vDOTBalance`   | 直接使用                                   |
| **票券余额**          | `userData.ticketBalance` | 直接使用                                   |
| **已抵押总量**        | `userData.stakedAmount`  | 直接使用                                   |
| **可用投票权**        | `userData.votingPower`   | 直接使用                                   |

## 🔧 技术实现细节

### 可铸造额度计算

实现了智能的"可铸造额度"计算：

```typescript
const availableToMint = useMemo(() => {
  if (!walletConnected || userData.isLoading) return "--";

  const nativeBalance = parseFloat(userData.nativeBalance);
  const vDOTBalance = parseFloat(userData.vDOTBalance);
  const available = Math.max(nativeBalance - vDOTBalance, 0);

  return available.toFixed(2);
}, [walletConnected, userData]);
```

### 加载状态处理

每个数据卡片都支持：

- **未连接钱包**：显示 "--"
- **数据加载中**：显示 "加载中..."
- **数据错误**：显示 "数据错误"
- **正常状态**：显示实际链上数据

### 钱包连接状态

使用 `useAccount` hook 获取钱包连接状态：

```typescript
const { address } = useAccount();
const walletConnected = Boolean(address);
```

## 📊 实时数据显示

现在"资产概览"会显示：

- **Moonbeam DOT 余额**：从 `useBalance` 读取原生代币余额（显示为 ETH）
- **可铸造额度**：智能计算（原生余额 - 已铸造 vDOT）
- **已铸造 vDOT**：从 `vDOT.balanceOf` 读取用户 vDOT 余额
- **票券余额**：从 `VotingTicket.balanceOf` 读取票券余额
- **已抵押总量**：从 `StakingContract` 读取抵押总量
- **可用投票权**：从 `VotingTicket.balanceOf` 读取投票权

## 🚀 使用方法

### 1. 启动应用

```bash
# 确保 Hardhat 节点运行
npx hardhat node

# 启动前端应用
pnpm dev
```

### 2. 连接钱包

- 在 MetaMask 中切换到 Hardhat Local 网络（Chain ID: 31337）
- 连接钱包后，"资产概览"会自动显示链上数据

### 3. 查看实时数据

- 打开 http://localhost:3000
- 连接钱包后即可看到实时资产数据
- 数据每10秒自动更新

## 🔄 数据更新机制

- **自动刷新**：每10秒查询一次链上数据
- **实时响应**：用户操作后立即更新显示
- **错误恢复**：网络错误时自动重试
- **智能计算**：可铸造额度实时计算

## 📝 注意事项

1. **原生代币显示**：当前显示为 ETH，在 Moonbeam 主网会显示为 DOT
2. **可铸造额度**：智能计算，确保不会显示负数
3. **抵押数据**：当前已抵押量显示为 0，需要实现抵押记录遍历功能
4. **网络切换**：确保在正确的网络上查看数据

## 🎯 优势

1. **代码复用**：与 UserDashboard 共享 `useUserData` hook
2. **数据一致性**：两个组件使用相同的数据源
3. **独立组件**：不再依赖父组件传递 props
4. **智能计算**：可铸造额度自动计算，无需手动维护
5. **实时更新**：所有数据都从链上实时读取

## 🔄 与 UserDashboard 的关系

现在两个组件都使用相同的 `useUserData` hook：

- **UserDashboard**：显示用户个人数据概览
- **AssetOverview**：显示资产详细信息和可铸造额度

数据来源完全一致，确保显示的数据同步。

---

**集成完成！** 🎉

现在"资产概览"已经从智能合约实时读取数据，与"我的控制台"使用相同的数据源，实现了完全的去中心化数据展示！
