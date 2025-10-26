'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { PerpMarketABI } from '@/lib/contracts/abi';
import { getContractAddresses, marketSymbolToBytes32 } from '@/lib/contracts/addresses';
import { 
  OpenPositionParams, 
  ClosePositionParams, 
  Position, 
  Market,
  LiquidationInfo 
} from '@/lib/contracts/types';
import { getProvider, getPerpMarketContract, getOrderBookContract } from '@/lib/utils/ethersHelpers';
import { calculateLiquidationPrice, calculateUnrealizedPnL } from '@/lib/utils/contractHelpers';

export function usePerpMarket(chainId: number) {
  const contractAddresses = getContractAddresses(chainId);

  // Open Position
  const useOpenPosition = () => {
    const [positionParams, setPositionParams] = useState<OpenPositionParams | null>(null);

    const openPosition = useCallback(async (params: OpenPositionParams) => {
      setPositionParams(params);
      
      try {
        // Mock implementation - replace with actual contract call
        console.log('Opening position:', params);
        
        // Simulate contract interaction
        const result = {
          hash: '0x' + Math.random().toString(16).substr(2, 64),
          success: true,
        };
        
        return result;
      } catch (error) {
        console.error('Error opening position:', error);
        throw error;
      }
    }, []);

    return {
      openPosition,
      isLoading: false,
      isSuccess: false,
      error: null,
    };
  };

  // Close Position
  const useClosePosition = () => {
    const [isLoading, setIsLoading] = useState(false);

    const closePosition = useCallback(async (params: ClosePositionParams) => {
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        console.log('Closing position:', params);
        
        // Simulate contract interaction
        const result = {
          hash: '0x' + Math.random().toString(16).substr(2, 64),
          success: true,
        };
        
        return result;
      } catch (error) {
        console.error('Error closing position:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);

    return {
      closePosition,
      isLoading,
      isSuccess: false,
      error: null,
    };
  };

  // Get Position
  const useGetPosition = (trader: string, market: string) => {
    const [position, setPosition] = useState<Position | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPosition = useCallback(async () => {
      if (!trader || !market) return;
      
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        const mockPosition: Position = {
          id: `${trader}-${market}`,
          trader: trader as `0x${string}`,
          market: market,
          side: Math.random() > 0.5 ? 'LONG' : 'SHORT',
          size: BigInt(Math.floor(Math.random() * 1000000000000000000)), // Random size in wei
          entryPrice: BigInt(Math.floor(Math.random() * 50000000000000000000000)), // Random price
          markPrice: BigInt(Math.floor(Math.random() * 50000000000000000000000)),
          leverage: Math.floor(Math.random() * 20) + 1,
          margin: BigInt(Math.floor(Math.random() * 1000000000000000000)),
          unrealizedPnl: BigInt(Math.floor(Math.random() * 200000000000000000) - 100000000000000000),
          liquidationPrice: BigInt(Math.floor(Math.random() * 40000000000000000000000)),
          timestamp: BigInt(Date.now()),
          status: 'OPEN',
        };
        
        setPosition(mockPosition);
      } catch (error) {
        console.error('Error fetching position:', error);
        setPosition(null);
      } finally {
        setIsLoading(false);
      }
    }, [trader, market]);

    return {
      position,
      isLoading,
      error: null,
      refetch: fetchPosition,
    };
  };

  // Get Market Info
  const useGetMarketInfo = (market: string) => {
    const [marketInfo, setMarketInfo] = useState<Market | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMarketInfo = useCallback(async () => {
      if (!market) return;
      
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        const mockMarket: Market = {
          symbol: market,
          baseAsset: 'BTC',
          quoteAsset: 'USD',
          indexPrice: BigInt(Math.floor(Math.random() * 50000000000000000000000)),
          markPrice: BigInt(Math.floor(Math.random() * 50000000000000000000000)),
          fundingRate: BigInt(Math.floor(Math.random() * 1000000000000000) - 500000000000000),
          nextFundingTime: BigInt(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          openInterest: BigInt(Math.floor(Math.random() * 100000000000000000000)),
          maxLeverage: 100,
          maintenanceMarginRate: BigInt(500000000000000), // 0.5%
          isActive: true,
          lastUpdateTime: BigInt(Date.now()),
        };
        
        setMarketInfo(mockMarket);
      } catch (error) {
        console.error('Error fetching market info:', error);
        setMarketInfo(null);
      } finally {
        setIsLoading(false);
      }
    }, [market]);

    return {
      marketInfo,
      isLoading,
      error: null,
      refetch: fetchMarketInfo,
    };
  };

  // Get Liquidation Info
  const useGetLiquidationInfo = (trader: string, market: string) => {
    const [liquidationInfo, setLiquidationInfo] = useState<LiquidationInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchLiquidationInfo = useCallback(async () => {
      if (!trader || !market) return;
      
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        const mockLiquidationInfo: LiquidationInfo = {
          trader: trader as `0x${string}`,
          market: market,
          liquidationPrice: BigInt(Math.floor(Math.random() * 40000000000000000000000)),
          maintenanceMargin: BigInt(Math.floor(Math.random() * 1000000000000000000)),
          marginRatio: BigInt(Math.floor(Math.random() * 2000000000000000)), // 0-2%
          isLiquidatable: Math.random() > 0.9, // 10% chance of being liquidatable
          timeToLiquidation: BigInt(Math.floor(Math.random() * 3600)), // 0-1 hour
        };
        
        setLiquidationInfo(mockLiquidationInfo);
      } catch (error) {
        console.error('Error fetching liquidation info:', error);
        setLiquidationInfo(null);
      } finally {
        setIsLoading(false);
      }
    }, [trader, market]);

    return {
      liquidationInfo,
      isLoading,
      error: null,
      refetch: fetchLiquidationInfo,
    };
  };

  return {
    useOpenPosition,
    useClosePosition,
    useGetPosition,
    useGetMarketInfo,
    useGetLiquidationInfo,
  };
}

// Hook for getting all user positions
export function useUserPositions(chainId: number, trader?: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPositions = useCallback(async () => {
    if (!trader) return;

    setIsLoading(true);

    try {
      // Build provider and contracts
      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const perpMarket = getPerpMarketContract(chainId, provider);
      const orderBook = getOrderBookContract(chainId, provider);

      // Resolve marketId -> symbol map
      const markets = await perpMarket.getAllMarkets();
      const symbolById = new Map<bigint, string>();
      for (const m of markets) {
        const id = BigInt(m.id ?? m[0]);
        const symbol = String(m.symbol ?? m[1]);
        symbolById.set(id, symbol);
      }

      // Query position events for this trader
      const filterOpen = perpMarket.filters.PositionOpened(trader);
      const filterClose = perpMarket.filters.PositionClosed(trader);
      const latestBlock = await provider.getBlockNumber();

      const openedLogs = await perpMarket.queryFilter(filterOpen, 0, latestBlock);
      const closedLogs = await perpMarket.queryFilter(filterClose, 0, latestBlock);

      type Key = string; // `${marketId}-${side}`
      const state = new Map<Key, {
        marketId: bigint;
        side: 'LONG' | 'SHORT';
        size: bigint;
        // weighted average entry price
        entryPrice: bigint;
        leverage: number;
        margin: bigint;
        // latest timestamp
        timestamp: bigint;
      }>();

      const addOpen = (marketId: bigint, side: number, size: bigint, entryPrice: bigint, leverage: bigint, margin: bigint, ts: bigint) => {
        const sideText: 'LONG' | 'SHORT' = side === 0 ? 'LONG' : 'SHORT';
        const key = `${marketId}-${sideText}`;
        const prev = state.get(key) ?? { marketId, side: sideText, size: 0n, entryPrice: 0n, leverage: Number(leverage), margin: 0n, timestamp: 0n };
        const newSize = prev.size + size;
        // Weighted average using bigint math: (p1*s1 + p2*s2) / (s1+s2)
        const weighted = prev.size === 0n
          ? entryPrice
          : ((prev.entryPrice * prev.size) + (entryPrice * size)) / (newSize === 0n ? 1n : newSize);
        state.set(key, {
          marketId,
          side: sideText,
          size: newSize,
          entryPrice: weighted,
          leverage: Number(leverage),
          margin: prev.margin + margin,
          timestamp: ts,
        });
      };

      const addClose = (marketId: bigint, side: number | undefined, size: bigint, ts: bigint) => {
        // If side is undefined, deduce from current state (prefer any non-zero side)
        const keyLong = `${marketId}-LONG`;
        const keyShort = `${marketId}-SHORT`;
        const targetKey = typeof side === 'number'
          ? (side === 0 ? keyLong : keyShort)
          : ((state.get(keyLong)?.size ?? 0n) > 0n ? keyLong : keyShort);
        const prev = state.get(targetKey);
        if (!prev) return;
        const newSize = prev.size - size;
        state.set(targetKey, {
          ...prev,
          size: newSize > 0n ? newSize : 0n,
          timestamp: ts,
        });
      };

      // Process opened events (robust decode to avoid args typing issues)
      for (const log of openedLogs) {
        try {
          const decoded: any = perpMarket.interface.decodeEventLog('PositionOpened', (log as any).data, (log as any).topics);
          const marketId = BigInt(decoded.marketId ?? decoded[1]);
          const side = Number(decoded.side ?? decoded[2]);
          const size = BigInt(decoded.size ?? decoded[3]);
          const entryPrice = BigInt(decoded.entryPrice ?? decoded[4]);
          const leverage = BigInt(decoded.leverage ?? decoded[5]);
          const margin = BigInt(decoded.margin ?? decoded[6]);
          const ts = BigInt((log as any).blockNumber ?? 0);
          addOpen(marketId, side, size, entryPrice, leverage, margin, ts);
        } catch (e) {
          // skip if decode fails
        }
      }

      // Process closed events
      for (const log of closedLogs) {
        try {
          const decoded: any = perpMarket.interface.decodeEventLog('PositionClosed', (log as any).data, (log as any).topics);
          const marketId = BigInt(decoded.marketId ?? decoded[1]);
          const size = BigInt(decoded.size ?? decoded[2]);
          const ts = BigInt((log as any).blockNumber ?? 0);
          // side not emitted in PositionClosed; deduce from current state
          addClose(marketId, undefined, size, ts);
        } catch (e) {
          // skip if decode fails
        }
      }

      // Prepare positions list
      const positionsOut: Position[] = [];
      for (const [key, item] of state) {
        if (item.size <= 0n) continue;
        const symbol = symbolById.get(item.marketId) || String(item.marketId);

        // Fetch top-of-book to approximate mark price
        let markPrice = item.entryPrice;
        try {
          const ob = await orderBook.getOrderBook(item.marketId, 1n);
          const bestBid = ob?.bids?.[0]?.price ?? ob?.[0]?.[0]?.price;
          const bestAsk = ob?.asks?.[0]?.price ?? ob?.[1]?.[0]?.price;
          if (bestBid && bestAsk) {
            markPrice = BigInt(Math.floor((Number(bestBid) + Number(bestAsk)) / 2));
          } else if (bestBid || bestAsk) {
            const one = Number(bestBid ?? bestAsk);
            markPrice = BigInt(Math.floor(one));
          }
        } catch (e) {
          // fallback: keep entryPrice
        }

        // Approximate liquidation price using a default maintenance margin rate of 0.5%
        const mmr = BigInt(5000000000000000); // 0.5% in 1e18
        const liq = calculateLiquidationPrice(item.entryPrice, item.leverage || 1, item.side, mmr);
        const pnl = calculateUnrealizedPnL(item.entryPrice, markPrice, item.size, item.side);

        positionsOut.push({
          id: `${trader}-${key}`,
          trader,
          market: symbol,
          side: item.side,
          size: item.size,
          entryPrice: item.entryPrice,
          markPrice,
          leverage: item.leverage || 1,
          margin: item.margin,
          unrealizedPnl: pnl,
          liquidationPrice: liq,
          timestamp: item.timestamp,
          status: 'OPEN',
        });
      }

      setPositions(positionsOut);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, [trader, chainId]);

  return {
    positions,
    isLoading,
    error: null,
    refetch: fetchPositions,
  };
}

// Real-time subscription: refresh positions on relevant events
export function useUserPositionsSubscription(chainId: number, trader?: string) {
  const { refetch } = useUserPositions(chainId, trader);

  useEffect(() => {
    if (!trader) return;
    const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const perpMarket = getPerpMarketContract(chainId, provider);

    const onOpened = (trader_: string) => {
      if (trader_.toLowerCase() === trader.toLowerCase()) {
        refetch();
      }
    };
    const onClosed = (trader_: string) => {
      if (trader_.toLowerCase() === trader.toLowerCase()) {
        refetch();
      }
    };

    perpMarket.on('PositionOpened', onOpened as any);
    perpMarket.on('PositionClosed', onClosed as any);

    return () => {
      try {
        perpMarket.off('PositionOpened', onOpened as any);
        perpMarket.off('PositionClosed', onClosed as any);
      } catch {}
    };
  }, [chainId, trader, refetch]);
}