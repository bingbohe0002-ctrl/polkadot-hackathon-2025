'use client';

import { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { useSpot } from '@/hooks/contracts/useSpot';

interface SpotMarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

export function SpotMarketSelector({ selectedMarket, onMarketChange }: SpotMarketSelectorProps) {
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337), [chain?.id]);
  const { useGetSpotMarkets } = useSpot(chainId);
  const { markets, isLoading } = useGetSpotMarkets();

  const symbols: string[] = (markets as any[]).map((m) => m?.symbol ?? m?.[2]).filter(Boolean);
  const list = symbols.length ? symbols : [selectedMarket];

  return (
    <div className="flex items-center space-x-6">
      <div className="relative">
        <select
          value={selectedMarket}
          onChange={(e) => onMarketChange(e.target.value)}
          className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {list.map((symbol) => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div>
          <div className="text-2xl font-bold">{isLoading ? '加载中…' : selectedMarket}</div>
          <div className="text-sm text-muted-foreground">Spot</div>
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="font-medium">—</div>
          <div className="text-xs">24h Change</div>
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="font-medium">—</div>
          <div className="text-xs">24h Volume</div>
        </div>
      </div>
    </div>
  );
}