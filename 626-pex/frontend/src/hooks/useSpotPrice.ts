'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type UseSpotPriceOptions = {
  pollingIntervalMs?: number;
};

function mapSymbolToBinance(symbol: string): string {
  switch (symbol) {
    case 'BTC-USD':
      return 'BTCUSDT';
    case 'ETH-USD':
      return 'ETHUSDT';
    case 'SOL-USD':
      return 'SOLUSDT';
    case 'AVAX-USD':
      return 'AVAXUSDT';
    case 'MATIC-USD':
      return 'MATICUSDT';
    default:
      return 'BTCUSDT';
  }
}

export function useSpotPrice(symbol: string, options?: UseSpotPriceOptions) {
  const pollingIntervalMs = options?.pollingIntervalMs ?? 2000;
  const [price, setPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const product = useMemo(() => mapSymbolToBinance(symbol), [symbol]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchOnce = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${product}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const p = Number(data?.price);
        if (!mounted) return;
        setPrice(Number.isFinite(p) ? p : null);
        setLastUpdated(Date.now());
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to fetch spot price');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOnce();
    intervalRef.current = setInterval(fetchOnce, pollingIntervalMs);

    return () => {
      mounted = false;
      controller.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [product, pollingIntervalMs]);

  return { price, lastUpdated, isLoading, error };
}