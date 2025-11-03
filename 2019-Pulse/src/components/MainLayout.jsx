import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import toast from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import Registration from './Registration';
import ChatRoom from './ChatRoom';
import PrivateChat from './PrivateChat';
import GroupList from './GroupList';
import GroupChat from './GroupChat';
import ChannelList from './ChannelList';
import Channel from './Channel';
import InviteAccept from './InviteAccept';
import Discover from './Discover';
import { useContract } from '../hooks/useContract';
import '../styles/MainLayout.css';

function MainLayout() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { checkUserRegistered, joinGroup, subscribeToChannel } = useContract();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [privateChatUser, setPrivateChatUser] = useState(null);
  const [showGroupList, setShowGroupList] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showChannelList, setShowChannelList] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showDiscover, setShowDiscover] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null); // { type: 'group'|'channel', id: string, name: string }

  // Check registration when wallet connects
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

  // Check for invite links in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('joinGroup');
    const channelId = urlParams.get('subscribeChannel');

    if (groupId) {
      setPendingInvite({ type: 'group', id: groupId, name: null });
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (channelId) {
      setPendingInvite({ type: 'channel', id: channelId, name: null });
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleRegistrationComplete = () => {
    setIsRegistered(true);
  };

  const handleOpenPrivateChat = (user) => {
    setPrivateChatUser(user);
  };

  const handleClosePrivateChat = () => {
    setPrivateChatUser(null);
  };

  const handleOpenGroupList = () => {
    setShowGroupList(true);
  };

  const handleCloseGroupList = () => {
    setShowGroupList(false);
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupList(false);
  };

  const handleCloseGroupChat = () => {
    setSelectedGroup(null);
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;

    try {
      if (pendingInvite.type === 'group') {
        await joinGroup(pendingInvite.id);
        toast.success('Successfully joined the group!');
        setPendingInvite(null);
        setShowGroupList(true);
      } else if (pendingInvite.type === 'channel') {
        await subscribeToChannel(pendingInvite.id);
        toast.success('Successfully subscribed to the channel!');
        setPendingInvite(null);
        setShowChannelList(true);
      }
    } catch (error) {
      console.error('Failed to accept invite:', error);
      toast.error(`Failed to ${pendingInvite.type === 'group' ? 'join group' : 'subscribe to channel'}. You may already be a member or it does not exist.`);
      setPendingInvite(null);
    }
  };

  const handleCancelInvite = () => {
    setPendingInvite(null);
  };

  const handleOpenDiscover = () => {
    setShowDiscover(true);
  };

  const handleCloseDiscover = () => {
    setShowDiscover(false);
  };

  const handleOpenChannelList = () => {
    setShowChannelList(true);
  };

  const handleCloseChannelList = () => {
    setShowChannelList(false);
  };

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    setShowChannelList(false);
  };

  const handleCloseChannel = () => {
    setSelectedChannel(null);
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
            <ChatRoom
              onOpenPrivateChat={handleOpenPrivateChat}
              onOpenGroupList={handleOpenGroupList}
              onOpenChannelList={handleOpenChannelList}
              onOpenDiscover={handleOpenDiscover}
            />
            {privateChatUser && (
              <PrivateChat
                user={privateChatUser}
                onClose={handleClosePrivateChat}
              />
            )}
            {showGroupList && (
              <GroupList
                onSelectGroup={handleSelectGroup}
                onClose={handleCloseGroupList}
              />
            )}
            {selectedGroup && (
              <GroupChat
                group={selectedGroup}
                onClose={handleCloseGroupChat}
                onOpenPrivateChat={handleOpenPrivateChat}
              />
            )}
            {showChannelList && (
              <ChannelList
                onSelectChannel={handleSelectChannel}
                onClose={handleCloseChannelList}
              />
            )}
            {selectedChannel && (
              <Channel
                channel={selectedChannel}
                onClose={handleCloseChannel}
                onOpenPrivateChat={handleOpenPrivateChat}
              />
            )}
            {showDiscover && (
              <Discover
                onClose={handleCloseDiscover}
                onSelectGroup={handleSelectGroup}
                onSelectChannel={handleSelectChannel}
              />
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Invite Accept Modal */}
      {pendingInvite && (
        <InviteAccept
          type={pendingInvite.type}
          id={pendingInvite.id}
          name={pendingInvite.name}
          onAccept={handleAcceptInvite}
          onCancel={handleCancelInvite}
        />
      )}
    </div>
  );
}

export default MainLayout;

