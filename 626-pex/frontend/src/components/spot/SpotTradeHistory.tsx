'use client';

import { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { useSpotUserTrades } from '@/hooks/contracts/useSpotUserTrades';
import { formatEther } from 'viem';
import { CHAIN_CONFIGS, DEFAULT_CHAIN_ID } from '@/lib/contracts/addresses';

export function SpotTradeHistory() {
  const { chain } = useNetwork();
  // 默认回落到平台默认链，避免地址与 RPC 不一致
  const chainId = useMemo(() => Number(chain?.id ?? (process.env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_CHAIN_ID)), [chain?.id]);
  const { trades, isLoading } = useSpotUserTrades(chainId);

  const fmt = (bn: bigint) => {
    const s = formatEther(bn);
    const [i, f] = s.split('.');
    return f ? `${i}.${f.slice(0, 6)}` : i;
  };

  const fmtTs = (bn: bigint) => {
    try {
      const d = new Date(Number(bn) * 1000);
      return d.toLocaleString();
    } catch { return String(bn); }
  };

  const getTxUrl = (hash?: string) => {
    if (!hash) return '';
    const explorer = (chain?.blockExplorers as any)?.default?.url || CHAIN_CONFIGS[chainId]?.blockExplorer || '';
    if (explorer) return `${explorer.replace(/\/$/, '')}/tx/${hash}`;
    // fallback to internal tx detail page
    return `/trading/tx/${hash}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">成交历史</h3>
        <div className="text-xs text-muted-foreground">{isLoading ? '加载中…' : ''}</div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="py-2 px-4 text-left">订单ID</th>
            <th className="py-2 px-4 text-left">市场</th>
            <th className="py-2 px-4 text-right">成交数量</th>
            <th className="py-2 px-4 text-right">成交价格</th>
            <th className="py-2 px-4 text-right">时间</th>
            <th className="py-2 px-4 text-right">交易</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(tr => (
            <tr key={`${tr.orderId}-${tr.timestamp.toString()}`} className="border-b border-border">
              <td className="py-2 px-4">{tr.orderId}</td>
              <td className="py-2 px-4">{tr.market}</td>
              <td className="py-2 px-4 text-right">{fmt(tr.filledSize)}</td>
              <td className="py-2 px-4 text-right">{fmt(tr.fillPrice)}</td>
              <td className="py-2 px-4 text-right">{fmtTs(tr.timestamp)}</td>
              <td className="py-2 px-4 text-right">
                {tr.txHash ? (
                  <a
                    href={getTxUrl(tr.txHash)}
                    target={getTxUrl(tr.txHash).startsWith('/trading/tx/') ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 border border-border rounded hover:bg-muted text-xs"
                  >
                    查看交易
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          ))}
          {trades.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">暂无成交记录</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}