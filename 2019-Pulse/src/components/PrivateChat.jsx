import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useContract } from '../hooks/useContract';
import '../styles/PrivateChat.css';

function PrivateChat({ user, onClose }) {
  const { address } = useAccount();
  const {
    addFriend,
    removeFriend,
    checkFriendship,
    sendPrivateMessage,
    getConversationMessages
  } = useContract();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFriend, setIsFriend] = useState(false);
  const [isCheckingFriendship, setIsCheckingFriendship] = useState(true);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load private messages from blockchain
    loadMessages();
    // Check friendship status
    checkFriendshipStatus();
  }, [user.address]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkFriendshipStatus = async () => {
    setIsCheckingFriendship(true);
    try {
      const areFriends = await checkFriendship(address, user.address);
      setIsFriend(areFriends);
    } catch (error) {
      console.error('Failed to check friendship:', error);
    } finally {
      setIsCheckingFriendship(false);
    }
  };

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      console.log('Loading messages for conversation with:', user.address);
      const msgs = await getConversationMessages(user.address, 100);
      console.log('Loaded messages:', msgs);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (newMessage.length > 2000) {
      toast.error('Message is too long (max 2000 characters)');
      return;
    }

    setIsSending(true);
    try {
      console.log('Sending private message to:', user.address);
      await sendPrivateMessage(user.address, newMessage);
      toast.success('Message sent!');
      setNewMessage('');

      // Wait a bit for the blockchain to confirm the transaction
      console.log('Waiting for blockchain confirmation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reload messages to show the new one
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
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

  const handleAddFriend = async () => {
    setIsAddingFriend(true);
    try {
      await addFriend(user.address);
      setIsFriend(true);
      toast.success('Friend added successfully!');
    } catch (error) {
      console.error('Failed to add friend:', error);
      toast.error('Failed to add friend. You may already be friends.');
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleRemoveFriend = async () => {
    const confirmed = window.confirm('Are you sure you want to remove this friend?');
    if (!confirmed) return;

    setIsAddingFriend(true);
    try {
      await removeFriend(user.address);
      setIsFriend(false);
      toast.success('Friend removed successfully!');
    } catch (error) {
      console.error('Failed to remove friend:', error);
      toast.error('Failed to remove friend.');
    } finally {
      setIsAddingFriend(false);
    }
  };

  return (
    <div className="private-chat-overlay">
      <div className="private-chat-modal">
        <div className="private-chat-header">
          <div className="private-chat-user-info">
            <div className="private-chat-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} />
              ) : (
                <div className="avatar-placeholder">
                  {user.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <h3 className="private-chat-username">{user.username}</h3>
              <p className="private-chat-note">
                🔒 Private chat (stored on-chain)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="friend-action-bar">
          {isCheckingFriendship ? (
            <div className="checking-friendship">Checking friendship...</div>
          ) : isFriend ? (
            <div className="friend-status">
              <span className="friend-badge">✓ Friends</span>
              <button
                onClick={handleRemoveFriend}
                className="remove-friend-btn"
                disabled={isAddingFriend}
              >
                {isAddingFriend ? 'Removing...' : 'Remove Friend'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddFriend}
              className="add-friend-btn"
              disabled={isAddingFriend}
            >
              {isAddingFriend ? 'Adding...' : '➕ Add Friend'}
            </button>
          )}
        </div>

        <div className="private-chat-messages">
          {isLoadingMessages ? (
            <div className="loading-messages">
              <div className="spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-private-messages">
              <span className="icon">💬</span>
              <p>Start a private conversation with {user.username}</p>
              <span className="hint">Messages are stored on-chain</span>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwnMessage = message.sender.toLowerCase() === address.toLowerCase();
                return (
                  <div
                    key={message.messageId}
                    className={`private-message ${isOwnMessage ? 'own' : 'other'}`}
                  >
                    <div className="private-message-content">
                      {message.content}
                    </div>
                    <div className="private-message-time">
                      {formatTimestamp(message.timestamp * 1000)}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="private-chat-input-form">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your private message..."
            className="private-chat-input"
            rows={2}
          />
          <button
            type="submit"
            className="private-send-btn"
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrivateChat;

