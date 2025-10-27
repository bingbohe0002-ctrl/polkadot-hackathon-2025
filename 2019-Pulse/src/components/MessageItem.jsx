import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import '../styles/MessageItem.css';

function MessageItem({ message, isOwnMessage, onUserClick }) {
  const { getUserProfile } = useContract();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [message.sender]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile(message.sender);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleUserClick = () => {
    if (!isOwnMessage && userProfile) {
      onUserClick({
        address: message.sender,
        username: userProfile.username,
        avatarUrl: userProfile.avatarUrl,
        signature: userProfile.signature
      });
    }
  };

  return (
    <div className={`message-item ${isOwnMessage ? 'own-message' : ''}`}>
      <div 
        className="message-avatar"
        onClick={handleUserClick}
        style={{ cursor: isOwnMessage ? 'default' : 'pointer' }}
      >
        {userProfile?.avatarUrl ? (
          <img src={userProfile.avatarUrl} alt={userProfile.username} />
        ) : (
          <div className="avatar-placeholder">
            {userProfile?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      <div className="message-content-wrapper">
        <div className="message-header">
          <span 
            className="message-username"
            onClick={handleUserClick}
            style={{ cursor: isOwnMessage ? 'default' : 'pointer' }}
          >
            {isLoadingProfile ? (
              'Loading...'
            ) : (
              userProfile?.username || formatAddress(message.sender)
            )}
          </span>
          {isOwnMessage && (
            <span className="you-badge">You</span>
          )}
          <span className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        <div className="message-content">
          {message.content}
        </div>

        {userProfile?.signature && !isOwnMessage && (
          <div className="message-signature">
            "{userProfile.signature}"
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageItem;

