'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNetwork, useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { getProvider, getSpotMarketContract } from '@/lib/utils/ethersHelpers';
import { useSpot } from '@/hooks/contracts/useSpot';
import { getTokenAddress } from '@/lib/contracts/addresses';
import { getContractAddresses } from '@/lib/contracts/addresses';
import { ERC20ABI } from '@/lib/contracts/abi';
import { usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { useSpotOrderBookSubscription } from '@/hooks/contracts/useSpotOrderBookSubscription';

interface SpotOrderFormProps {
  market: string; // e.g., "ETH-USDC"
}

export function SpotOrderForm({ market }: SpotOrderFormProps) {
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { chain } = useNetwork();
  const { address } = useAccount();
  const chainId = useMemo(() => Number(chain?.id ?? (process.env.NEXT_PUBLIC_CHAIN_ID ?? 420420422)), [chain?.id]);
  const { usePlaceSpotOrderDirect } = useSpot(chainId);
  const { placeOrder, isLoading: isPlacing, isSuccess, error } = usePlaceSpotOrderDirect();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  const [marketId, setMarketId] = useState<bigint | null>(null);
  const [marketDetail, setMarketDetail] = useState<{ baseToken: `0x${string}`; quoteToken: `0x${string}`; baseDecimals: number; quoteDecimals: number; baseIsNative: boolean; quoteIsNative: boolean } | null>(null);
  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io');
        const sm = getSpotMarketContract(chainId, provider);
        const markets = await sm.getAllMarkets();

        const norm = (s: string) => s.replace(/\//g, '-').toUpperCase();
        const targetNorm = norm(market);
        const [base, quote] = targetNorm.split('-');
        const candidates = new Set<string>([targetNorm]);
        if (base === 'ETH') candidates.add(`WETH-${quote}`);
        if (quote === 'USD') { candidates.add(`${base}-USDC`); candidates.add(`${base}-USDT`); }

        const usdc = getTokenAddress(chainId, 'USDC')?.toLowerCase();
        const usdt = getTokenAddress(chainId, 'USDT')?.toLowerCase();
        const weth = getTokenAddress(chainId, 'WETH')?.toLowerCase();

        const found = (markets as any[]).find((m) => {
          const sym = String(m?.symbol ?? m?.[3] ?? m?.[2] ?? '');
          const sn = norm(sym);
          if (candidates.has(sn)) return true;
          const baseAddr = String(m?.baseToken ?? m?.[1] ?? '').toLowerCase();
          const quoteAddr = String(m?.quoteToken ?? m?.[2] ?? '').toLowerCase();
          const baseMatch = base === 'ETH' ? (weth && baseAddr === weth) : undefined;
          const quoteMatch = quote === 'USDC' ? (usdc && quoteAddr === usdc) : quote === 'USDT' ? (usdt && quoteAddr === usdt) : undefined;
          return Boolean(baseMatch && quoteMatch);
        });

        if (mounted) setMarketId(found ? BigInt(found?.id ?? found?.[0]) : null);
      } catch (_) {
        if (mounted) setMarketId(null);
      }
    };
    resolve();
    return () => { mounted = false; };
  }, [market, chainId]);

  useEffect(() => {
    if (!marketId) { setMarketDetail(null); return; }
    let mounted = true;
    (async () => {
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io');
        const sm = getSpotMarketContract(chainId, provider);
        const m = await sm.getMarket(marketId);
        const detail = {
          baseToken: (m?.baseToken ?? m?.[1]) as `0x${string}`,
          quoteToken: (m?.quoteToken ?? m?.[2]) as `0x${string}`,
          baseDecimals: Number(m?.baseDecimals ?? m?.[6] ?? 18),
          quoteDecimals: Number(m?.quoteDecimals ?? m?.[7] ?? 6),
          baseIsNative: Boolean(m?.baseIsNative ?? m?.[8] ?? false),
          quoteIsNative: Boolean(m?.quoteIsNative ?? m?.[9] ?? false),
        };
        if (mounted) setMarketDetail(detail);
      } catch {
        if (mounted) setMarketDetail(null);
      }
    })();
    return () => { mounted = false; };
  }, [marketId, chainId]);

  // Subscribe order book for best bid/ask
  const { bids, asks } = useSpotOrderBookSubscription(marketId ?? 0n, chainId);
  const bestAsk = asks.length ? asks[0].price : undefined; // asks sorted asc in hook
  const bestBid = bids.length ? bids[0].price : undefined; // bids sorted desc in hook

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
    if (!size || Number(size) <= 0) { toast.error('请输入有效数量'); return; }
    if (orderType === 'LIMIT' && (!price || Number(price) <= 0)) { toast.error('限价单需要有效价格'); return; }
    if (!marketId) { toast.error('未找到该交易对的市场 ID'); return; }
    if (!address) { toast.error('请先连接钱包'); return; }
    if (!marketDetail) { toast.error('未能获取市场详情'); return; }
    setIsSubmitting(true);
    try {
      if (!marketId || !marketDetail) {
        toast.error('市场信息未就绪，请稍后重试');
        setIsSubmitting(false);
        return;
      }
      const toTokenDecimals = (amount18: bigint, decimals: number): bigint => {
        if (decimals === 18) return amount18;
        // Use a safe BigInt pow10 to avoid transpiled Math.pow(BigInt) runtime errors
        const pow10n = (exp: number): bigint => {
          let result = 1n;
          for (let i = 0; i < exp; i++) result *= 10n;
          return result;
        };
        return decimals > 18
          ? amount18 * pow10n(decimals - 18)
          : amount18 / pow10n(18 - decimals);
      };
      const size18 = parseEther(size);
      // 市价单使用订单簿最佳价；无流动性则提示失败
      const marketPx = orderType === 'MARKET' ? (side === 'BUY' ? bestAsk : bestBid) : undefined;
      if (orderType === 'MARKET' && (!marketPx || !Number.isFinite(marketPx) || marketPx <= 0)) {
        throw new Error('市场无可用流动性，暂时无法下市价单');
      }
      const price18 = orderType === 'LIMIT' ? parseEther(price) : parseEther(String(marketPx!));
      const addresses = getContractAddresses(chainId);
      const spender = (addresses.spotOrderBook || '0x0000000000000000000000000000000000000000') as `0x${string}`;

      let valueWei: bigint | undefined = undefined;

      if (side === 'BUY') {
        // Avoid BigInt exponent operator which may be downleveled to Math.pow
        const TEN18 = 1000000000000000000n;
        const quoteNeeded18 = (size18 * price18) / TEN18;
        const requiredQuote = toTokenDecimals(quoteNeeded18, marketDetail.quoteDecimals);
        if (marketDetail.quoteIsNative) {
          valueWei = requiredQuote;
        } else {
          const allowance: bigint = await publicClient!.readContract({
            address: marketDetail.quoteToken,
            abi: ERC20ABI,
            functionName: 'allowance',
            args: [address as `0x${string}`, spender],
          });
          if (allowance < requiredQuote) {
            const hash = await walletClient!.writeContract({
              account: address as `0x${string}`,
              address: marketDetail.quoteToken,
              abi: ERC20ABI,
              functionName: 'approve',
              args: [spender, requiredQuote],
              chain: { ...walletClient!.chain!, id: Number(walletClient!.chain!.id) } as any,
            });
            await publicClient!.waitForTransactionReceipt({ hash });
          }
        }
      } else { // SELL
        const requiredBase = toTokenDecimals(size18, marketDetail.baseDecimals);
        if (marketDetail.baseIsNative) {
          valueWei = requiredBase;
        } else {
          const allowance: bigint = await publicClient!.readContract({
            address: marketDetail.baseToken,
            abi: ERC20ABI,
            functionName: 'allowance',
            args: [address as `0x${string}`, spender],
          });
          if (allowance < requiredBase) {
            const hash = await walletClient!.writeContract({
              account: address as `0x${string}`,
              address: marketDetail.baseToken,
              abi: ERC20ABI,
              functionName: 'approve',
              args: [spender, requiredBase],
              chain: { ...walletClient!.chain!, id: Number(walletClient!.chain!.id) } as any,
            });
            await publicClient!.waitForTransactionReceipt({ hash });
          }
        }
      }

      placeOrder({
        marketId,
        type: orderType,
        side,
        size,
        price: orderType === 'LIMIT' ? price : String(marketPx!),
        valueWei,
      });
    } catch (e: any) {
      console.error('[SpotOrderForm] submit error:', e);
      if (e?.stack) console.error('[SpotOrderForm] stack:', e.stack);
      toast.error(e?.message || '下单失败');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSide('BUY')}
          className={`px-3 py-2 rounded-md border ${side === 'BUY' ? 'bg-green-500/20 border-green-500' : 'hover:bg-muted'}`}
        >Buy</button>
        <button
          onClick={() => setSide('SELL')}
          className={`px-3 py-2 rounded-md border ${side === 'SELL' ? 'bg-red-500/20 border-red-500' : 'hover:bg-muted'}`}
        >Sell</button>
      </div>

      {/* Type */}
      <div className="flex space-x-2">
        <button
          onClick={() => setOrderType('LIMIT')}
          className={`px-3 py-2 rounded-md border ${orderType === 'LIMIT' ? 'bg-muted' : 'hover:bg-muted'}`}
        >Limit</button>
        <button
          onClick={() => setOrderType('MARKET')}
          className={`px-3 py-2 rounded-md border ${orderType === 'MARKET' ? 'bg-muted' : 'hover:bg-muted'}`}
        >Market</button>
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Price</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.000000000000000001"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={orderType === 'MARKET'}
          className="w-full rounded border px-3 py-2 bg-input"
          placeholder={orderType === 'MARKET' ? '以市场价格成交' : '例如：2000.00'}
        />
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Size</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.000000000000000001"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full rounded border px-3 py-2 bg-input"
          placeholder="例如：1.00"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitting || isPlacing}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60"
      >{isSubmitting || isPlacing ? '提交中…' : '下单'}</button>
    </div>
  );
}