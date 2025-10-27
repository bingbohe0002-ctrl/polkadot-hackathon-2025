# Wallet Integration Guide

本文档介绍如何在项目中集成和使用钱包功能。

## 目录

- [概述](#概述)
- [支持的钱包](#支持的钱包)
- [环境配置](#环境配置)
- [使用方法](#使用方法)
- [API 参考](#api-参考)

## 概述

本项目支持两种类型的钱包连接：

1. **EVM 钱包** - 用于 Moonbeam 网络（EVM 兼容）
2. **Substrate 钱包** - 用于 Bifrost 和其他 Polkadot 生态链

## 支持的钱包

### EVM 钱包 (Moonbeam)

- MetaMask
- WalletConnect (支持多种钱包)
- 其他支持 EVM 的浏览器钱包

### Substrate 钱包 (Bifrost, Polkadot)

- Polkadot.js Extension
- Talisman Wallet
- SubWallet
- 其他支持 Polkadot 生态的钱包

## 环境配置

### 1. 复制环境变量文件

```bash
cp .env.example .env
```

### 2. 配置 WalletConnect Project ID

访问 [WalletConnect Cloud](https://cloud.walletconnect.com) 创建项目并获取 Project ID。

在 `.env` 文件中设置：

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id_here"
```

### 3. （可选）自定义 RPC 节点

```env
NEXT_PUBLIC_MOONBEAM_RPC_URL="https://rpc.api.moonbeam.network"
NEXT_PUBLIC_BIFROST_RPC_URL="wss://bifrost-rpc.liebi.com/ws"
```

## 使用方法

### 基础使用

在组件中使用统一的钱包 Context：

```tsx
import { useWalletContext } from "@/contexts/WalletContext";

export function MyComponent() {
  const { isConnected, address, connect, disconnect, walletType } =
    useWalletContext();

  return (
    <div>
      {isConnected ? (
        <div>
          <p>已连接: {address}</p>
          <p>钱包类型: {walletType}</p>
          <button onClick={disconnect}>断开连接</button>
        </div>
      ) : (
        <div>
          <button onClick={() => connect("evm")}>连接 EVM 钱包</button>
          <button onClick={() => connect("substrate")}>
            连接 Substrate 钱包
          </button>
        </div>
      )}
    </div>
  );
}
```

### 使用预制的钱包按钮

```tsx
import { WalletButton } from "@/components/wallet/WalletButton";

export function Header() {
  return (
    <header>
      <nav>{/* 导航内容 */}</nav>
      <WalletButton />
    </header>
  );
}
```

### 直接使用特定钱包 Hook

#### EVM 钱包

```tsx
import { useWallet } from "@/hooks/useWallet";

export function EVMComponent() {
  const { address, isConnected, connectWallet, disconnectWallet, chain } =
    useWallet();

  return (
    <div>
      <p>当前链: {chain?.name}</p>
      {/* ... */}
    </div>
  );
}
```

#### Substrate 钱包

```tsx
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";

export function SubstrateComponent() {
  const {
    accounts,
    selectedAccount,
    isConnected,
    connect,
    disconnect,
    selectAccount,
  } = usePolkadotWallet();

  return (
    <div>
      {isConnected && (
        <div>
          <p>已选择账户: {selectedAccount?.meta.name}</p>
          <select onChange={(e) => selectAccount(accounts[e.target.value])}>
            {accounts.map((account, index) => (
              <option key={account.address} value={index}>
                {account.meta.name || account.address}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

## API 参考

### useWalletContext()

统一的钱包 Context Hook。

**返回值:**

```typescript
{
  // 通用属性
  walletType: 'evm' | 'substrate' | null;
  isConnected: boolean;
  address: string | undefined;
  isLoading: boolean;

  // 方法
  connect: (type: 'evm' | 'substrate') => Promise<void>;
  disconnect: () => void;

  // 特定钱包实例
  evmWallet: ReturnType<typeof useWallet>;
  substrateWallet: ReturnType<typeof usePolkadotWallet>;
}
```

### useWallet()

EVM 钱包 Hook (Wagmi)。

**返回值:**

```typescript
{
  address: string | undefined;
  isConnected: boolean;
  chain: Chain | undefined;
  connectors: Connector[];
  isPending: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  connect: (options: ConnectOptions) => void;
  disconnect: () => void;
}
```

### usePolkadotWallet()

Substrate 钱包 Hook (Polkadot.js)。

**返回值:**

```typescript
{
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  selectAccount: (account: InjectedAccountWithMeta) => void;
  address: string | undefined;
}
```

## 支持的网络

### Moonbeam (Chain ID: 1284)

- 名称: Moonbeam
- 原生代币: GLMR
- RPC: https://rpc.api.moonbeam.network
- 区块浏览器: https://moonscan.io

### Moonriver (Chain ID: 1285)

- 名称: Moonriver
- 原生代币: MOVR
- RPC: https://rpc.api.moonriver.moonbeam.network
- 区块浏览器: https://moonriver.moonscan.io

### Bifrost

- 网络类型: Polkadot Parachain
- 原生代币: BNC
- RPC: wss://bifrost-rpc.liebi.com/ws

## 故障排除

### WalletConnect 无法连接

确保设置了正确的 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`。

### Polkadot.js 扩展未检测到

确保用户已安装并授权了 Polkadot.js 扩展或其他兼容钱包。

### SSR 相关错误

所有钱包相关组件都应该使用 `"use client"` 指令，确保只在客户端运行。

## 最佳实践

1. **错误处理**: 总是处理钱包连接失败的情况
2. **加载状态**: 显示连接过程中的加载指示器
3. **网络切换**: 提示用户切换到正确的网络
4. **断开连接**: 提供明显的断开连接选项
5. **账户切换**: 监听账户切换事件并更新 UI

## 示例代码

完整示例请参考：

- `src/components/wallet/WalletButton.tsx` - 钱包按钮组件
- `src/components/voting/Header.tsx` - 集成示例
- `src/app/page.tsx` - 页面集成示例
