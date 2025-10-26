'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TradingChart } from '@/components/trading/TradingChart';
import { OrderBook } from '@/components/trading/OrderBook';
import { OrderForm } from '@/components/trading/OrderForm';
import { PositionPanel } from '@/components/trading/PositionPanel';
import { OrderHistory } from '@/components/trading/OrderHistory';
import { MarketSelector } from '@/components/trading/MarketSelector';
import { TradingStats } from '@/components/trading/TradingStats';
// 移除 EVM 连接按钮
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork } from 'wagmi';
import toast from 'react-hot-toast';
import { getContractAddresses, getTokenAddress } from '@/lib/contracts/addresses';
import { getERC20Contract, getMarginVaultContract } from '@/lib/utils/ethersHelpers';
import { ethers } from 'ethers';

export default function TradingPage() {
  const [selectedMarket, setSelectedMarket] = useState('BTC-USD');
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const { address } = useAccount();
  const { chain } = useNetwork();
  const chainId = chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  // 刷新 OrderForm 可用余额的标记
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeposit = async () => {
    try {
      if (!address || !chain) {
        toast.error('请连接钱包并选择网络');
        return;
      }
      const tokenAddress = getTokenAddress(chainId, 'USDC');
      const { marginVault } = getContractAddresses(chainId);
      const zero = '0x0000000000000000000000000000000000000000';
      if (!marginVault || marginVault.toLowerCase() === zero) {
        toast.error('MarginVault地址未配置');
        return;
      }
      const amountStr = depositAmount.trim();
      if (!amountStr || Number(amountStr) <= 0) {
        toast.error('请输入有效的存入金额');
        return;
      }
      const amount = ethers.parseUnits(amountStr, 6);

      const extProvider = (typeof window !== 'undefined' ? (window as any).ethereum : undefined);
      if (!extProvider) {
        toast.error('未检测到钱包，请安装或解锁钱包');
        return;
      }
      setDepositLoading(true);

      const browserProvider = new ethers.BrowserProvider(extProvider);
      const signer = await browserProvider.getSigner();

      const usdc = getERC20Contract(tokenAddress, signer);
      const vault = getMarginVaultContract(chainId, signer);

      const approveTx = await usdc.approve(await vault.getAddress(), amount);
      await approveTx.wait();

      const depositTx = await vault.deposit(tokenAddress, amount);
      await depositTx.wait();

      toast.success('存入成功');
      setShowDepositModal(false);
      setDepositAmount('');
      // 存入成功后刷新 OrderForm 的可用余额
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || '存入失败');
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navigation */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50 isolate">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold">PEX</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/trading" className="text-muted-foreground hover:text-foreground transition-colors">
              Perpetual
            </Link>
            <Link href="/spot" className="text-muted-foreground hover:text-foreground transition-colors">
              Spot
            </Link>
            <Link href="/trading/history" className="text-muted-foreground hover:text-foreground transition-colors">
              History
            </Link>
            <Link href="/governance" className="text-muted-foreground hover:text-foreground transition-colors">
              Governance
            </Link>
            <Link href="/faucet" className="text-muted-foreground hover:text-foreground transition-colors">
              Faucet
            </Link>
          </nav>
  
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="px-3 py-2 rounded-md border hover:bg-muted"
              onClick={() => setShowDepositModal(true)}
            >
              Deposit
            </button>
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
          </div>
        </div>
      </header>

      {/* Trading Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <MarketSelector 
              selectedMarket={selectedMarket}
              onMarketChange={setSelectedMarket}
            />
            <div className="flex items-center space-x-4">
              <TradingStats market={selectedMarket} />
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-[360px] p-4">
            <div className="text-lg font-medium mb-2">存入 USDC 到保证金账户</div>
            <div className="text-sm text-muted-foreground mb-3">请输入要存入的 USDC 数量（6位小数）</div>
            <input
              type="number"
              inputMode="decimal"
              step="0.000001"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full rounded border px-3 py-2 mb-4 bg-input"
              placeholder="例如：1000"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-3 py-2 rounded border hover:bg-muted"
                onClick={() => setShowDepositModal(false)}
                disabled={depositLoading}
              >
                取消
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
                onClick={handleDeposit}
                disabled={depositLoading}
              >
                {depositLoading ? '处理中…' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Trading Interface */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Left Panel - Chart */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="bg-card border border-border rounded-lg h-full">
              <TradingChart market={selectedMarket} />
            </div>
          </div>

          {/* Right Panel - OrderBook & Order Form */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
            {/* Order Form */}
            <div className="bg-card border border-border rounded-lg">
              <OrderForm market={selectedMarket} refreshKey={refreshKey} />
            </div>

            {/* OrderBook */}
            <div className="bg-card border border-border rounded-lg flex-1">
              <OrderBook market={selectedMarket} />
            </div>
          </div>

          {/* Bottom Panel - Positions, Orders, History */}
          <div className="col-span-12">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('positions')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'positions'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Positions
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'orders'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Open Orders
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'history'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Order History
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 min-h-[260px] max-h-[40vh] overflow-y-auto">
                {activeTab === 'positions' && <PositionPanel />}
                {activeTab === 'orders' && <OrderHistory type="open" />}
                {activeTab === 'history' && <OrderHistory type="history" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}