import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <span className="footer-logo">💓</span>
          <span className="footer-title">Pulse</span>
          <span className="footer-tagline">Decentralized Chat on Polkadot Hub</span>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4 className="footer-section-title">Author</h4>
            <a 
              href="https://x.com/annitoBtc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-icon">🐦</span>
              Twitter @annitoBtc
            </a>
            <a 
              href="https://github.com/cc1104666/Pulse" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-icon">💻</span>
              GitHub Repository
            </a>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Resources</h4>
            <a 
              href="https://faucet.polkadot.io/?parachain=1111" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-icon">💧</span>
              Get Test Tokens
            </a>
            <a 
              href="https://docs.polkadot.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-icon">📚</span>
              Polkadot Docs
            </a>
            <a 
              href="https://blockscout-passet-hub.parity-testnet.parity.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-icon">🔍</span>
              Block Explorer
            </a>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Network</h4>
            <div className="footer-network-info">
              <p className="network-name">
                <span className="network-dot"></span>
                Polkadot Hub TestNet
              </p>
              <p className="network-detail">Chain ID: 420420422</p>
              <p className="network-detail">Currency: PAS</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2025 Pulse Chat. Built with ❤️ on Polkadot Hub
          </p>
          <p className="footer-disclaimer">
            ⚠️ Beta - PolkaVM smart contracts are in early-stage development
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

