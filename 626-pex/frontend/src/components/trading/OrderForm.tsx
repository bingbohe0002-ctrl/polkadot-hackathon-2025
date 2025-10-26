'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNetwork, useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { DEFAULT_CHAIN_ID, getContractAddresses, getTokenAddress } from '@/lib/contracts/addresses';
import { useOraclePrice } from '@/hooks/contracts/useOracleAdapter';
import { useSpotPrice } from '@/hooks/useSpotPrice';
import { useOrderBook } from '@/hooks/contracts/useOrderBook';
import { getProvider, getPerpMarketContract, getMarginVaultContract, getERC20Contract } from '@/lib/utils/ethersHelpers';
import { ethers } from 'ethers';

interface OrderFormProps {
  market: string;
  refreshKey?: number; // 当此值变化时，重新读取可用余额
}

export function OrderForm({ market, refreshKey }: OrderFormProps) {
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deposit UI moved to header (state removed)

  // Resolve chainId and hook up contract write using connected wallet
  const { chain } = useNetwork();
  const { address, isConnecting } = useAccount();
  const chainId = useMemo(
    () => chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_CHAIN_ID),
    [chain?.id]
  );
  const { usePlaceOrder } = useOrderBook(chainId);
  const { placeOrder, isLoading: isPlacing, isSuccess, error } = usePlaceOrder();

  // 当前价格（实时现货优先，指数价备用）
  const { price: spotPrice, isLoading: spotLoading } = useSpotPrice(market, { pollingIntervalMs: 2000 });
  const { price: indexPrice, isLoading: oracleLoading } = useOraclePrice(market, { chainId, pollingIntervalMs: 5000 });

  // Resolve marketId from symbol for order placement
  const [marketId, setMarketId] = useState<bigint | null>(null);
  const [resolvingMarket, setResolvingMarket] = useState(false);
  const [availableUsdc, setAvailableUsdc] = useState<bigint | null>(null);

  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      if (!market) { setMarketId(null); return; }
      setResolvingMarket(true);
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const pm = getPerpMarketContract(chainId, provider);
        const markets = await pm.getAllMarkets();
        const found = (markets as any[]).find((m) => (m?.symbol ?? m?.[1]) === market);
        if (mounted) setMarketId(found ? BigInt(found?.id ?? found?.[0]) : null);
      } catch (_) {
        if (mounted) setMarketId(null);
      } finally {
        if (mounted) setResolvingMarket(false);
      }
    };
    resolve();
    return () => { mounted = false; };
  }, [market, chainId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!address) { setAvailableUsdc(null); return; }
        const addrs = getContractAddresses(chainId);
        const zero = '0x0000000000000000000000000000000000000000';
        if (!addrs?.marginVault || addrs.marginVault.toLowerCase() === zero) {
          setAvailableUsdc(null);
          return;
        }
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const vault = getMarginVaultContract(chainId, provider);
        const account: any = await vault.getAccountInfo(address);
        const available: bigint = (account?.availableBalance ?? account?.[3]) as bigint;
        if (!cancelled) setAvailableUsdc(available);
      } catch {
        if (!cancelled) setAvailableUsdc(null);
      }
    })();
    // 当地址、网络或 refreshKey 改变时重新读取
  }, [address, chainId, refreshKey, isSuccess]);

  // 订阅 PerpMarket 事件，开/平仓后刷新可用余额
  useEffect(() => {
    if (!address) return;
    const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const pm = getPerpMarketContract(chainId, provider);
    const vault = getMarginVaultContract(chainId, provider);
    const refresh = async () => {
      try {
        const account: any = await vault.getAccountInfo(address);
        const available: bigint = (account?.availableBalance ?? account?.[3]) as bigint;
        setAvailableUsdc(available);
      } catch {}
    };
    const onOpened = (
      trader: string,
      marketId: bigint,
      side: any,
      size: bigint,
      entryPrice: bigint,
      leverage: bigint,
      margin: bigint
    ) => {
      if (!address) return;
      if (String(trader).toLowerCase() !== String(address).toLowerCase()) return;
      refresh();
    };
    const onClosed = (
      trader: string,
      marketId: bigint,
      size: bigint,
      acceptablePrice: bigint,
      pnl: bigint
    ) => {
      if (!address) return;
      if (String(trader).toLowerCase() !== String(address).toLowerCase()) return;
      refresh();
    };
    pm.on('PositionOpened', onOpened);
    pm.on('PositionClosed', onClosed);
    return () => {
      pm.off('PositionOpened', onOpened);
      pm.off('PositionClosed', onClosed);
    };
  }, [address, chainId]);

  // Feedback on write result
  useEffect(() => {
    if (isSuccess) {
      toast.success('下单成功');
      setPrice('');
      setSize('');
      setIsSubmitting(false);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      const msg = (error as any)?.message || '下单失败';
      toast.error(msg);
      setIsSubmitting(false);
    }
  }, [error]);

  const onSubmit = async () => {
    // 基本校验
    if (!size || Number(size) <= 0) {
      toast.error('请输入有效数量');
      return;
    }
    if (orderType === 'LIMIT' && (!price || Number(price) <= 0)) {
      toast.error('限价单需要有效价格');
      return;
    }
    if (!marketId) {
      toast.error('未找到该交易对的市场 ID');
      return;
    }

    // 钱包连接校验（wagmi 需要 EVM 钱包地址）
    if (!address) {
      toast.error('请先连接 EVM 钱包（右上角 Connect）');
      return;
    }

    // 合约地址校验（避免当前网络未配置导致静默失败）
    const addrs = getContractAddresses(chainId);
    const zero = '0x0000000000000000000000000000000000000000';
    if (!addrs?.orderBook || addrs.orderBook.toLowerCase() === zero) {
      toast.error('当前网络未配置 OrderBook 合约地址，请切换到本地网络或配置 .env');
      return;
    }

    // USDC 余额校验：使用 size * price / leverage，并按 18→6 精度转换
    try {
      const usdcAddr = getTokenAddress(chainId, 'USDC');
      if (!usdcAddr || usdcAddr.toLowerCase() === zero) {
        throw new Error('USDC 地址未配置，无法校验保证金');
      }
      const addrs = getContractAddresses(chainId);
      if (!addrs?.marginVault || addrs.marginVault.toLowerCase() === zero) {
        throw new Error('当前网络未配置 MarginVault 合约地址，请切换到本地网络或执行部署脚本');
      }
      // 价格来源：限价单用用户输入；市价单用现货或指数价
      const px = estPrice;
      if (!px || !Number.isFinite(px) || px <= 0) {
        throw new Error('未能获取有效价格，无法校验保证金');
      }
      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const vault = getMarginVaultContract(chainId, provider);
      const account: any = await vault.getAccountInfo(address);
      const available: bigint = (account?.availableBalance ?? account?.[3]) as bigint;
      const sizeWei = ethers.parseEther(size);
      const priceWei = ethers.parseEther(String(px));
      const leverageBN = BigInt(leverage > 0 ? leverage : 1);
      const notionalWei = (sizeWei * priceWei) / 1000000000000000000n; // 1e18
      const reqWei = notionalWei / leverageBN;
      let reqUsdc = reqWei / 1000000000000n; // 18 -> 6
      if (reqUsdc <= 0n) {
        reqUsdc = 1n; // 最小需求
      }
      if (available < reqUsdc) {
        const need = ethers.formatUnits(reqUsdc, 6);
        const have = ethers.formatUnits(available, 6);
        throw new Error(`USDC 可用余额不足，需约 ${need}，当前 ${have}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'USDC 保证金校验失败');
      return;
    }

    // 通过连接钱包直接写入合约下单
    setIsSubmitting(true);
    try {
      // 为市价单填充当前价格（优先用现货，其次指数）
      let marketPrice: number | null = null;
      if (orderType === 'MARKET') {
        marketPrice = (spotPrice ?? indexPrice) ?? null;
        if (!marketPrice || !Number.isFinite(marketPrice) || marketPrice <= 0) {
          throw new Error('未能获取当前价格，暂时无法下市价单');
        }
      }
      // placeOrder 触发钱包交易签名；结果通过 isSuccess/error 反馈
      placeOrder({
        market, // 仅用于日志语义
        orderType,
        side,
        size,
        // 市价单传入当前价格以便记录与展示；限价单使用用户输入
        price: orderType === 'LIMIT' ? price : String(marketPrice),
        leverage,
        // 扩展字段：在 hook 中作为 args[0]
        // 类型兼容在 PlaceOrderParams 中新增可选 marketId
        marketId,
      } as any);
    } catch (err: any) {
      toast.error(err?.message || '下单失败');
      setIsSubmitting(false);
    }
  };

  const submitLabel = `${side === 'BUY' ? 'Buy' : 'Sell'} ${market.split('-')[0]}`;
  const estPrice = useMemo(() => {
    if (orderType === 'LIMIT') {
      const n = Number(price);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    return (spotPrice ?? indexPrice) ?? null;
  }, [orderType, price, spotPrice, indexPrice]);
  const estTotal = useMemo(() => {
    const s = Number(size);
    if (!estPrice || !Number.isFinite(s) || s <= 0) return null;
    return s * estPrice;
  }, [size, estPrice]);

  // handleDeposit moved to TradingPage header

  return (
    <div className="p-4">
      {/* 当前价格 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">{market}</div>
        <div className="text-sm">
          {spotLoading && oracleLoading ? '价格加载中…' : (spotPrice ?? indexPrice) ? (
            <span className="font-semibold">${(spotPrice ?? indexPrice)!.toLocaleString()}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>
      {/* Order Type Tabs */}
      <div className="flex mb-4 bg-muted rounded-lg p-1">
        <button
          onClick={() => setOrderType('LIMIT')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            orderType === 'LIMIT'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Limit
        </button>
        <button
          onClick={() => setOrderType('MARKET')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            orderType === 'MARKET'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Market
        </button>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="flex mb-4 bg-muted rounded-lg p-1">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            side === 'BUY'
              ? 'bg-green-500 text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            side === 'SELL'
              ? 'bg-red-500 text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Order Form */}
      <div className="space-y-4">
        {/* Price Input */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="block text-sm font-medium mb-2">Price</label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">USD</span>
            </div>
          </div>
        )}

        {/* Size Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Size</label>
          <div className="relative">
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">BTC</span>
          </div>
        </div>

        {/* Leverage Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Leverage</label>
            <span className="text-sm text-primary font-medium">{leverage}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1x</span>
            <span>100x</span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Total</span>
            <span>{estTotal ? `$${estTotal.toLocaleString()}` : '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span>{ethers.formatUnits(availableUsdc || 0n, 6)} USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fee</span>
            <span>—</span>
          </div>
        </div>

        {/* Deposit入口已迁移到页面头部 */}

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={isSubmitting || isPlacing}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            side === 'BUY'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {submitLabel}
        </button>

        {/* 状态提示 */}
        {resolvingMarket && (
          <div className="text-xs text-muted-foreground">正在解析市场 ID…</div>
        )}
        {!marketId && !resolvingMarket && (
          <div className="text-xs text-red-500">未能获取市场 ID，请检查链 RPC 与合约部署。</div>
        )}
        {!address && !isConnecting && (
          <div className="text-xs text-yellow-500">未连接 EVM 钱包：请点击右上角 Connect 连接钱包</div>
        )}

        {/* Quick Size Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            className="px-2 py-2 text-xs border rounded hover:bg-muted"
            onClick={() => setSize('0.01')}
          >
            0.01
          </button>
          <button
            type="button"
            className="px-2 py-2 text-xs border rounded hover:bg-muted"
            onClick={() => setSize('0.05')}
          >
            0.05
          </button>
          <button
            type="button"
            className="px-2 py-2 text-xs border rounded hover:bg-muted"
            onClick={() => setSize('0.1')}
          >
            0.1
          </button>
          <button
            type="button"
            className="px-2 py-2 text-xs border rounded hover:bg-muted"
            onClick={() => setSize('0.5')}
          >
            0.5
          </button>
        </div>
      </div>
    </div>
  );
}