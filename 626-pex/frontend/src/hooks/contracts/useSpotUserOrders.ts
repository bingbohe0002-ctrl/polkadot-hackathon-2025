'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getProvider, getSpotOrderBookContract, getSpotMarketContract } from '@/lib/utils/ethersHelpers';

export type SpotOrderStatus = 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';
export type SpotOrderSide = 'BUY' | 'SELL';
export type SpotOrderType = 'LIMIT' | 'MARKET';

export interface SpotOrderRow {
  id: string;
  market: string;
  side: SpotOrderSide;
  type: SpotOrderType;
  size: bigint;      // 18 decimals
  price: bigint;     // 18 decimals
  filledSize: bigint;// 18 decimals
  status: SpotOrderStatus;
  timestamp: bigint;
}

export function useSpotUserOrders(chainId: number) {
  const { address } = useAccount();
  const [orders, setOrders] = useState<SpotOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const pollingRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const ob = getSpotOrderBookContract(chainId, provider);
      const sm = getSpotMarketContract(chainId, provider);

      const orderIds: bigint[] = await ob.getOrdersByTrader(address);
      const markets = await sm.getAllMarkets();
      const symbolById = new Map<bigint, string>();
      for (const m of markets) {
        const id = BigInt(m.id ?? m[0]);
        const symbol = String(m.symbol ?? m[1]);
        symbolById.set(id, symbol);
      }

      const full = await Promise.all(orderIds.map(async (oid) => {
        const o = await ob.getOrder(oid);
        const marketId = BigInt(o.marketId ?? o[2]);
        const statusIndex = Number(o.status ?? o[10] ?? o[9]);
        // ISpotOrderBook.OrderStatus: PENDING(0), PARTIALLY_FILLED(1), FILLED(2), CANCELLED(3)
        const status = (['PENDING', 'PARTIAL', 'FILLED', 'CANCELLED'] as const)[statusIndex] ?? 'PENDING';
        return {
          id: String(o.id ?? o[0]),
          market: symbolById.get(marketId) || String(marketId),
          side: Number(o.side ?? o[5] ?? o[4]) === 0 ? 'BUY' : 'SELL',
          type: Number(o.orderType ?? o[4] ?? o[3]) === 0 ? 'LIMIT' : 'MARKET',
          size: BigInt(o.size ?? o[6] ?? o[5]),
          price: BigInt(o.price ?? o[7] ?? o[6]),
          filledSize: BigInt(o.filledSize ?? o[8] ?? o[7]),
          status,
          timestamp: BigInt(o.timestamp ?? o[9] ?? o[8]),
        } as SpotOrderRow;
      }));

      setOrders(full);
    } catch (e) {
      console.error('[useSpotUserOrders] fetchOrders error:', e);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [address, chainId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setHasLoaded(false);
  }, [address, chainId]);

  // Replace event subscriptions with safe polling to avoid eth_newFilter errors
  useEffect(() => {
    if (!address) return;
    let mounted = true;
    const tick = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        await fetchOrders();
      } catch {}
      finally {
        pollingRef.current = false;
      }
    };
    tick();
    const interval = setInterval(tick, 7000);
    return () => { mounted = false; clearInterval(interval); };
  }, [address, chainId, fetchOrders]);

  return {
    orders,
    isLoading: !hasLoaded && isLoading,
    refetch: fetchOrders,
  };
}