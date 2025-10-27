'use client';

import { useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [loadingToken, setLoadingToken] = useState<'USDC' | 'USDT' | 'BTC' | null>(null);

  const claimUsdc = async () => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包');
      return;
    }
    setLoadingToken('USDC');
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, token: 'USDC' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.usdcError || '领取 USDC 失败');
      }
      if (data.usdcTxHash) {
        toast.success(`USDC 发放成功：${data.usdcAmount} (tx: ${String(data.usdcTxHash).slice(0, 10)}...)`);
        const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (eth) {
          try {
            const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as string;
            await eth.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: { address: usdcAddress, symbol: 'USDC', decimals: 6 },
              },
            });
          } catch (_) {}
        }
      } else if (data.usdcError) {
        toast.error(`USDC 发放失败：${data.usdcError}`);
      } else {
        toast.error('USDC 发放失败：未知错误');
      }
    } catch (e: any) {
      toast.error(e?.message || '领取 USDC 失败');
    } finally {
      setLoadingToken(null);
    }
  };

  // 新增：领取 USDT
  const claimUsdt = async () => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包');
      return;
    }
    setLoadingToken('USDT');
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, token: 'USDT' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.usdtError || '领取 USDT 失败');
      }
      if (data.usdtTxHash) {
        toast.success(`USDT 发放成功：${data.usdtAmount} (tx: ${String(data.usdtTxHash).slice(0, 10)}...)`);
        const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (eth) {
          try {
            const usdtAddress = (process.env.NEXT_PUBLIC_USDT_ADDRESS as string) || '0xF709b6038335E303eA7597bc19887E29508F3be8';
            await eth.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: { address: usdtAddress, symbol: 'USDT', decimals: 6 },
              },
            });
          } catch (_) {}
        }
      } else if (data.usdtError) {
        toast.error(`USDT 发放失败：${data.usdtError}`);
      } else {
        toast.error('USDT 发放失败：未知错误');
      }
    } catch (e: any) {
      toast.error(e?.message || '领取 USDT 失败');
    } finally {
      setLoadingToken(null);
    }
  };

  const claimBtc = async () => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包');
      return;
    }
    setLoadingToken('BTC');
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, token: 'BTC' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.btcError || '领取 BTC 失败');
      }
      if (data.btcTxHash) {
        toast.success(`BTC 发放成功：${data.btcAmount} (tx: ${String(data.btcTxHash).slice(0, 10)}...)`);
        const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (eth) {
          try {
            const btcAddress = process.env.NEXT_PUBLIC_BTC_ADDRESS as string;
            await eth.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: { address: btcAddress, symbol: 'BTC', decimals: 8 },
              },
            });
          } catch (_) {}
        }
      } else if (data.btcError) {
        toast.error(`BTC 发放失败：${data.btcError}`);
      } else {
        toast.error('BTC 发放失败：未知错误');
      }
    } catch (e: any) {
      toast.error(e?.message || '领取 BTC 失败');
    } finally {
      setLoadingToken(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">测试水龙头</h1>
        <ConnectButton />
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <p className="mb-2 text-sm text-gray-600">
          当前网络：{chain?.name ?? '未连接'}（{chain?.id ?? '-'}）
        </p>
        <p className="mb-4 text-sm text-gray-600">
          可分别领取 100000 USDC、100000 USDT 或 5 BTC（测试资产），不发放原生 PAS。
        </p>
        <div className="flex gap-3">
          <button
            onClick={claimUsdc}
            disabled={!!loadingToken}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingToken === 'USDC' ? '领取 USDC 中...' : '领取 100000 USDC'}
          </button>
          <button
            onClick={claimUsdt}
            disabled={!!loadingToken}
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingToken === 'USDT' ? '领取 USDT 中...' : '领取 100000 USDT'}
          </button>
          <button
            onClick={claimBtc}
            disabled={!!loadingToken}
            className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loadingToken === 'BTC' ? '领取 BTC 中...' : '领取 5 BTC'}
          </button>
        </div>
      </div>
    </div>
  );
}