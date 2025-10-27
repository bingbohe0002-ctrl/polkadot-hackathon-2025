'use client';

import { TRADING_PAIRS } from '@/lib/contracts/addresses';
import { useOraclePrice } from '@/hooks/contracts/useOracleAdapter';
import { useSpotPrice } from '@/hooks/useSpotPrice';

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

export function MarketSelector({ selectedMarket, onMarketChange }: MarketSelectorProps) {
  // 实时现货价格（主显示）
  const { price: spotPrice, isLoading: spotLoading } = useSpotPrice(selectedMarket, { pollingIntervalMs: 2000 });
  // 链上指数价（备用显示）
  const { price: oraclePrice, isLoading: oracleLoading } = useOraclePrice(selectedMarket);
  const currentMarketName = TRADING_PAIRS[selectedMarket as keyof typeof TRADING_PAIRS]?.name ?? selectedMarket;

  return (
    <div className="flex items-center space-x-6">
      {/* Market Dropdown */}
      <div className="relative">
        <select
          value={selectedMarket}
          onChange={(e) => onMarketChange(e.target.value)}
          className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {['BTC-USD', 'ETH-USD'].map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Market Info */}
      <div className="flex items-center space-x-4">
        <div>
          <div className="text-2xl font-bold">
            {spotLoading && oracleLoading ? '加载中…' :
              (spotPrice ?? oraclePrice) != null ? `$${(spotPrice ?? oraclePrice)!.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
          </div>
          <div className="text-sm text-muted-foreground">{currentMarketName}</div>
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