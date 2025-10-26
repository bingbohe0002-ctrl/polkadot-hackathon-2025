"use client";

import { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { useOraclePrice } from '@/hooks/contracts/useOracleAdapter';
import { useSpotPrice } from '@/hooks/useSpotPrice';
// 移除 Mark Price 相关逻辑与订阅

interface TradingStatsProps {
  market: string;
}

export function TradingStats({ market }: TradingStatsProps) {
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337), [chain?.id]);

  // Index price: use real-time spot as primary, oracle as fallback
  const { price: spotPrice, isLoading: spotLoading } = useSpotPrice(market, { pollingIntervalMs: 2000 });
  const { price: oracleIndexPrice, isLoading: oracleLoading } = useOraclePrice(market, { chainId, pollingIntervalMs: 5000 });
  const indexPrice = spotPrice ?? oracleIndexPrice ?? null;

  // 已移除 Mark Price 计算，顶部仅显示指数价

  return (
    <div className="flex items-center space-x-8 text-sm">
      <div>
        <div className="text-muted-foreground">Index Price</div>
        <div className="font-medium">{spotLoading && oracleLoading ? '加载中…' : indexPrice ? `$${indexPrice.toLocaleString()}` : '—'}</div>
      </div>
    </div>
  );
}