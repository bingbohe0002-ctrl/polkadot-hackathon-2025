import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Zap, Globe, TrendingUp, Code, GitBranch, Rocket } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
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
            <Link
              href="/trading"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative isolate">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            The Future of
            <br />
            Perpetual Trading
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience CEX-level spot and perpetual futures trading on PolkaVM with 
            complete on-chain transparency and lightning-fast execution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/trading"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 group"
            >
              Start Trading
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/docs"
              className="border border-border px-8 py-4 rounded-lg text-lg font-semibold hover:bg-muted/50 transition-colors"
            >
              Read Docs
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$0M</div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <div className="text-sm text-muted-foreground">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">100x</div>
              <div className="text-sm text-muted-foreground">Max Leverage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 relative isolate">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose PEX?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built on PolkaVM for unmatched performance, transparency, and user experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
            <p className="text-muted-foreground">
              PolkaVM's high-performance execution environment ensures sub-second order matching 
              and settlement with minimal gas costs.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Fully Transparent</h3>
            <p className="text-muted-foreground">
              All trades, positions, and liquidations happen on-chain. No hidden processes, 
              complete auditability, and trustless execution.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Professional Tools</h3>
            <p className="text-muted-foreground">
              Advanced charting, real-time orderbook, portfolio analytics, and risk management 
              tools for serious traders.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Cross-Chain Ready</h3>
            <p className="text-muted-foreground">
              Built on Polkadot ecosystem with future cross-chain compatibility for 
              multi-chain asset trading.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">High Leverage</h3>
            <p className="text-muted-foreground">
              Trade with up to 100x leverage on major crypto assets with sophisticated 
              risk management and liquidation protection.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">DAO Governed</h3>
            <p className="text-muted-foreground">
              Community-driven governance for protocol parameters, fee structures, 
              and platform evolution decisions.
            </p>
          </div>

          {/* New features */}
          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Open Source</h3>
            <p className="text-muted-foreground">
              Transparent codebase, community-driven contributions, and verifiable security.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <GitBranch className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Fully Decentralized</h3>
            <p className="text-muted-foreground">
              No central control — smart contracts enforce rules and governance.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Built for Builders</h3>
            <p className="text-muted-foreground">
              Designed to surface and amplify the value of true builders' projects — the go-to DEX for crypto value investing.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 relative isolate">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the next generation of decentralized perpetual trading. 
            No KYC required, just connect your wallet and start.
          </p>
          <Link
            href="/trading"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all duration-200 inline-flex items-center gap-2 group"
          >
            Launch Trading Interface
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 relative isolate">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">P</span>
                </div>
                <span className="text-xl font-bold">PEX</span>
              </div>
              <p className="text-muted-foreground">
                The professional perpetual futures trading platform built on PolkaVM.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/trading" className="hover:text-foreground transition-colors">Perpetual</Link></li>
                <li><Link href="/trading/history" className="hover:text-foreground transition-colors">History</Link></li>
                <li><Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link></li>
                <li><Link href="/analytics" className="hover:text-foreground transition-colors">Analytics</Link></li>
                <li><Link href="/governance" className="hover:text-foreground transition-colors">Governance</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-foreground transition-colors">API</Link></li>
                <li><Link href="/security" className="hover:text-foreground transition-colors">Security</Link></li>
                <li><Link href="/support" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 PEX Protocol. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}