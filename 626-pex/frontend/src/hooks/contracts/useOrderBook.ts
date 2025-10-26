'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { OrderBookABI } from '@/lib/contracts/abi';
import { getContractAddresses } from '@/lib/contracts/addresses';
import { PlaceOrderParams, CancelOrderParams, OrderBookOrder } from '@/lib/contracts/types';
import { getProvider, getOrderBookContract, getPerpMarketContract } from '@/lib/utils/ethersHelpers';

export function useOrderBook(chainId: number) {
  const { address } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  // Place Order
  const usePlaceOrder = () => {
    const [orderParams, setOrderParams] = useState<PlaceOrderParams | null>(null);
    const submittedRef = useRef(false);

    const { config, error: prepareError } = usePrepareContractWrite({
      chainId,
      address: contractAddresses.orderBook as `0x${string}`,
      abi: OrderBookABI,
      functionName: 'placeOrder',
      args: orderParams ? [
        BigInt((orderParams as any).marketId ?? 0),
        orderParams.orderType === 'LIMIT' ? 0 : 1, // OrderType enum
        orderParams.side === 'BUY' ? 0 : 1, // OrderSide enum
        parseEther(orderParams.size),
        orderParams.price ? parseEther(orderParams.price) : 0n,
        BigInt(orderParams.leverage),
      ] : undefined,
      enabled: !!orderParams && !!address,
    });

    const { write, isLoading, isSuccess, error } = useContractWrite(config);

    const placeOrder = useCallback((params: PlaceOrderParams) => {
      // 设置参数，并清除一次性触发标记
      submittedRef.current = false;
      setOrderParams(params);
    }, []);

    // 仅执行一次写入，避免 React 严格模式或 write 变化导致重复触发
    useEffect(() => {
      if (!orderParams) return;
      if (!write) return;
      if (submittedRef.current) return;
      submittedRef.current = true;
      try {
        write();
      } catch (_) {
        // swallow
      }
    }, [orderParams, write]);

    // 当钱包地址变化时，清除未完成的参数，避免新的 write 引用再次触发旧单
    useEffect(() => {
      submittedRef.current = false;
      setOrderParams(null);
    }, [address]);

    return {
      placeOrder,
      isLoading,
      isSuccess,
      // 合并 prepare 阶段与 write 阶段的错误，便于上层统一提示
      error: error || prepareError,
    };
  };

  // Cancel Order
  const useCancelOrder = () => {
    const [orderId, setOrderId] = useState<string | null>(null);
    const cancelSubmittedRef = useRef(false);

    const { config, error: prepareError } = usePrepareContractWrite({
      chainId,
      address: contractAddresses.orderBook as `0x${string}`,
      abi: OrderBookABI,
      functionName: 'cancelOrder',
      args: orderId ? [BigInt(orderId)] : undefined,
      enabled: !!orderId && !!address,
    });

    const { write, isLoading, isSuccess, error } = useContractWrite(config);

    const cancelOrder = useCallback((params: CancelOrderParams) => {
      cancelSubmittedRef.current = false;
      setOrderId(params.orderId);
    }, []);

    useEffect(() => {
      if (!orderId) return;
      if (!write) return;
      if (cancelSubmittedRef.current) return;
      cancelSubmittedRef.current = true;
      try {
        write();
      } catch (_) {
        // swallow
      }
    }, [orderId, write]);

    useEffect(() => {
      cancelSubmittedRef.current = false;
      setOrderId(null);
    }, [address]);

    return {
      cancelOrder,
      isLoading,
      isSuccess,
      // 合并 prepare 阶段与 write 阶段的错误
      error: error || prepareError,
    };
  };

  // Get Order
  const useGetOrder = (orderId: string | undefined) => {
    const { data, isLoading, error, refetch } = useContractRead({
      chainId,
      address: contractAddresses.orderBook as `0x${string}`,
      abi: OrderBookABI,
      functionName: 'getOrder',
      args: orderId ? [BigInt(orderId)] : undefined,
      enabled: !!orderId,
      watch: true,
    });

    const order: OrderBookOrder | null = data ? {
      id: data[0] as string,
      trader: data[1] as string,
      market: String(data[2] as bigint),
      orderType: data[3] === 0 ? 'LIMIT' : 'MARKET',
      side: data[4] === 0 ? 'BUY' : 'SELL',
      size: data[5] as bigint,
      price: data[6] as bigint,
      filledSize: data[7] as bigint,
      timestamp: data[8] as bigint,
      // 合约枚举顺序：PENDING(0), FILLED(1), CANCELLED(2), PARTIALLY_FILLED(3)
      status: (['PENDING', 'FILLED', 'CANCELLED', 'PARTIAL'] as const)[data[9] as number],
      leverage: Number(data[10]),
    } : null;

    return {
      order,
      isLoading,
      error,
      refetch,
    };
  };

  // Get Orders by Trader
  const useGetOrdersByTrader = (trader?: string) => {
    const { data, isLoading, error, refetch } = useContractRead({
      chainId,
      address: contractAddresses.orderBook as `0x${string}`,
      abi: OrderBookABI,
      functionName: 'getOrdersByTrader',
      args: trader ? [trader as `0x${string}`] : undefined,
      enabled: !!trader,
      watch: false,
    });

    return {
      // getOrdersByTrader returns uint256[] -> readonly bigint[]
      // Convert to a mutable bigint[] to avoid readonly assignment issues
      orderIds: Array.isArray(data) ? Array.from(data as readonly bigint[]) : [],
      isLoading,
      error,
      refetch,
    };
  };

  // Get Order Book
  const useGetOrderBook = (marketId: number | bigint, depth: number = 10) => {
    const { data, isLoading, error, refetch } = useContractRead({
      chainId,
      address: contractAddresses.orderBook as `0x${string}`,
      abi: OrderBookABI,
      functionName: 'getOrderBook',
      args: [BigInt(marketId), BigInt(depth)],
      enabled: marketId !== undefined && marketId !== null,
      watch: true,
    });

    const orderBook = data ? {
      bids: (data[0] as Array<{ price: bigint; totalSize: bigint; orderCount: bigint }>).map((level) => [
        formatEther(level.price),
        formatEther(level.totalSize),
      ]) as Array<[string, string]>,
      asks: (data[1] as Array<{ price: bigint; totalSize: bigint; orderCount: bigint }>).map((level) => [
        formatEther(level.price),
        formatEther(level.totalSize),
      ]) as Array<[string, string]>,
    } : { bids: [], asks: [] };

    return {
      orderBook,
      isLoading,
      error,
      refetch,
    };
  };

  return {
    usePlaceOrder,
    useCancelOrder,
    useGetOrder,
    useGetOrdersByTrader,
    useGetOrderBook,
  };
}

