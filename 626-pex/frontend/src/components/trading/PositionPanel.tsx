'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { formatUnits } from 'viem';
import toast from 'react-hot-toast';
import { getProvider, getPerpMarketContract, getOrderBookContract } from '@/lib/utils/ethersHelpers';
import { ethers } from 'ethers';
import { useUserPositions, useUserPositionsSubscription } from '@/hooks/contracts/usePerpMarket';

interface Position {
  market: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
  liquidationPrice: number;
}

export function PositionPanel() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const chainId = chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
  const { positions: rawPositions, isLoading, refetch } = useUserPositions(chainId, address);
  // Subscribe to position events to auto-refresh
  useUserPositionsSubscription(chainId, address);

  const [closingIndex, setClosingIndex] = useState<number | null>(null);

  // 初始与连接变化时拉取仓位
  useEffect(() => {
    if (address) {
      refetch();
    }
  }, [address, chainId, refetch]);

  const positions: Position[] = useMemo(() => {
    if (!rawPositions || rawPositions.length === 0) return [];
    return rawPositions.map((p) => {
      const sideMap: Record<typeof p.side, Position['side']> = { LONG: 'long', SHORT: 'short' };
      const size = Number(formatUnits(p.size, 18));
      const entryPrice = Number(formatUnits(p.entryPrice, 18));
      const markPrice = Number(formatUnits(p.markPrice, 18));
      const margin = Number(formatUnits(p.margin, 18));
      const pnl = Number(formatUnits(p.unrealizedPnl, 18));
      const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;
      const liquidationPrice = Number(formatUnits(p.liquidationPrice, 18));
      return {
        market: p.market,
        side: sideMap[p.side],
        size,
        entryPrice,
        markPrice,
        pnl,
        pnlPercent,
        margin,
        liquidationPrice,
      };
    });
  }, [rawPositions]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-muted-foreground">正在加载仓位数据...</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔌</div>
        <p className="text-muted-foreground">请先连接钱包以查看仓位</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-muted-foreground">No open positions</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your positions will appear here once you open them
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Market</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Side</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Entry Price</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Mark Price</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">PnL</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Margin</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Liq. Price</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => (
            <tr key={index} className="border-b border-border hover:bg-muted/30">
              <td className="py-3 px-4">
                <span className="font-medium">{position.market}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    position.side === 'long'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {position.side.toUpperCase()}
                </span>
              </td>
              <td className="py-3 px-4 text-right">{position.size}</td>
              <td className="py-3 px-4 text-right">${position.entryPrice.toLocaleString()}</td>
              <td className="py-3 px-4 text-right">${position.markPrice.toLocaleString()}</td>
              <td className="py-3 px-4 text-right">
                <div className={position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                  <div>${position.pnl.toFixed(2)}</div>
                  <div className="text-xs">({position.pnlPercent.toFixed(2)}%)</div>
                </div>
              </td>
              <td className="py-3 px-4 text-right">${position.margin.toFixed(2)}</td>
              <td className="py-3 px-4 text-right">${position.liquidationPrice.toLocaleString()}</td>
              <td className="py-3 px-4 text-right">
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-60"
                    disabled={closingIndex === index}
                    onClick={async () => {
                      if (!address) {
                        toast.error('请先连接钱包');
                        return;
                      }
                      setClosingIndex(index);
                      try {
                        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
                        const pmRead = getPerpMarketContract(chainId, provider);
                        const markets = await pmRead.getAllMarkets();
                        const target = (markets as any[]).find((m) => (m?.symbol ?? m?.[1]) === position.market);
                        if (!target) {
                          toast.error('未能解析市场 ID，无法平仓');
                          return;
                        }
                        const marketId = BigInt(target?.id ?? target?.[0]);

                        // Get best bid/ask for acceptablePrice
                        const ob = getOrderBookContract(chainId, provider);
                        let acceptablePrice = BigInt(Math.floor(position.markPrice));
                        try {
                          const book = await ob.getOrderBook(marketId, 1n);
                          const bestBid = (book?.bids?.[0]?.price ?? book?.[0]?.[0]?.price) as bigint | undefined;
                          const bestAsk = (book?.asks?.[0]?.price ?? book?.[1]?.[0]?.price) as bigint | undefined;
                          if (bestBid && bestAsk) {
                            acceptablePrice = BigInt(Math.floor((Number(bestBid) + Number(bestAsk)) / 2));
                          } else if (bestBid || bestAsk) {
                            acceptablePrice = BigInt(bestBid ?? bestAsk ?? acceptablePrice);
                          }
                        } catch (_) {
                          // keep default acceptablePrice
                        }

                        // Acquire signer from injected wallet
                        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
                        const signer = await browserProvider.getSigner();
                        const pm = getPerpMarketContract(chainId, signer);

                        // Fetch all positionIds and close those matching market & side
                        const ids: bigint[] = await pm.getPositionsByTrader(address);
                        const toClose: Array<{ id: bigint; size: bigint }> = [];
                        for (const id of ids) {
                          try {
                            const p = await pm.getPosition(id);
                            const pMarketId: bigint = BigInt(p?.marketId ?? p?.[1]);
                            const pSideNum: number = Number(p?.side ?? p?.[2]);
                            const pSide: 'long' | 'short' = pSideNum === 0 ? 'long' : 'short';
                            const pSize: bigint = BigInt(p?.size ?? p?.[3] ?? 0);
                            if (pMarketId === marketId && pSide === position.side && pSize > 0n) {
                              toClose.push({ id, size: pSize });
                            }
                          } catch (_) {
                            // ignore decode/read errors
                          }
                        }

                        if (toClose.length === 0) {
                          toast.error('未找到可平仓的持仓记录');
                          return;
                        }

                        toast.loading('正在提交平仓交易...', { id: 'closing' });
                        for (const item of toClose) {
                          const tx = await pm.closePosition(item.id, item.size, acceptablePrice);
                          await tx.wait();
                        }
                        toast.success('平仓完成');
                        await refetch();
                      } catch (e: any) {
                        console.error('Close failed', e);
                        toast.error(e?.message || '平仓失败，请稍后重试');
                      } finally {
                        setClosingIndex(null);
                        toast.dismiss('closing');
                      }
                    }}
                  >
                    {closingIndex === index ? 'Closing…' : 'Close'}
                  </button>
                  <button className="px-3 py-1 text-xs border border-border rounded hover:bg-muted">
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}