'use client';


import { useMemo, useEffect, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { ethers } from 'ethers';
import { getProvider, getOrderBookContract, getPerpMarketContract } from '@/lib/utils/ethersHelpers';
import { getContractAddresses, DEFAULT_CHAIN_ID } from '@/lib/contracts/addresses';
import { getChainConfig } from '@/lib/contracts/addresses';
import { useUserOrders } from '@/hooks/contracts/useOrderBook';

type TradeRow = {
  orderId: string;
  trader: string;
  symbol: string;
  orderType: 'LIMIT' | 'MARKET';
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  leverage: number;
  timestamp: number;
  status: 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';
  txHash?: string;
};

function parseDateParam(v?: string): number | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (isNaN(d.getTime())) return undefined;
  return Math.floor(d.getTime() / 1000);
}

export default function Page() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_CHAIN_ID), [chain?.id]);
  const getTxUrl = useMemo(() => {
    return (hash?: string) => {
      if (!hash) return '';
      const explorer = (chain?.blockExplorers as any)?.default?.url || getChainConfig(chainId)?.blockExplorer || '';
      if (explorer) return `${explorer.replace(/\/$/, '')}/tx/${hash}`;
      return `/trading/tx/${hash}`;
    };
  }, [chain?.blockExplorers, chainId]);

  // 加载当前用户订单
  const { orders, isLoading } = useUserOrders(chainId);

  // 市场列表用于下拉选择
  const [markets, setMarkets] = useState<Array<{ id: bigint; symbol: string }>>([]);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const pm = getPerpMarketContract(chainId, provider);
        const ms = await pm.getAllMarkets();
        if (mounted) setMarkets(ms.map((m: any) => ({ id: BigInt(m.id ?? m[0]), symbol: String(m.symbol ?? m[1]) })));
      } catch (_) {
        if (mounted) setMarkets([]);
      }
    };
    run();
    return () => { mounted = false; };
  }, [chainId]);

  // 为每个订单解析交易哈希（可选）
  const [txMap, setTxMap] = useState<Record<string, string | undefined>>({});
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const addresses = getContractAddresses(chainId);
        const topicOrderPlaced = ethers.id('OrderPlaced(uint256,address,uint256,uint8,uint8,uint256,uint256,uint256)');
        const next: Record<string, string | undefined> = {};
        await Promise.all((orders || []).map(async (o) => {
          try {
            const idBN = BigInt(o.id);
            const logs = await provider.getLogs({
              address: addresses.orderBook,
              topics: [topicOrderPlaced, ethers.toBeHex(idBN, 32)],
              fromBlock: 0,
              toBlock: 'latest',
            });
            next[o.id] = logs?.[0]?.transactionHash;
          } catch (_) {
            next[o.id] = undefined;
          }
        }));
        if (mounted) setTxMap(next);
      } catch (_) {
        // ignore
      }
    };
    if (orders && orders.length > 0) run();
    return () => { mounted = false; };
  }, [orders, chainId]);

  // 客户端筛选
  const qMarket = searchParams.get('market') || undefined;
  const qOrderType = searchParams.get('orderType') || undefined;
  const qStart = parseDateParam(searchParams.get('start') || undefined);
  const qEnd = parseDateParam(searchParams.get('end') || undefined);

  const rows: TradeRow[] = useMemo(() => {
    const base = (orders || []).map((o) => ({
      orderId: String(o.id),
      trader: String(o.trader),
      symbol: String(o.market),
      orderType: o.orderType,
      side: o.side,
      size: ethers.formatEther(o.size),
      price: ethers.formatEther(o.price),
      leverage: o.leverage,
      timestamp: Number(o.timestamp ?? 0n),
      status: o.status,
      txHash: txMap[String(o.id)],
    }));

    let filtered = base;
    if (qMarket) filtered = filtered.filter((it) => it.symbol === qMarket);
    if (qOrderType === 'LIMIT' || qOrderType === 'MARKET') filtered = filtered.filter((it) => it.orderType === qOrderType);
    if (typeof qStart === 'number') filtered = filtered.filter((it) => it.timestamp >= qStart);
    if (typeof qEnd === 'number') filtered = filtered.filter((it) => it.timestamp <= qEnd);
    // 时间倒序
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered;
  }, [orders, txMap, qMarket, qOrderType, qStart, qEnd]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">交易记录</h1>
        {address && (
          <div className="text-sm text-muted-foreground">当前账户：{address}</div>
        )}
      </div>

      {/* 筛选条件 */}
      <form className="flex flex-wrap gap-3 items-end" method="get">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">市场</label>
          <select name="market" defaultValue={qMarket || ''} className="border border-border rounded px-3 py-2 text-sm bg-background">
            <option value="">全部</option>
            {markets.map(m => (
              <option key={m.id.toString()} value={m.symbol}>{m.symbol}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">订单类型</label>
          <select name="orderType" defaultValue={qOrderType || ''} className="border border-border rounded px-3 py-2 text-sm bg-background">
            <option value="">全部</option>
            <option value="LIMIT">LIMIT</option>
            <option value="MARKET">MARKET</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">开始时间</label>
          <input type="datetime-local" name="start" defaultValue={searchParams.get('start') || ''} className="border border-border rounded px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">结束时间</label>
          <input type="datetime-local" name="end" defaultValue={searchParams.get('end') || ''} className="border border-border rounded px-3 py-2 text-sm bg-background" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm">筛选</button>
          <a href="/trading/history" className="px-4 py-2 rounded border border-border text-sm">重置</a>
        </div>
      </form>

      {isLoading ? (
        <div className="text-muted-foreground">正在加载…</div>
      ) : rows.length === 0 ? (
        <div className="text-muted-foreground">暂无交易记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-6">时间</th>
                <th className="py-2 pr-6">市场</th>
                <th className="py-2 pr-6">类型</th>
                <th className="py-2 pr-6">方向</th>
                <th className="py-2 pr-6">数量</th>
                <th className="py-2 pr-6">价格</th>
                <th className="py-2 pr-6">杠杆</th>
                <th className="py-2 pr-6">状态</th>
                <th className="py-2 pr-6">交易</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.orderId} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-6">
                    {it.timestamp ? new Date(it.timestamp * 1000).toLocaleString() : '-'}
                  </td>
                  <td className="py-2 pr-6">{it.symbol}</td>
                  <td className="py-2 pr-6">{it.orderType}</td>
                  <td className="py-2 pr-6">{it.side}</td>
                  <td className="py-2 pr-6">{it.size}</td>
                  <td className="py-2 pr-6">{it.price}</td>
                  <td className="py-2 pr-6">{it.leverage}x</td>
                  <td className="py-2 pr-6">{it.status}</td>
                  <td className="py-2 pr-6">
                    {it.txHash ? (
                      <a className="text-primary underline" href={getTxUrl(it.txHash)} target={getTxUrl(it.txHash).startsWith('/trading/tx/') ? '_self' : '_blank'} rel="noopener noreferrer">
                        查看详情
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}