"use client";

import { useEffect, useMemo, useState } from 'react';
import { useNetwork } from 'wagmi';
import { useOrderBookSubscription } from '@/hooks/contracts/useOrderBook';
import { getProvider, getPerpMarketContract } from '@/lib/utils/ethersHelpers';

interface OrderBookProps {
  market: string;
}

export function OrderBook({ market }: OrderBookProps) {
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337), [chain?.id]);

  // 解析 marketId（根据 symbol）
  const [marketId, setMarketId] = useState<bigint | null>(null);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const pm = getPerpMarketContract(chainId, provider);
        const markets = await pm.getAllMarkets();
        const target = (markets as any[]).find((m) => (m?.symbol ?? m?.[1]) === market);
        if (mounted) setMarketId(target ? BigInt(target?.id ?? target?.[0]) : null);
      } catch (_) {
        if (mounted) setMarketId(null);
      }
    };
    run();
    return () => { mounted = false; };
  }, [market, chainId]);

  // 订阅订单簿
  const { orderBook, isLoading } = useOrderBookSubscription(marketId ?? 0n, chainId);

  // 格式化为展示所需结构
  const asks = useMemo(() => (orderBook?.asks ?? []).map(([p, s]) => ({ price: Number(p), size: Number(s) })), [orderBook]);
  const bids = useMemo(() => (orderBook?.bids ?? []).map(([p, s]) => ({ price: Number(p), size: Number(s) })), [orderBook]);

  // 计算 spread（最佳卖价 - 最佳买价）
  const bestAsk = asks.length ? Math.min(...asks.map(a => a.price)) : undefined;
  const bestBid = bids.length ? Math.max(...bids.map(b => b.price)) : undefined;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPercent = bestBid ? (spread / bestBid) * 100 : 0;

  const maxAskTotal = useMemo(() => {
    const totals = asks.map(a => a.size);
    return totals.length ? Math.max(...totals) : 0;
  }, [asks]);
  const maxBidTotal = useMemo(() => {
    const totals = bids.map(b => b.size);
    return totals.length ? Math.max(...totals) : 0;
  }, [bids]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Order Book</h3>
        <div className="text-xs text-muted-foreground">
          {isLoading ? '加载中…' : `Spread: ${spread.toFixed(2)} (${spreadPercent.toFixed(2)}%)`}
        </div>
      </div>

      {/* Order Book Content */}
      <div className="flex-1 overflow-hidden">
        {/* Column Headers */}
        <div className="px-4 py-2 border-b border-border">
          <div className="grid grid-cols-3 text-xs text-muted-foreground">
            <div className="text-right">Price</div>
            <div className="text-right">Size</div>
            <div className="text-right">Total</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Asks (Sell Orders) */}
          <div className="space-y-px">
            {[...asks].reverse().map((ask, index) => (
              <div
                key={`ask-${index}`}
                className="px-4 py-1 hover:bg-red-500/10 cursor-pointer relative"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-red-500/20"
                  style={{ width: `${maxAskTotal ? (ask.size / maxAskTotal) * 100 : 0}%` }}
                />
                <div className="grid grid-cols-3 text-xs relative z-10">
                  <div className="text-right text-red-500">{ask.price.toLocaleString()}</div>
                  <div className="text-right">{ask.size.toFixed(3)}</div>
                  <div className="text-right">{ask.size.toFixed(3)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Spread */}
          <div className="px-4 py-3 border-y border-border bg-muted/30">
            <div className="text-center">
              <div className="text-sm font-medium">{spread.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                Spread {spreadPercent.toFixed(3)}%
              </div>
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="space-y-px">
            {bids.map((bid, index) => (
              <div
                key={`bid-${index}`}
                className="px-4 py-1 hover:bg-green-500/10 cursor-pointer relative"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-green-500/20"
                  style={{ width: `${maxBidTotal ? (bid.size / maxBidTotal) * 100 : 0}%` }}
                />
                <div className="grid grid-cols-3 text-xs relative z-10">
                  <div className="text-right text-green-500">{bid.price.toLocaleString()}</div>
                  <div className="text-right">{bid.size.toFixed(3)}</div>
                  <div className="text-right">{bid.size.toFixed(3)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}