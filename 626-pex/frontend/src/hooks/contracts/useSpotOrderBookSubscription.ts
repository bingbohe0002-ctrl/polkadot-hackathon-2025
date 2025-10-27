'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { formatEther } from 'viem';
import { getProvider, getSpotOrderBookContract, getSpotMarketContract } from '@/lib/utils/ethersHelpers';
import { SpotOrderBookABI } from '@/lib/contracts/abi';
import { getContractAddresses } from '@/lib/contracts/addresses';

export function useSpotOrderBookSubscription(marketId: number | bigint, chainId: number) {
  const [bids, setBids] = useState<Array<{ price: number; size: number }>>([]);
  const [asks, setAsks] = useState<Array<{ price: number; size: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const runningRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function build() {
      // 只在首次加载时展示加载态；后续轮询避免 UI 闪烁
      if (!hasLoadedRef.current) setIsLoading(true);
      setError(null);
      if (runningRef.current) return; // 并发保护，避免重入
      runningRef.current = true;
      try {
        // Guard: spot contracts must be configured and marketId valid
        const addresses = getContractAddresses(chainId);
        const spotConfigured = !!addresses.spotMarket && addresses.spotMarket !== '0x0000000000000000000000000000000000000000'
          && !!addresses.spotOrderBook && addresses.spotOrderBook !== '0x0000000000000000000000000000000000000000';
        const midCandidate = typeof marketId === 'bigint' ? marketId : BigInt(marketId || 0);
        if (!spotConfigured || midCandidate === 0n) {
          if (mounted) {
            setBids([]);
            setAsks([]);
            setIsLoading(false);
            setError(null);
          }
          return;
        }

        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io');
        const ob = getSpotOrderBookContract(chainId, provider);
        const sm = getSpotMarketContract(chainId, provider);
        const mid = midCandidate;

        await sm.getMarket(mid); // ensure market exists
        const latestBlock = await provider.getBlockNumber();
        // AssetHub RPC 对 topics 中的 null 兼容性较差，避免在 filter 中传入 null
        const filterPlaced = ob.filters.OrderPlaced();
        const filterCancelled = ob.filters.OrderCancelled();
        const filterFilled = ob.filters.OrderFilled();
        const placedLogs = await ob.queryFilter(filterPlaced, 0, latestBlock);
        const cancelledLogs = await ob.queryFilter(filterCancelled, 0, latestBlock);
        const filledLogs = await ob.queryFilter(filterFilled, 0, latestBlock);
 
         const iface = new ethers.Interface(SpotOrderBookABI as any);
 
         const cancelledSet = new Set<string>();
         for (const log of cancelledLogs) {
           try {
             const parsed = iface.parseLog(log as any);
             const id = String(parsed?.args?.orderId ?? parsed?.args?.[0] ?? '');
             const mkt = BigInt(parsed?.args?.marketId ?? parsed?.args?.[2] ?? 0n);
             if (mkt !== mid) continue;
             if (id) cancelledSet.add(id);
           } catch {}
         }
         const filledMap = new Map<string, bigint>();
         for (const log of filledLogs) {
           try {
             const parsed = iface.parseLog(log as any);
             const id = String(parsed?.args?.orderId ?? parsed?.args?.[0] ?? '');
             const f = BigInt(parsed?.args?.filledSize ?? parsed?.args?.[3] ?? 0n);
             const mkt = BigInt(parsed?.args?.marketId ?? parsed?.args?.[2] ?? 0n);
             if (mkt !== mid) continue;
             if (id) filledMap.set(id, (filledMap.get(id) ?? 0n) + f);
           } catch {}
         }
 
         const bidsMap = new Map<bigint, bigint>();
         const asksMap = new Map<bigint, bigint>();
         for (const log of placedLogs) {
           try {
             const parsed = iface.parseLog(log as any);
             const orderId = String(parsed?.args?.orderId ?? parsed?.args?.[0] ?? '');
             const side = Number(parsed?.args?.side ?? parsed?.args?.[4] ?? 0);
             const sizeBN = BigInt(parsed?.args?.size ?? parsed?.args?.[5] ?? 0n);
             const priceBN = BigInt(parsed?.args?.price ?? parsed?.args?.[6] ?? 0n);
             const mkt = BigInt(parsed?.args?.marketId ?? parsed?.args?.[2] ?? 0n);
             if (mkt !== mid) continue;
             if (cancelledSet.has(orderId)) continue;
             const filled = filledMap.get(orderId) ?? 0n;
             const remaining = sizeBN > filled ? (sizeBN - filled) : 0n;
             if (remaining === 0n || priceBN === 0n) continue;
             const map = side === 0 ? bidsMap : asksMap;
             map.set(priceBN, (map.get(priceBN) ?? 0n) + remaining);
           } catch {}
         }

        const bidsArr = [...bidsMap.entries()]
          .sort((a, b) => (a[0] === b[0] ? 0 : (a[0] > b[0] ? -1 : 1)))
          .slice(0, 10)
          .map(([p, s]) => ({ price: Number(formatEther(p)), size: Number(formatEther(s)) }));
        const asksArr = [...asksMap.entries()]
          .sort((a, b) => (a[0] === b[0] ? 0 : (a[0] < b[0] ? -1 : 1)))
          .slice(0, 10)
          .map(([p, s]) => ({ price: Number(formatEther(p)), size: Number(formatEther(s)) }));

        if (mounted) {
          setBids(bidsArr);
          setAsks(asksArr);
          hasLoadedRef.current = true; // 标记已完成首次加载
        }
      } catch (e: any) {
        if (mounted) setError(e);
      } finally {
        runningRef.current = false;
        if (mounted) setIsLoading(false);
      }
    }

    build();
    const interval = setInterval(build, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [marketId, chainId]);

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

  return { bids, asks, isLoading, error, bestAsk, bestBid, spread, spreadPercent, maxAskTotal, maxBidTotal };
}