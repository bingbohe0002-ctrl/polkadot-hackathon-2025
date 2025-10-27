'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getProvider, getSpotOrderBookContract, getSpotMarketContract } from '@/lib/utils/ethersHelpers';

export interface SpotTradeRow {
  orderId: string;
  market: string;
  filledSize: bigint; // 18 decimals
  fillPrice: bigint;  // 18 decimals
  timestamp: bigint;
  txHash?: string;
}

export function useSpotUserTrades(chainId: number) {
  const { address } = useAccount();
  const [trades, setTrades] = useState<SpotTradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
     setIsLoading(true);
     try {
      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io');
      const ob = getSpotOrderBookContract(chainId, provider);
      const sm = getSpotMarketContract(chainId, provider);

      const latest = await provider.getBlockNumber();
      // 避免在 topics 中传入 null，使用事件签名过滤并在解析阶段过滤 trader
      const filter = ob.filters.OrderFilled();
      const logs = await ob.queryFilter(filter, 0, latest);

      const markets = await sm.getAllMarkets();
      const symbolById = new Map<bigint, string>();
      for (const m of markets) {
        const id = BigInt(m.id ?? m[0]);
        const symbol = String(m.symbol ?? m[3] ?? m[2] ?? m[1] ?? '');
        symbolById.set(id, symbol);
      }

      const iface = new ethers.Interface([
        'event OrderFilled(uint256 indexed orderId, address indexed trader, uint256 indexed marketId, uint256 filledSize, uint256 fillPrice, uint256 timestamp)'
      ]);

      const rows: SpotTradeRow[] = [];
      for (const log of logs) {
        try {
          const parsed = iface.parseLog(log as any);
          const trader = String(parsed.args.trader).toLowerCase();
          if (address && trader !== address.toLowerCase()) continue;
          const orderId = String(parsed.args.orderId);
           const marketId = BigInt(parsed.args.marketId);
           const filledSize = BigInt(parsed.args.filledSize);
           const fillPrice = BigInt(parsed.args.fillPrice);
           const timestamp = BigInt(parsed.args.timestamp);
           const txHash = (log as any)?.transactionHash as string | undefined;
           rows.push({
             orderId,
             market: symbolById.get(marketId) || String(marketId),
             filledSize,
             fillPrice,
             timestamp,
             txHash,
           });
         } catch {}
       }
 
       // sort by timestamp desc
       rows.sort((a, b) => (a.timestamp === b.timestamp ? 0 : (a.timestamp > b.timestamp ? -1 : 1)));
       setTrades(rows);
     } catch (e) {
       console.error('[useSpotUserTrades] fetchTrades error:', e);
       setTrades([]);
     } finally {
       setIsLoading(false);
     }
  }, [address, chainId]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);
  useEffect(() => { setTrades([]); }, [address, chainId]);

  return { trades, isLoading, refetch: fetchTrades };
}