import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useContract } from '../hooks/useContract';
import '../styles/ChannelList.css';

function ChannelList({ onSelectChannel, onClose }) {
  const { address } = useAccount();
  const { getMyChannels, createChannel } = useContract();
  
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const channelsData = await getMyChannels();
      setChannels(channelsData);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, [address]);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    
    if (!newChannelName.trim()) return;

    if (newChannelName.length > 100) {
      toast.error('Channel name is too long (max 100 characters)');
      return;
    }

    setIsCreating(true);

    try {
      const channelId = await createChannel(newChannelName);
      setNewChannelName('');
      setShowCreateForm(false);

      setTimeout(() => {
        loadChannels();
      }, 2000);

      toast.success('Channel created successfully!');
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast.error('Failed to create channel. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="channel-list-overlay">
      <div className="channel-list-container">
        <div className="channel-list-header">
          <h2>My Channels</h2>
          <div className="header-actions">
            <button 
              className="create-channel-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              ➕ Create Channel
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {showCreateForm && (
          <div className="create-channel-form">
            <form onSubmit={handleCreateChannel}>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Enter channel name"
                className="channel-name-input"
                maxLength={100}
                disabled={isCreating}
              />
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isCreating || !newChannelName.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewChannelName('');
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="channels-content">
          {isLoading ? (
            <div className="loading-channels">
              <div className="spinner"></div>
              <p>Loading channels...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="no-channels">
              <span className="no-channels-icon">📢</span>
              <p>You haven't subscribed to any channels yet</p>
              <p className="hint">Create a new channel or subscribe via invite link</p>
            </div>
          ) : (
            <div className="channels-grid">
              {channels.map((channel) => (
                <div 
                  key={channel.channelId.toString()} 
                  className="channel-card"
                  onClick={() => onSelectChannel(channel)}
                >
                  <div className="channel-icon">📢</div>
                  <div className="channel-details">
                    <h3 className="channel-name">{channel.name}</h3>
                    <div className="channel-meta">
                      <span className="subscriber-count">
                        {Number(channel.subscriberCount)} {Number(channel.subscriberCount) === 1 ? 'subscriber' : 'subscribers'}
                      </span>
                      <span className="channel-created">
                        Created {formatTimestamp(channel.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChannelList;

