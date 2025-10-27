import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import '../styles/PrivateChat.css';

function PrivateChat({ user, onClose }) {
  const { address } = useAccount();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load private messages from localStorage
    loadMessages();
  }, [user.address]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    const storageKey = getStorageKey(address, user.address);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages([]);
    }
  };

  const getStorageKey = (addr1, addr2) => {
    // Sort addresses to ensure consistent key regardless of who initiates chat
    const sorted = [addr1.toLowerCase(), addr2.toLowerCase()].sort();
    return `pulse_private_${sorted[0]}_${sorted[1]}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: address,
      content: newMessage,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);

    // Save to localStorage
    const storageKey = getStorageKey(address, user.address);
    localStorage.setItem(storageKey, JSON.stringify(updatedMessages));

    setNewMessage('');
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
                🔒 Private chat (stored locally, not on-chain)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="private-chat-messages">
          {messages.length === 0 ? (
            <div className="no-private-messages">
              <span className="icon">💬</span>
              <p>Start a private conversation with {user.username}</p>
              <span className="hint">Messages are stored locally and not on-chain</span>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwnMessage = message.sender.toLowerCase() === address.toLowerCase();
                return (
                  <div
                    key={message.id}
                    className={`private-message ${isOwnMessage ? 'own' : 'other'}`}
                  >
                    <div className="private-message-content">
                      {message.content}
                    </div>
                    <div className="private-message-time">
                      {formatTimestamp(message.timestamp)}
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
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrivateChat;

