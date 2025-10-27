'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { getOracleAdapterContract, getProvider } from '@/lib/utils/ethersHelpers';
import { DEFAULT_CHAIN_ID, marketSymbolToBytes32 } from '@/lib/contracts/addresses';

type UseOraclePriceOptions = {
  chainId?: number;
  pollingIntervalMs?: number;
};

export function useOraclePrice(symbol: string, options?: UseOraclePriceOptions) {
  const chainId = options?.chainId ?? DEFAULT_CHAIN_ID;
  const pollingIntervalMs = options?.pollingIntervalMs ?? 5000;
  const [price, setPrice] = useState<number | null>(null);
  const [rawPrice, setRawPrice] = useState<bigint | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bytes32Symbol = useMemo(() => marketSymbolToBytes32(symbol), [symbol]);

  useEffect(() => {
    const provider = getProvider();
    const contract = getOracleAdapterContract(chainId, provider);

    let mounted = true;

    async function fetchOnce() {
      try {
        setIsLoading(true);
        const p: bigint = await contract.getPrice(bytes32Symbol);
        if (!mounted) return;
        setRawPrice(p);
        const num = Number(p) / 1e18;
        setPrice(Number.isFinite(num) ? num : null);
        setLastUpdated(Date.now());
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to read price');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchOnce();

    // Event subscription for real-time updates
    const onPriceUpdated = (evtSymbol: string, p: bigint, ts: bigint) => {
      try {
        if (evtSymbol.toLowerCase() !== bytes32Symbol.toLowerCase()) return;
        setRawPrice(p);
        const num = Number(p) / 1e18;
        setPrice(Number.isFinite(num) ? num : null);
        setLastUpdated(Number(ts));
      } catch {}
    };

    contract.on('PriceUpdated', onPriceUpdated);

    // Fallback polling (in case events are not emitted on local dev)
    intervalRef.current = setInterval(fetchOnce, pollingIntervalMs);

    return () => {
      mounted = false;
      try {
        contract.off('PriceUpdated', onPriceUpdated);
      } catch {}
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chainId, bytes32Symbol, pollingIntervalMs]);

  return { price, rawPrice, lastUpdated, isLoading, error };
}