'use client';

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useNetwork } from 'wagmi';
import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';
import toast from 'react-hot-toast';
import { useUserOrders, useOrderBook } from '@/hooks/contracts/useOrderBook';
import { getProvider, getOrderBookContract } from '@/lib/utils/ethersHelpers';
import { getChainConfig } from '@/lib/contracts/addresses';

interface OrderHistoryProps {
  type: 'open' | 'history';
}

interface Order {
  id: string;
  market: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  size: number;
  price: number;
  filled: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  timestamp: Date;
}

export function OrderHistory({ type }: OrderHistoryProps) {
  const { chain } = useNetwork();
  const router = useRouter();
  const chainId = chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
  const { orders: rawOrders, isLoading, refetch } = useUserOrders(chainId);
  const { useCancelOrder } = useOrderBook(chainId);
  const { cancelOrder, isLoading: isCancelling, isSuccess: cancelSuccess, error: cancelError } = useCancelOrder();

  // 记录本次撤单的订单 ID，并避免重复弹窗
  const lastCancelIdRef = useRef<string | null>(null);
  const prevCancelSuccessRef = useRef<boolean>(false);

  // 取消结果反馈与刷新
  useEffect(() => {
    // 仅在成功状态从 false -> true 的瞬间提示一次，避免重复弹窗
    if (cancelSuccess && !prevCancelSuccessRef.current) {
      const toastId = lastCancelIdRef.current ? `cancel-${lastCancelIdRef.current}` : 'cancel-generic';
      toast.success('已取消订单', { id: toastId, duration: 3000 });
      // 不把 refetch 放到依赖中，避免函数引用变化导致重复触发
      refetch?.();
    }
    prevCancelSuccessRef.current = cancelSuccess;
  }, [cancelSuccess]);
  useEffect(() => {
    if (cancelError) {
      const msg = (cancelError as any)?.message || '取消失败';
      toast.error(msg, { id: 'cancel-error', duration: 4000 });
    }
  }, [cancelError]);

  const orders: Order[] = useMemo(() => {
    if (!rawOrders || rawOrders.length === 0) return [];
    return rawOrders
      .filter((o) => {
        const isOpen = o.status === 'PENDING' || o.status === 'PARTIAL';
        const isHistory = o.status === 'FILLED' || o.status === 'CANCELLED';
        return type === 'open' ? isOpen : isHistory;
      })
      .map((o) => {
        const size = Number(formatUnits(o.size, 18));
        const price = Number(formatUnits(o.price, 18));
        const filled = Number(formatUnits(o.filledSize, 18));
        const timestampSec = Number(o.timestamp ?? 0);
        const ts = timestampSec > 0 ? new Date(timestampSec * 1000) : new Date();
        const statusMap: Record<typeof o.status, Order['status']> = {
          PENDING: 'open',
          PARTIAL: 'partial',
          FILLED: 'filled',
          CANCELLED: 'cancelled',
        };
        const orderTypeMap: Record<typeof o.orderType, Order['type']> = {
          LIMIT: 'limit',
          MARKET: 'market',
        };
        const sideMap: Record<typeof o.side, Order['side']> = {
          BUY: 'buy',
          SELL: 'sell',
        };
        return {
          id: o.id,
          market: o.market,
          side: sideMap[o.side],
          type: orderTypeMap[o.orderType],
          size,
          price,
          filled,
          status: statusMap[o.status],
          timestamp: ts,
        } satisfies Order;
      });
  }, [rawOrders, type]);

  // 存储每个订单的交易哈希，避免重复查询
  const [txByOrder, setTxByOrder] = useState<Record<string, string>>({});
  const [txLoadingId, setTxLoadingId] = useState<string | null>(null);

  const getTxUrl = useCallback((hash?: string) => {
    if (!hash) return '';
    const explorer = (chain?.blockExplorers as any)?.default?.url || getChainConfig(chainId)?.blockExplorer || '';
    if (explorer) return `${explorer.replace(/\/$/, '')}/tx/${hash}`;
    return `/trading/tx/${hash}`;
  }, [chain?.blockExplorers, chainId]);

  const resolveTxHashAndNavigate = useCallback(async (order: Order) => {
    try {
      setTxLoadingId(order.id);
      // 已有缓存则直接跳转
      const cached = txByOrder[order.id];
      if (cached) {
        const url = getTxUrl(cached);
        const isInternal = url.startsWith('/trading/tx/');
        if (isInternal) router.push(url); else window.open(url, '_blank', 'noopener');
        return;
      }

      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const ob = getOrderBookContract(chainId, provider);
      const idBN = BigInt(order.id);

      // 根据状态优先查找对应事件的交易哈希
      const tryQuery = async (eventName: 'OrderFilled' | 'OrderCancelled' | 'OrderPlaced') => {
        try {
          const filterFactory = (ob.filters as any)?.[eventName];
          if (typeof filterFactory !== 'function') return undefined;
          const filter = filterFactory(idBN);
          const logs = await ob.queryFilter(filter);
          if (logs && logs.length > 0) {
            const last = logs[logs.length - 1] as any;
            return last?.log?.transactionHash || last?.transactionHash;
          }
        } catch (_) { /* ignore */ }
        return undefined;
      };

      let txHash: string | undefined;
      if (order.status === 'filled') {
        txHash = await tryQuery('OrderFilled') || await tryQuery('OrderPlaced');
      } else if (order.status === 'cancelled') {
        txHash = await tryQuery('OrderCancelled') || await tryQuery('OrderPlaced');
      } else {
        txHash = await tryQuery('OrderPlaced');
      }

      if (!txHash) {
        toast.error('未找到交易哈希');
        return;
      }

      setTxByOrder((prev) => ({ ...prev, [order.id]: txHash! }));
      const url = getTxUrl(txHash);
      const isInternal = url.startsWith('/trading/tx/');
      if (isInternal) router.push(url); else window.open(url, '_blank', 'noopener');
    } catch (e) {
      const msg = (e as any)?.message || '解析交易哈希失败';
      toast.error(msg);
    } finally {
      setTxLoadingId(null);
    }
  }, [chainId, router, txByOrder, getTxUrl]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-muted-foreground">正在加载订单数据...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📋</div>
        <p className="text-muted-foreground">
          {type === 'open' ? 'No open orders' : 'No order history'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {type === 'open' 
            ? 'Your active orders will appear here'
            : 'Your completed orders will appear here'
          }
        </p>
      </div>
    );
  }

  function getStatusColor(status: Order['status']) {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-500';
      case 'filled': return 'bg-green-500/20 text-green-500';
      case 'cancelled': return 'bg-red-500/20 text-red-500';
      case 'partial': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Market</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Side</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Filled</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
            {type === 'open' && (
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            )}
            {type === 'history' && (
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border hover:bg-muted/30">
              <td className="py-3 px-4 text-sm">
                {order.timestamp.toLocaleTimeString()}
              </td>
              <td className="py-3 px-4">
                <span className="font-medium">{order.market}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    order.side === 'buy'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {order.side.toUpperCase()}
                </span>
              </td>
              <td className="py-3 px-4 text-sm capitalize">{order.type}</td>
              <td className="py-3 px-4 text-right text-sm">{order.size}</td>
              <td className="py-3 px-4 text-right text-sm">${order.price.toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-sm">
                {order.filled} / {order.size}
                {order.filled > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ({((order.filled / order.size) * 100).toFixed(1)}%)
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}
                >
                  {order.status.toUpperCase()}
                </span>
              </td>
              {type === 'open' && (
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => { lastCancelIdRef.current = order.id; cancelOrder({ orderId: order.id }); }}
                    className="px-3 py-1 rounded bg-muted hover:bg-muted/70 text-sm border border-border disabled:opacity-50"
                    disabled={isCancelling}
                  >
                    {isCancelling && lastCancelIdRef.current === order.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                </td>
              )}
              {type === 'history' && (
                <td className="py-3 px-4 text-right">
                  {txByOrder[order.id] ? (
                    <a
                      className="px-3 py-1 rounded bg-muted hover:bg-muted/70 text-sm border border-border"
                      href={getTxUrl(txByOrder[order.id])}
                      target={getTxUrl(txByOrder[order.id]).startsWith('/trading/tx/') ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                    >
                      查看交易
                    </a>
                  ) : (
                    <button
                      className="px-3 py-1 rounded bg-muted hover:bg-muted/70 text-sm border border-border disabled:opacity-50"
                      onClick={() => resolveTxHashAndNavigate(order)}
                      disabled={txLoadingId === order.id}
                    >
                      {txLoadingId === order.id ? '解析中…' : '查看交易'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}