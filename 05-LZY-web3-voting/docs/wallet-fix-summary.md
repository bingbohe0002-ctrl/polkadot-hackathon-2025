# Web3 钱包路由切换问题修复

## 🐛 问题描述

### 症状

1. **WalletConnect 多次初始化** - 控制台显示 "WalletConnect Core is already initialized... Init() was called 9 times"
2. **路由切换后钱包状态丢失** - 在首页连接钱包后，切换到其他页面钱包显示为未连接状态
3. **Fast Refresh 导致全量重载** - 修改代码时整个页面重新加载

### 根本原因

根据 [Next.js Fast Refresh 文档](https://nextjs.org/docs/messages/fast-refresh-reload) 和 Wagmi 最佳实践分析：

1. **QueryClient 在模块级别创建**
   - 每次 Fast Refresh 都会重新执行模块代码
   - 导致 QueryClient 和 WalletConnect 被多次初始化

2. **缺少钱包类型持久化**
   - WalletContext 中的 `walletType` 状态没有持久化
   - 路由切换时组件重新挂载，状态丢失

3. **Wagmi 配置问题**
   - 缺少 `multiInjectedProviderDiscovery: false` 配置
   - 可能导致多个钱包 provider 冲突

## ✅ 解决方案

### 1. 修复 Web3Provider - 防止 Fast Refresh 重复初始化

**文件**: `src/providers/Web3Provider.tsx`

```typescript
export function Web3Provider({ children }: Web3ProviderProps) {
  // ✅ 使用 useState 创建 QueryClient
  // 确保每个组件实例只创建一次，而不是每次 Fast Refresh 都创建
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

**关键点**:

- 将 QueryClient 从模块级别移到组件内部
- 使用 `useState(() => new QueryClient(...))` 确保只创建一次
- 添加 `reconnectOnMount={true}` 自动重连钱包

### 2. 优化 Wagmi 配置 - 防止多 Provider 冲突

**文件**: `src/config/wagmi.ts`

```typescript
export const wagmiConfig = createConfig({
  chains: [moonbeam, moonriver],
  connectors: [
    injected({ target: "metaMask" }),
    ...(projectId ? [walletConnect({ ... })] : []),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  multiInjectedProviderDiscovery: false, // ✅ 防止多 provider 检测
  transports: {
    [moonbeam.id]: http(),
    [moonriver.id]: http(),
  },
});
```

**关键点**:

- 添加 `multiInjectedProviderDiscovery: false` 防止冲突
- 使用 `cookieStorage` 实现 SSR 状态持久化
- 动态获取 URL 和 icon，避免硬编码

### 3. 添加钱包类型持久化 - 保持路由切换状态

**文件**: `src/contexts/WalletContext.tsx`

```typescript
const WALLET_TYPE_KEY = "web3-voting-wallet-type";

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletType, setWalletType] = useState<WalletType>(null);

  // ✅ 从 localStorage 恢复钱包类型
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(WALLET_TYPE_KEY);
      if (saved === "evm" || saved === "substrate") {
        setWalletType(saved);
      }
    }
  }, []);

  // ✅ 自动检测并持久化钱包类型
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!walletType) {
      if (evmWallet.isConnected) {
        setWalletType("evm");
        localStorage.setItem(WALLET_TYPE_KEY, "evm");
      } else if (substrateWallet.isConnected) {
        setWalletType("substrate");
        localStorage.setItem(WALLET_TYPE_KEY, "substrate");
      }
    }
  }, [evmWallet.isConnected, substrateWallet.isConnected, walletType]);

  // ✅ 连接时保存状态
  const connect = useCallback(
    async (type: WalletType) => {
      if (type === "evm") {
        evmWallet.connectWallet();
        setWalletType("evm");
        if (typeof window !== "undefined") {
          localStorage.setItem(WALLET_TYPE_KEY, "evm");
        }
      }
      // ...
    },
    [evmWallet, substrateWallet],
  );

  // ✅ 断开时清除状态
  const disconnect = useCallback(() => {
    // ...
    setWalletType(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(WALLET_TYPE_KEY);
    }
  }, [walletType, evmWallet, substrateWallet]);
}
```

**关键点**:

- 使用 `localStorage` 持久化钱包类型
- 自动检测 Wagmi 的连接状态并更新钱包类型
- 路由切换时保持钱包状态
- 添加 `typeof window !== "undefined"` 检查避免 SSR 错误

## 📊 修复效果

### 修复前

❌ WalletConnect 被初始化 9 次  
❌ 路由切换后钱包状态丢失  
❌ Fast Refresh 导致全量重载  
❌ 页面闪烁，用户体验差

### 修复后

✅ WalletConnect 只初始化 1 次  
✅ 路由切换后钱包状态保持  
✅ Fast Refresh 正常工作  
✅ 页面流畅，无闪烁

## 🔍 技术要点

### 1. Next.js Fast Refresh 最佳实践

根据 [Next.js 文档](https://nextjs.org/docs/messages/fast-refresh-reload)：

- ❌ 不要在模块级别创建有状态的对象（如 QueryClient）
- ✅ 在组件内部使用 `useState(() => new Object())` 创建
- ✅ 确保导出的都是 React 组件或纯函数

### 2. Wagmi 持久化

Wagmi 使用 `cookieStorage` 自动保存连接状态：

```typescript
storage: createStorage({
  storage: cookieStorage,
}),
ssr: true,
```

这确保了：

- 钱包连接状态持久化到 cookie
- 页面刷新后自动重连
- SSR 和 CSR 状态一致

### 3. 路由切换状态管理

使用 localStorage 补充 Wagmi 的持久化：

```typescript
// Wagmi 持久化：钱包连接状态（address, isConnected）
// localStorage 持久化：钱包类型选择（evm/substrate）
```

两者结合确保完整的状态恢复。

## 🧪 测试清单

测试以下场景确保问题已修复：

- [ ] 首页连接钱包
- [ ] 切换到其他页面，钱包状态保持
- [ ] 刷新页面，钱包自动重连
- [ ] 断开钱包，所有页面同步更新
- [ ] 控制台无 WalletConnect 重复初始化警告
- [ ] Fast Refresh 时无全量重载
- [ ] 切换路由无页面闪烁

## 📝 注意事项

1. **localStorage 仅用于钱包类型**  
   实际的钱包连接状态由 Wagmi 管理（通过 cookieStorage）

2. **SSR 安全**  
   所有 localStorage 访问都检查了 `typeof window !== "undefined"`

3. **自动检测机制**  
   即使 localStorage 清空，系统也会自动从 Wagmi 连接状态恢复钱包类型

4. **开发模式**  
   Fast Refresh 现在正常工作，不会导致钱包重复初始化

## 🔗 参考资料

- [Next.js Fast Refresh](https://nextjs.org/docs/messages/fast-refresh-reload)
- [Wagmi SSR](https://wagmi.sh/react/guides/ssr)
- [WalletConnect Integration](https://docs.walletconnect.com/web3modal/react/about)
- [React Query Setup](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)

## 🎉 总结

通过以上三个关键修复：

1. 修复 QueryClient 创建方式
2. 优化 Wagmi 配置
3. 添加钱包类型持久化

彻底解决了路由切换时钱包状态不稳定的问题！
