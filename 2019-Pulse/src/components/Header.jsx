import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import '../styles/Header.css';

function Header() {
  const { isConnected } = useAccount();

  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo">
          <span className="logo-icon">💓</span>
          <span className="logo-text">Pulse</span>
          <span className="beta-badge">BETA</span>
        </div>
        
        <nav className="nav">
          {isConnected && (
            <div className="nav-stats">
              <span className="network-indicator">
                <span className="network-dot"></span>
                Polkadot Hub TestNet
              </span>
            </div>
          )}
          <ConnectButton 
            chainStatus="icon"
            showBalance={false}
          />
        </nav>
      </div>
    </header>
  );
}

export default Header;

