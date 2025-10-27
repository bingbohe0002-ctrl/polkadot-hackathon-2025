'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20ABI } from '@/lib/contracts/abi';
import { getProvider, getSpotMarketContract } from '@/lib/utils/ethersHelpers';

interface SpotHoldingsPanelProps {
  market: string; // e.g., "ETH-USDC" or "PEX/USDC"
}

export function SpotHoldingsPanel({ market }: SpotHoldingsPanelProps) {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const chainId = useMemo(() => Number(chain?.id ?? (process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337)), [chain?.id]);

  const runningRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    marketId: bigint;
    baseToken: `0x${string}`;
    quoteToken: `0x${string}`;
    baseDecimals: number;
    quoteDecimals: number;
    baseIsNative: boolean;
    quoteIsNative: boolean;
  } | null>(null);

  const [balances, setBalances] = useState<{
    base: string; // formatted
    quote: string; // formatted
  }>({ base: '0', quote: '0' });

  // derive token symbols from market string like "PEX/USDC" or "ETH-USDC"
  const [baseSymbol, quoteSymbol] = useMemo(() => {
    if (!market) return ['Base', 'Quote'];
    const m = market.replace(/\s+/g, '');
    const parts = m.includes('/') ? m.split('/') : m.split('-');
    if (parts.length >= 2) {
      return [parts[0], parts[1]];
    }
    return ['Base', 'Quote'];
  }, [market]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (runningRef.current) return; // prevent overlapping polls
      runningRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const spotMarket = getSpotMarketContract(chainId, provider);
        const markets = await spotMarket.getAllMarkets();
        const found = markets.find((m: any) => String(m.symbol ?? m[1]) === market);
        if (!found) throw new Error(`未找到市场: ${market}`);
        const marketId = BigInt(found.id ?? found[0]);
        const baseToken = String(found.baseToken ?? found[2]) as `0x${string}`;
        const quoteToken = String(found.quoteToken ?? found[3]) as `0x${string}`;
        const baseDecimals = Number(found.baseDecimals ?? found[4]);
        const quoteDecimals = Number(found.quoteDecimals ?? found[5]);
        const baseIsNative = Boolean(found.baseIsNative ?? found[6]);
        const quoteIsNative = Boolean(found.quoteIsNative ?? found[7]);

        if (!mounted) return;
        setDetail({ marketId, baseToken, quoteToken, baseDecimals, quoteDecimals, baseIsNative, quoteIsNative });

        if (!address) {
          setBalances({ base: '0', quote: '0' });
          return;
        }

        // Fetch balances
        let baseRaw = 0n;
        let quoteRaw = 0n;
        if (baseIsNative) {
          baseRaw = await provider.getBalance(address);
        } else {
          const baseErc20 = new ethers.Contract(baseToken, ERC20ABI, provider);
          baseRaw = await baseErc20.balanceOf(address);
        }
        if (quoteIsNative) {
          quoteRaw = await provider.getBalance(address);
        } else {
          const quoteErc20 = new ethers.Contract(quoteToken, ERC20ABI, provider);
          quoteRaw = await quoteErc20.balanceOf(address);
        }

        const fmt = (raw: bigint, decimals: number) => {
          // format to string with up to 6 decimals
          const s = ethers.formatUnits(raw, decimals);
          const [i, f] = s.split('.');
          return f ? `${i}.${f.slice(0, 6)}` : i;
        };

        setBalances({ base: fmt(baseRaw, baseDecimals), quote: fmt(quoteRaw, quoteDecimals) });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || '加载失败');
        // 保留上次成功的余额，避免闪烁为 0
      } finally {
        runningRef.current = false;
        if (mounted) setLoading(false);
      }
    };

    run();
    const id = setInterval(run, 15_000); // refresh every 15s
    return () => { mounted = false; clearInterval(id); };
  }, [market, chainId, address]);

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">持有资产</h3>
        <div className="text-xs text-muted-foreground">{loading ? '加载中…' : ''}</div>
      </div>
      {error && (
        <div className="px-4 py-2 text-xs text-red-500">{error}</div>
      )}
      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">{baseSymbol}</div>
          <div className="text-lg font-medium">{balances.base}</div>
          <div className="text-xs text-muted-foreground">{detail ? detail.baseToken : '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">{quoteSymbol}</div>
          <div className="text-lg font-medium">{balances.quote}</div>
          <div className="text-xs text-muted-foreground">{detail ? detail.quoteToken : '-'}</div>
        </div>
      </div>
    </div>
  );
}