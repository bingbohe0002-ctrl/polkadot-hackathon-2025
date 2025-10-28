# WalletConnect Provider 配置指南

本项目已经配置好了完整的 Web3 钱包交互功能，支持 Moonbeam (EVM) 和 Bifrost (Substrate) 两种类型的钱包。

## 🚀 快速开始

### 1. 安装依赖

依赖已经安装完成：

```bash
✅ @polkadot/extension-dapp - Polkadot 钱包交互
✅ @polkadot/api - Polkadot API
✅ viem - EVM 交互库
✅ wagmi - React hooks for Ethereum
✅ @web3modal/wagmi - WalletConnect UI
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

在 `.env` 中设置你的 WalletConnect Project ID：

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="你的项目ID"
```

**获取 Project ID：**

1. 访问 https://cloud.walletconnect.com
2. 注册并创建新项目
3. 复制 Project ID

### 3. 使用钱包功能

#### 方式一：使用预制的 WalletButton 组件

```tsx
import { WalletButton } from "@/components/wallet/WalletButton";

export function YourComponent() {
  return (
    <header>
      <WalletButton />
    </header>
  );
}
```

#### 方式二：使用 useWalletContext Hook

```tsx
import { useWalletContext } from "@/contexts/WalletContext";

export function YourComponent() {
  const { isConnected, address, connect, disconnect, walletType } =
    useWalletContext();

  return (
    <div>
      {isConnected ? (
        <>
          <p>地址: {address}</p>
          <p>类型: {walletType}</p>
          <button onClick={disconnect}>断开</button>
        </>
      ) : (
        <>
          <button onClick={() => connect("evm")}>连接 Moonbeam 钱包</button>
          <button onClick={() => connect("substrate")}>
            连接 Bifrost 钱包
          </button>
        </>
      )}
    </div>
  );
}
```

## 📁 项目结构

```
src/
├── config/
│   ├── chains.ts              # 链配置（Moonbeam, Moonriver）
│   └── wagmi.ts               # Wagmi 配置
├── providers/
│   └── Web3Provider.tsx       # Web3 总 Provider
├── contexts/
│   └── WalletContext.tsx      # 统一钱包 Context
├── hooks/
│   ├── useWallet.ts           # EVM 钱包 Hook
│   ├── usePolkadotWallet.ts   # Substrate 钱包 Hook
│   └── useDemoWallet.ts       # Demo 钱包（用于测试）
└── components/
    └── wallet/
        └── WalletButton.tsx   # 钱包按钮组件
```

## 🔌 支持的钱包

### EVM 钱包（用于 Moonbeam）

- ✅ MetaMask
- ✅ WalletConnect（支持 100+ 钱包）
- ✅ Coinbase Wallet
- ✅ Trust Wallet
- ✅ Rainbow
- ✅ 其他 EVM 兼容钱包

### Substrate 钱包（用于 Bifrost）

- ✅ Polkadot.js Extension
- ✅ Talisman Wallet
- ✅ SubWallet
- ✅ 其他 Polkadot 生态钱包

## 🌐 支持的网络

### Moonbeam (Chain ID: 1284)

- **类型**: EVM Compatible Parachain
- **代币**: GLMR
- **RPC**: https://rpc.api.moonbeam.network
- **浏览器**: https://moonscan.io

### Moonriver (Chain ID: 1285)

- **类型**: EVM Compatible Parachain (Kusama)
- **代币**: MOVR
- **RPC**: https://rpc.api.moonriver.moonbeam.network
- **浏览器**: https://moonriver.moonscan.io

### Bifrost

- **类型**: Substrate Parachain
- **代币**: BNC
- **RPC**: wss://bifrost-rpc.liebi.com/ws

## 🎯 API 文档

### useWalletContext()

统一的钱包管理 Hook。

```typescript
const {
  // 状态
  walletType, // 'evm' | 'substrate' | null
  isConnected, // boolean
  address, // string | undefined
  isLoading, // boolean

  // 方法
  connect, // (type: 'evm' | 'substrate') => Promise<void>
  disconnect, // () => void

  // 子钱包实例
  evmWallet, // EVM 钱包实例
  substrateWallet, // Substrate 钱包实例
} = useWalletContext();
```

### useWallet() - EVM 专用

```typescript
const {
  address, // string | undefined
  isConnected, // boolean
  chain, // Chain | undefined
  connectors, // Connector[]
  isPending, // boolean
  connectWallet, // () => void
  disconnectWallet, // () => void
} = useWallet();
```

### usePolkadotWallet() - Substrate 专用

```typescript
const {
  accounts, // InjectedAccountWithMeta[]
  selectedAccount, // InjectedAccountWithMeta | null
  isConnected, // boolean
  isLoading, // boolean
  error, // string | null
  connect, // () => Promise<void>
  disconnect, // () => void
  selectAccount, // (account) => void
  address, // string | undefined
} = usePolkadotWallet();
```

## 🔧 更新现有 Header 组件

如果你想更新现有的 `Header.tsx` 使用新的钱包系统：

```tsx
// 替换原来的 useDemoWallet
import { useWalletContext } from "@/contexts/WalletContext";

export function Header() {
  const {
    isConnected: walletConnected,
    address: walletAddress,
    connect,
    disconnect
  } = useWalletContext();

  const onConnect = () => connect("evm"); // 或 "substrate"
  const onDisconnect = disconnect;

  // 其余代码保持不变
  return (
    // ... your header code
  );
}
```

或者直接使用新的 `HeaderWithWallet` 组件：

```tsx
import { HeaderWithWallet } from "@/components/voting/HeaderWithWallet";

export default function Layout({ children }) {
  return (
    <>
      <HeaderWithWallet />
      {children}
    </>
  );
}
```

## 📚 完整文档

更详细的文档请查看：

- `docs/wallet-integration.md` - 完整集成指南
- `src/components/wallet/WalletButton.tsx` - 组件源码参考
- `src/contexts/WalletContext.tsx` - Context 实现

## 🐛 故障排除

### 1. WalletConnect 不工作

- 确保设置了正确的 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- 检查网络连接

### 2. MetaMask 未检测到

- 确保已安装 MetaMask 扩展
- 刷新页面重试

### 3. Polkadot.js 扩展未检测到

- 安装 Polkadot.js Extension、Talisman 或 SubWallet
- 授权网站访问扩展

### 4. SSR 错误

- 确保所有钱包组件使用了 `"use client"` 指令
- 已在 Provider 层面处理 SSR

## 🎉 示例代码

查看以下文件获取完整示例：

- `src/components/wallet/WalletButton.tsx`
- `src/components/voting/HeaderWithWallet.tsx`
- `src/hooks/useWallet.ts`
- `src/hooks/usePolkadotWallet.ts`

## 📝 下一步

1. ✅ 获取 WalletConnect Project ID
2. ✅ 配置 `.env` 文件
3. ✅ 在你的组件中使用 `<WalletButton />`
4. 🔨 实现智能合约交互逻辑
5. 🔨 添加交易签名功能

需要帮助？查看 `docs/wallet-integration.md` 获取更多信息！