// Hook for getting user's orders with full order details
export function useUserOrders(chainId: number) {
  const { address } = useAccount();
  const { useGetOrdersByTrader, useGetOrder } = useOrderBook(chainId);
  
  const { orderIds, isLoading: isLoadingIds, refetch: refetchIds } = useGetOrdersByTrader(address);
  const [orders, setOrders] = useState<OrderBookOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Helper: fetch full order details for current orderIds
  const fetchOrders = useCallback(async (ids: Array<string | bigint> | undefined) => {
    const targetIds: Array<string | bigint> = ids ?? orderIds;
    if (!targetIds || targetIds.length === 0) {
      setOrders([]);
      return;
    }

    setIsLoading(true);

    try {
      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const orderBook = getOrderBookContract(chainId, provider);
      const perpMarket = getPerpMarketContract(chainId, provider);

      const markets = await perpMarket.getAllMarkets();
      const symbolById = new Map<bigint, string>();
      for (const m of markets) {
        symbolById.set(BigInt(m.id ?? m[0]), String(m.symbol ?? m[1]));
      }

      const full = await Promise.all(targetIds.map(async (oid) => {
        const idBN = typeof oid === 'bigint' ? oid : BigInt(oid);
        const o = await orderBook.getOrder(idBN);
        const marketId = BigInt(o.marketId ?? o[2]);
        const symbol = symbolById.get(marketId) || String(marketId);
        const statusIndex = Number(o.status ?? o[9]);
        // 修正状态映射，避免把已成交订单误归类为“部分成交”
        const status = (['PENDING', 'FILLED', 'CANCELLED', 'PARTIAL'] as const)[statusIndex] ?? 'PENDING';
        return {
          id: String(o.id ?? o[0]),
          trader: String(o.trader ?? o[1]),
          market: symbol,
          orderType: Number(o.orderType ?? o[3]) === 0 ? 'LIMIT' : 'MARKET',
          side: Number(o.side ?? o[4]) === 0 ? 'BUY' : 'SELL',
          size: BigInt(o.size ?? o[5]),
          price: BigInt(o.price ?? o[6]),
          filledSize: BigInt(o.filledSize ?? o[7]),
          timestamp: BigInt(o.timestamp ?? o[8]),
          status,
          leverage: Number(o.leverage ?? o[10]),
        } as OrderBookOrder;
      }));

      setOrders(full);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [orderIds, chainId]);

  // Fetch full order details for each order ID
  useEffect(() => {
    fetchOrders(orderIds);
  }, [orderIds, fetchOrders]);

  // Reset initial loading flag when address or chain changes
  useEffect(() => {
    setHasLoaded(false);
  }, [address, chainId]);

  // Real-time: subscribe to order events and refresh on changes
  useEffect(() => {
    if (!address) return;

    const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const orderBook = getOrderBookContract(chainId, provider);

    const onPlaced = (orderId: bigint, trader_: string) => {
      if (trader_.toLowerCase() === address.toLowerCase()) {
        refetchIds?.();
      }
    };

    const onFilled = (orderId: bigint, trader_: string) => {
      if (trader_.toLowerCase() === address.toLowerCase()) {
        refetchIds?.();
      }
    };

    const onCancelled = (orderId: bigint, trader_: string) => {
      if (trader_.toLowerCase() === address.toLowerCase()) {
        refetchIds?.();
      }
    };

    orderBook.on('OrderPlaced', onPlaced as any);
    orderBook.on('OrderFilled', onFilled as any);
    orderBook.on('OrderCancelled', onCancelled as any);

    return () => {
      try {
        orderBook.off('OrderPlaced', onPlaced as any);
        orderBook.off('OrderFilled', onFilled as any);
        orderBook.off('OrderCancelled', onCancelled as any);
      } catch {}
    };
  }, [address, chainId, refetchIds]);

  return {
    orders,
    // 仅在首次加载时显示加载态，其后使用表格内容稳定显示
    isLoading: !hasLoaded && (isLoadingIds || isLoading),
    refetch: () => refetchIds?.(),
  };
}

// Hook for real-time order book updates
export function useOrderBookSubscription(marketId: number | bigint, chainId: number) {
  const { useGetOrderBook } = useOrderBook(chainId);
  const { orderBook, isLoading, error, refetch } = useGetOrderBook(marketId);

  // 回退聚合：当合约未实现 getOrderBook 聚合或返回零值时，客户端重建订单簿
  const [clientAggBook, setClientAggBook] = useState<{ bids: Array<[string, string]>; asks: Array<[string, string]> } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function rebuildFromOrders() {
      try {
        // 仅在 marketId 合法时尝试重建
        const mkId = BigInt(marketId ?? 0n);
        if (mkId === 0n) { if (mounted) setClientAggBook({ bids: [], asks: [] }); return; }

        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const ob = getOrderBookContract(chainId, provider);
        const totalCountBN: bigint = await ob.getOrderCount();
        const totalCount = Number(totalCountBN);
        if (!Number.isFinite(totalCount) || totalCount <= 0) { if (mounted) setClientAggBook({ bids: [], asks: [] }); return; }

        // 限制遍历上限，避免在测试环境之外造成性能问题
        const cap = Math.min(totalCount, 500);
        const ids = Array.from({ length: cap }, (_, i) => BigInt(i + 1)); // 遍历 1..cap

        const orders = await Promise.all(ids.map(async (id) => {
          try { return await ob.getOrder(id); } catch { return null; }
        }));

        const bidsMap = new Map<bigint, bigint>(); // price => totalSize
        const asksMap = new Map<bigint, bigint>(); // price => totalSize

        for (const o of orders) {
          if (!o) continue;
          const marketIdBN = BigInt((o.marketId ?? o[2]) as bigint);
          if (marketIdBN !== mkId) continue;

          const orderTypeN = Number(o.orderType ?? o[3]); // 0 LIMIT, 1 MARKET
          if (orderTypeN !== 0) continue; // 仅聚合限价单

          const sideN = Number(o.side ?? o[4]); // 0 BUY, 1 SELL
          const sizeBN = BigInt(o.size ?? o[5]);
          const filledBN = BigInt(o.filledSize ?? o[7]);
          const remaining = sizeBN > filledBN ? (sizeBN - filledBN) : 0n;
          if (remaining === 0n) continue;

          const statusIndex = Number(o.status ?? o[9]);
          // 合约枚举顺序：PENDING(0), FILLED(1), CANCELLED(2), PARTIALLY_FILLED(3)
          const status = (['PENDING', 'FILLED', 'CANCELLED', 'PARTIAL'] as const)[statusIndex] ?? 'PENDING';
          if (status !== 'PENDING' && status !== 'PARTIAL') continue; // 仅保留未成交或部分成交剩余量

          const priceBN = BigInt(o.price ?? o[6]);
          if (priceBN === 0n) continue; // 排除无价格订单

          const map = sideN === 0 ? bidsMap : asksMap;
          map.set(priceBN, (map.get(priceBN) ?? 0n) + remaining);
        }

        const bids = [...bidsMap.entries()]
          .sort((a, b) => (a[0] === b[0] ? 0 : (a[0] > b[0] ? -1 : 1))) // 价格降序
          .slice(0, 10)
          .map(([p, s]) => [formatEther(p), formatEther(s)] as [string, string]);
        const asks = [...asksMap.entries()]
          .sort((a, b) => (a[0] === b[0] ? 0 : (a[0] < b[0] ? -1 : 1))) // 价格升序
          .slice(0, 10)
          .map(([p, s]) => [formatEther(p), formatEther(s)] as [string, string]);

        if (mounted) setClientAggBook({ bids, asks });
      } catch (_) {
        if (mounted) setClientAggBook({ bids: [], asks: [] });
      }
    }

    rebuildFromOrders();
    const interval = setInterval(rebuildFromOrders, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, [marketId, chainId]);

  // 合并：若合约返回有效价位与数量则使用合约数据；否则使用客户端聚合结果
  const mergedOrderBook = {
    bids: (orderBook?.bids ?? []).some(([p, s]) => Number(p) > 0 && Number(s) > 0)
      ? (orderBook?.bids ?? [])
      : (clientAggBook?.bids ?? []),
    asks: (orderBook?.asks ?? []).some(([p, s]) => Number(p) > 0 && Number(s) > 0)
      ? (orderBook?.asks ?? [])
      : (clientAggBook?.asks ?? []),
  };

  // Set up real-time updates (WebSocket or polling)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 1000); // Poll every second - replace with WebSocket in production

    return () => clearInterval(interval);
  }, [refetch]);

  return {
    orderBook: mergedOrderBook,
    isLoading,
    error,
  };
}