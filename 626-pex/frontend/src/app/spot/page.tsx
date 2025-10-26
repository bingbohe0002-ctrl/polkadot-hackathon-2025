'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SpotMarketSelector } from '@/components/spot/SpotMarketSelector';
import { SpotOrderBook } from '@/components/spot/SpotOrderBook';
import { SpotOrderForm } from '@/components/spot/SpotOrderForm';
import { SpotHoldingsPanel } from '@/components/spot/SpotHoldingsPanel';
import { SpotOpenOrders } from '@/components/spot/SpotOpenOrders';
import { SpotTradeHistory } from '@/components/spot/SpotTradeHistory';

export default function SpotTradingPage() {
  const [selectedMarket, setSelectedMarket] = useState('PAS/USDC');
  const [activeTab, setActiveTab] = useState<'holdings' | 'orders' | 'history'>('holdings');

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
  
          <div className="flex items-center space-x-4">
             <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
           </div>
        </div>
      </header>

      {/* Trading Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <SpotMarketSelector selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Order Book */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-7">
            <div className="bg-card border border-border rounded-lg h-full">
              <SpotOrderBook market={selectedMarket} />
            </div>
          </div>

          {/* Right: Order Form */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-5">
            <div className="bg-card border border-border rounded-lg">
              <SpotOrderForm market={selectedMarket} />
            </div>
          </div>
        </div>

        {/* Bottom Panel - Holdings, Orders, History */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab('holdings')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'holdings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                持有资产
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                挂单列表
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                成交历史
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'holdings' && (
              <SpotHoldingsPanel market={selectedMarket} />
            )}
            {activeTab === 'orders' && (
              <SpotOpenOrders />
            )}
            {activeTab === 'history' && (
              <SpotTradeHistory />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}