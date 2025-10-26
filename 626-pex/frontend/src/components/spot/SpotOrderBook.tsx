'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useNetwork } from "wagmi";
import { getProvider, getSpotMarketContract } from "@/lib/utils/ethersHelpers";
import { useSpotOrderBookSubscription } from "@/hooks/contracts/useSpotOrderBookSubscription";
import { getTokenAddress } from "@/lib/contracts/addresses";

export function SpotOrderBook({ market }: { market: string }) {
  const { chain } = useNetwork();
  const chainId = useMemo(() => Number(chain?.id ?? (process.env.NEXT_PUBLIC_CHAIN_ID ?? 420420422)), [chain?.id]);
  const [marketId, setMarketId] = useState<bigint>(0n);
  const [error, setError] = useState<string | null>(null);
  const [baseSymbol, setBaseSymbol] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function resolveMarket() {
      setError(null);
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io');
        const sm = getSpotMarketContract(chainId, provider);
        const markets = await sm.getAllMarkets();

        const norm = (s: string) => s.replace(/\//g, '-').toUpperCase();
        const targetNorm = norm(market);
        const [base, quote] = targetNorm.split('-');
        const candidates = new Set<string>([targetNorm]);
        if (base === 'ETH') candidates.add(`WETH-${quote}`);
        if (quote === 'USD') { candidates.add(`${base}-USDC`); candidates.add(`${base}-USDT`); }

        const usdc = getTokenAddress(chainId, 'USDC')?.toLowerCase();
        const usdt = getTokenAddress(chainId, 'USDT')?.toLowerCase();
        const weth = getTokenAddress(chainId, 'WETH')?.toLowerCase();

        const found = (markets as any[]).find((m) => {
          const sym = String(m?.symbol ?? m?.[3] ?? '').toUpperCase().replace(/\//g, '-');
          if (candidates.has(sym)) return true;
          const baseAddr = String(m?.baseToken ?? m?.[1] ?? '').toLowerCase();
          const quoteAddr = String(m?.quoteToken ?? m?.[2] ?? '').toLowerCase();
          const baseMatch = base === 'ETH' ? (weth && baseAddr === weth) : undefined;
          const quoteMatch = quote === 'USDC' ? (usdc && quoteAddr === usdc) : quote === 'USDT' ? (usdt && quoteAddr === usdt) : undefined;
          return Boolean(baseMatch && quoteMatch);
        });

        if (!found) throw new Error("Market not found: " + market);
        if (mounted) {
          setMarketId(BigInt(found?.id ?? found?.[0]));
          const symRaw = String(found?.symbol ?? found?.[3] ?? market);
          const baseSym = symRaw.includes('/') ? symRaw.split('/')[0] : symRaw.split('-')[0];
          setBaseSymbol(baseSym || base || '');
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? String(e));
        if (mounted) setMarketId(0n);
        if (mounted) setBaseSymbol('');
      }
    }
    resolveMarket();
    return () => { mounted = false; };
  }, [market, chainId]);

  const { bids, asks, isLoading, error: bookError, bestAsk, bestBid, spread, spreadPercent } = useSpotOrderBookSubscription(marketId, chainId);

  // 价格/数量格式化
  const fmtPrice = (p: number) => p.toFixed(6);
  const fmtQty = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
  const fmtUsd = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 累计合计与深度条宽度
  const asksTotal = useMemo(() => asks.reduce((acc, a) => acc + a.size, 0), [asks]);
  const bidsTotal = useMemo(() => bids.reduce((acc, b) => acc + b.size, 0), [bids]);
  const asksTotalUSD = useMemo(() => asks.reduce((acc, a) => acc + (a.size * a.price), 0), [asks]);
  const bidsTotalUSD = useMemo(() => bids.reduce((acc, b) => acc + (b.size * b.price), 0), [bids]);

  const asksRows = useMemo(() => {
    const rev = [...asks].reverse(); // 经典样式：卖盘从高到低显示
    let accPrevUSD = 0;
    return rev.map((a) => {
      const rowUSD = a.size * a.price;
      const cumUSD = asksTotalUSD - accPrevUSD; // 顶部为总合计（USDC），越靠近价差越小
      accPrevUSD += rowUSD;
      const barWidth = asksTotalUSD ? (cumUSD / asksTotalUSD) * 100 : 0;
      return { price: a.price, size: a.size, total: rowUSD, cum: cumUSD, barWidth };
    });
  }, [asks, asksTotalUSD]);

  const bidsRows = useMemo(() => {
    let accUSD = 0; // 买盘从高到低显示，累计向下递增（USDC）
    return bids.map((b) => {
      const rowUSD = b.size * b.price;
      accUSD += rowUSD;
      const barWidth = bidsTotalUSD ? (accUSD / bidsTotalUSD) * 100 : 0;
      return { price: b.price, size: b.size, total: rowUSD, cum: accUSD, barWidth };
    });
  }, [bids, bidsTotalUSD]);

  return (
    <div className="rounded-md border border-gray-700 bg-[#0b0d10] text-sm overflow-hidden">
      {/* 表头 */}
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-gray-300">
        <div>价格 (USDC)</div>
        <div className="text-center">数量 ({baseSymbol || 'BASE'})</div>
        <div className="text-right">合计 (USDC)</div>
      </div>

      {/* 卖盘 */}
      <div className="space-y-1">
        {asksRows.map((row, idx) => (
          <div key={idx} className="relative grid grid-cols-3 px-3 py-1">
            <div className="absolute left-0 top-0 bottom-0 bg-red-900/30" style={{ width: `${row.barWidth}%` }} />
            <div className="relative z-10 text-red-400">{fmtPrice(row.price)}</div>
            <div className="relative z-10 text-center text-gray-200">{fmtQty(row.size)}</div>
            <div className="relative z-10 text-right text-gray-200">{fmtUsd(row.total)}</div>
          </div>
        ))}
        {!asksRows.length && !isLoading && (
          <div className="px-3 py-2 text-xs text-gray-400">暂无卖盘</div>
        )}
      </div>

      {/* 价差 */}
      <div className="grid grid-cols-3 px-3 py-2 my-1 text-xs text-gray-200 border-y border-gray-700">
        <div>价差</div>
        <div className="text-center">{bestAsk !== undefined && bestBid !== undefined ? (spread ?? (bestAsk - bestBid)).toFixed(6) : '-'}</div>
        <div className="text-right">{bestBid ? `${spreadPercent.toFixed(3)}%` : '-'}</div>
      </div>

      {/* 买盘 */}
      <div className="space-y-1">
        {bidsRows.map((row, idx) => (
          <div key={idx} className="relative grid grid-cols-3 px-3 py-1">
            <div className="absolute left-0 top-0 bottom-0 bg-green-900/25" style={{ width: `${row.barWidth}%` }} />
            <div className="relative z-10 text-green-400">{fmtPrice(row.price)}</div>
            <div className="relative z-10 text-center text-gray-200">{fmtQty(row.size)}</div>
            <div className="relative z-10 text-right text-gray-200">{fmtUsd(row.total)}</div>
          </div>
        ))}
        {!bidsRows.length && !isLoading && (
          <div className="px-3 py-2 text-xs text-gray-400">暂无买盘</div>
        )}
      </div>

      {/* 状态与错误 */}
      {(isLoading || error || bookError) && (
        <div className="px-3 py-2 text-xs text-gray-400">
          {isLoading && <span>订单簿加载中…</span>}
          {error && <span className="ml-2">市场解析错误: {error}</span>}
          {bookError && <span className="ml-2">订单簿错误: {bookError.message}</span>}
        </div>
      )}
    </div>
  );
}