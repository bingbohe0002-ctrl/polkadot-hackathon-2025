import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useContract } from '../hooks/useContract';
import MessageItem from './MessageItem';
import '../styles/Channel.css';

function Channel({ channel, onClose, onOpenPrivateChat }) {
  const { address } = useAccount();
  const {
    sendChannelMessage,
    getLatestChannelMessages,
    getChannelSubscribers,
    getChannelInfo,
    subscribeToChannel,
    getUserProfile
  } = useContract();

  const [isSubscribing, setIsSubscribing] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [channelInfo, setChannelInfo] = useState(channel);
  const [isCreator, setIsCreator] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const loadMessages = async () => {
    try {
      const msgs = await getLatestChannelMessages(channel.channelId, 100);
      setMessages(msgs);
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscribers = async () => {
    try {
      const subscriberAddresses = await getChannelSubscribers(channel.channelId);
      setSubscribers(subscriberAddresses);

      // Check if current user is subscribed
      const userIsSubscribed = subscriberAddresses.some(
        sub => sub.toLowerCase() === address?.toLowerCase()
      );
      setIsSubscribed(userIsSubscribed);
    } catch (error) {
      console.error('Failed to load subscribers:', error);
    }
  };

  const loadChannelInfo = async () => {
    try {
      const info = await getChannelInfo(channel.channelId);
      setChannelInfo({ ...channel, ...info });
      setIsCreator(info.creator.toLowerCase() === address?.toLowerCase());
    } catch (error) {
      console.error('Failed to load channel info:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    loadSubscribers();
    loadChannelInfo();
  }, [channel.channelId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    if (!isCreator) {
      toast.error('Only the channel creator can send messages');
      return;
    }

    if (newMessage.length > 1000) {
      toast.error('Message is too long (max 1000 characters)');
      return;
    }

    setIsSending(true);

    try {
      await sendChannelMessage(channel.channelId, newMessage);
      setNewMessage('');

      setTimeout(() => {
        loadMessages();
        setTimeout(() => scrollToBottom('smooth'), 500);
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };



  const getInviteLink = () => {
    return `${window.location.origin}?subscribeChannel=${channel.channelId}`;
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    toast.success('Invite link copied to clipboard!');
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await subscribeToChannel(channel.channelId);
      toast.success('Successfully subscribed to the channel!');
      // Reload subscribers to update isSubscribed state
      await loadSubscribers();
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Failed to subscribe. You may already be subscribed.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="channel-overlay">
      <div className="channel-container">
        <div className="channel-header">
          <div className="channel-info">
            <h2>📢 {channel.name}</h2>
            <span className="subscriber-count">{subscribers.length} subscribers</span>
            {isCreator && <span className="creator-badge">Creator</span>}
          </div>
          <div className="channel-actions">
            <button
              className="action-btn"
              onClick={() => setShowSubscribers(!showSubscribers)}
            >
              👥 Subscribers
            </button>
            {isSubscribed && (
              <button
                className="action-btn"
                onClick={() => setShowInvite(!showInvite)}
              >
                ➕ Invite
              </button>
            )}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {showInvite && (
          <div className="invite-panel">
            <h3>Invite Subscribers</h3>
            <div className="invite-link-section">
              <p>Share this link with anyone to invite them to subscribe:</p>
              <div className="invite-link-box">
                <input
                  type="text"
                  value={getInviteLink()}
                  readOnly
                  className="invite-link-input"
                />
                <button onClick={copyInviteLink} className="copy-btn">
                  📋 Copy Link
                </button>
              </div>
            </div>
          </div>
        )}

        {showSubscribers && (
          <div className="subscribers-panel">
            <h3>Subscribers ({subscribers.length})</h3>
            <div className="subscribers-list">
              {subscribers.map((subscriberAddr, index) => (
                <SubscriberItem 
                  key={index} 
                  address={subscriberAddr}
                  getUserProfile={getUserProfile}
                  isCurrentUser={subscriberAddr.toLowerCase() === address?.toLowerCase()}
                  isCreator={subscriberAddr.toLowerCase() === channelInfo.creator?.toLowerCase()}
                />
              ))}
            </div>
          </div>
        )}

        <div className="channel-messages-wrapper">
          <div className="channel-messages" ref={chatContainerRef}>
            {isLoading ? (
              <div className="loading-messages">
                <div className="spinner"></div>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="no-messages">
                <span className="no-messages-icon">📢</span>
                <p>No broadcasts yet. {isCreator ? 'Start broadcasting!' : 'Stay tuned!'}</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <MessageItem
                    key={`${message.messageId}-${index}`}
                    message={message}
                    isOwnMessage={message.sender?.toLowerCase() === address?.toLowerCase()}
                    onUserClick={onOpenPrivateChat}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {isCreator ? (
            <form onSubmit={handleSendMessage} className="message-input-form">
              <div className="message-input-container">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Broadcast a message..."
                  className="message-input"
                  disabled={isSending}
                  rows={1}
                  maxLength={1000}
                />
                <div className="input-actions">
                  <span className="char-count">
                    {newMessage.length}/1000
                  </span>
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={isSending || !newMessage.trim()}
                  >
                    {isSending ? (
                      <span className="spinner small"></span>
                    ) : (
                      <span className="send-icon">📡</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : !isSubscribed ? (
            <div className="subscribe-prompt">
              <p>📢 Subscribe to this channel to receive updates</p>
              <button
                className="subscribe-btn"
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : '✅ Subscribe to Channel'}
              </button>
            </div>
          ) : (
            <div className="subscribe-prompt">
              <p>📢 Only the channel creator can broadcast messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriberItem({ address, getUserProfile, isCurrentUser, isCreator }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const prof = await getUserProfile(address);
        setProfile(prof);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, [address]);

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="subscriber-item">
      <div className="subscriber-avatar">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="avatar" />
        ) : (
          <div className="default-avatar">👤</div>
        )}
      </div>
      <div className="subscriber-info">
        <span className="subscriber-name">
          {profile?.username || formatAddress(address)}
        </span>
        {isCreator && <span className="creator-badge">Creator</span>}
        {isCurrentUser && <span className="you-badge">You</span>}
      </div>
    </div>
  );
}

export default Channel;

