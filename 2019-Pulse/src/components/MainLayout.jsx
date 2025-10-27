import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Header from './Header';
import Footer from './Footer';
import Registration from './Registration';
import ChatRoom from './ChatRoom';
import PrivateChat from './PrivateChat';
import { useContract } from '../hooks/useContract';
import '../styles/MainLayout.css';

function MainLayout() {
  const { address, isConnected } = useAccount();
  const { checkUserRegistered } = useContract();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [privateChatUser, setPrivateChatUser] = useState(null);

  useEffect(() => {
    const checkRegistration = async () => {
      if (isConnected && address) {
        setIsCheckingRegistration(true);
        const registered = await checkUserRegistered(address);
        setIsRegistered(registered);
        setIsCheckingRegistration(false);
      } else {
        setIsRegistered(false);
        setIsCheckingRegistration(false);
      }
    };

    checkRegistration();
  }, [address, isConnected]);

  const handleRegistrationComplete = () => {
    setIsRegistered(true);
  };

  const handleOpenPrivateChat = (user) => {
    setPrivateChatUser(user);
  };

  const handleClosePrivateChat = () => {
    setPrivateChatUser(null);
  };

  return (
    <div className="main-layout">
      <Header />
      
      <main className="main-content-wrapper">
        {!isConnected ? (
          <div className="welcome-screen">
            <div className="welcome-card">
              <h1 className="welcome-title">
                Welcome to <span className="gradient-text">Pulse</span>
              </h1>
              <p className="welcome-subtitle">
                The Decentralized Chat Room on Polkadot Hub
              </p>
              <div className="welcome-features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <h3>Fully On-Chain</h3>
                  <p>All messages stored permanently on the blockchain</p>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📜</span>
                  <h3>Complete History</h3>
                  <p>Never miss a message - access full chat history anytime</p>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <h3>Decentralized</h3>
                  <p>No central server - powered by Polkadot Hub</p>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💬</span>
                  <h3>Private Chats</h3>
                  <p>Off-chain private messaging with other users</p>
                </div>
              </div>
              <p className="connect-prompt">
                Connect your wallet to get started
              </p>
            </div>
          </div>
        ) : isCheckingRegistration ? (
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>Checking registration status...</p>
          </div>
        ) : !isRegistered ? (
          <Registration onComplete={handleRegistrationComplete} />
        ) : (
          <>
            <ChatRoom onOpenPrivateChat={handleOpenPrivateChat} />
            {privateChatUser && (
              <PrivateChat
                user={privateChatUser}
                onClose={handleClosePrivateChat}
              />
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default MainLayout;

