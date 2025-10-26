'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNetwork } from 'wagmi';
import toast from 'react-hot-toast';
import { useSpot } from '@/hooks/contracts/useSpot';
import { useSpotUserOrders, SpotOrderRow } from '@/hooks/contracts/useSpotUserOrders';
import { formatEther } from 'viem';

export function SpotOpenOrders() {
  const { chain } = useNetwork();
  const chainId = useMemo(() => Number(chain?.id ?? (process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337)), [chain?.id]);
  const { orders: rawOrders, isLoading, refetch } = useSpotUserOrders(chainId);
  const { useCancelSpotOrder } = useSpot(chainId);
  const { cancelOrder, isLoading: isCancelling, isSuccess: cancelSuccess, error: cancelError } = useCancelSpotOrder();

  const [orders, setOrders] = useState<SpotOrderRow[]>([]);
  const lastCancelIdRef = useRef<string | null>(null);
  const prevCancelSuccessRef = useRef<boolean>(false);

  useEffect(() => {
    const open = rawOrders.filter(o => o.status === 'PENDING' || o.status === 'PARTIAL');
    setOrders(open);
  }, [rawOrders]);

  useEffect(() => {
    if (cancelSuccess && !prevCancelSuccessRef.current) {
      toast.success('已取消订单', { id: lastCancelIdRef.current ? `cancel-${lastCancelIdRef.current}` : 'cancel-spot', duration: 3000 });
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

  const fmt = (bn: bigint) => {
    const s = formatEther(bn);
    const [i, f] = s.split('.');
    return f ? `${i}.${f.slice(0, 6)}` : i;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">挂单列表</h3>
        <div className="text-xs text-muted-foreground">{isLoading ? '加载中…' : ''}</div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="py-2 px-4 text-left">订单ID</th>
            <th className="py-2 px-4 text-left">市场</th>
            <th className="py-2 px-4 text-left">方向</th>
            <th className="py-2 px-4 text-right">数量</th>
            <th className="py-2 px-4 text-right">价格</th>
            <th className="py-2 px-4 text-right">已成交</th>
            <th className="py-2 px-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="border-b border-border">
              <td className="py-2 px-4">{order.id}</td>
              <td className="py-2 px-4">{order.market}</td>
              <td className="py-2 px-4">{order.side}</td>
              <td className="py-2 px-4 text-right">{fmt(order.size)}</td>
              <td className="py-2 px-4 text-right">{fmt(order.price)}</td>
              <td className="py-2 px-4 text-right">{fmt(order.filledSize)}</td>
              <td className="py-2 px-4 text-right">
                <button
                  onClick={() => { lastCancelIdRef.current = order.id; cancelOrder(order.id); }}
                  className="px-3 py-1 rounded bg-muted hover:bg-muted/70 text-sm border border-border disabled:opacity-50"
                  disabled={isCancelling && lastCancelIdRef.current === order.id}
                >
                  {isCancelling && lastCancelIdRef.current === order.id ? '取消中…' : '取消'}
                </button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 px-4 text-center text-muted-foreground">暂无挂单</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}