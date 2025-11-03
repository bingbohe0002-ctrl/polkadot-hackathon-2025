import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useContract } from '../hooks/useContract';
import '../styles/Discover.css';

function Discover({ onClose, onSelectGroup, onSelectChannel }) {
  const { address } = useAccount();
  const { 
    getAllGroups, 
    getAllChannels, 
    joinGroup, 
    subscribeToChannel,
    getGroupMembers,
    getChannelSubscribers
  } = useContract();
  
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' or 'channels'
  const [groups, setGroups] = useState([]);
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [subscribingId, setSubscribingId] = useState(null);
  const [userGroups, setUserGroups] = useState(new Set());
  const [userChannels, setUserChannels] = useState(new Set());

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const groupsData = await getAllGroups();
      setGroups(groupsData);
      
      // Check which groups user is already in
      const membershipChecks = await Promise.all(
        groupsData.map(async (group) => {
          try {
            const members = await getGroupMembers(group.groupId);
            const isMember = members.some(
              member => member.toLowerCase() === address?.toLowerCase()
            );
            return { groupId: group.groupId, isMember };
          } catch (error) {
            return { groupId: group.groupId, isMember: false };
          }
        })
      );
      
      const memberGroupIds = new Set(
        membershipChecks
          .filter(check => check.isMember)
          .map(check => check.groupId)
      );
      setUserGroups(memberGroupIds);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const channelsData = await getAllChannels();
      setChannels(channelsData);
      
      // Check which channels user is already subscribed to
      const subscriptionChecks = await Promise.all(
        channelsData.map(async (channel) => {
          try {
            const subscribers = await getChannelSubscribers(channel.channelId);
            const isSubscribed = subscribers.some(
              sub => sub.toLowerCase() === address?.toLowerCase()
            );
            return { channelId: channel.channelId, isSubscribed };
          } catch (error) {
            return { channelId: channel.channelId, isSubscribed: false };
          }
        })
      );
      
      const subscribedChannelIds = new Set(
        subscriptionChecks
          .filter(check => check.isSubscribed)
          .map(check => check.channelId)
      );
      setUserChannels(subscribedChannelIds);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'groups') {
      loadGroups();
    } else {
      loadChannels();
    }
  }, [activeTab, address]);

  const handleJoinGroup = async (groupId) => {
    setJoiningId(groupId);
    try {
      await joinGroup(groupId);
      toast.success('Successfully joined the group!');
      setUserGroups(prev => new Set([...prev, groupId]));
    } catch (error) {
      console.error('Failed to join group:', error);
      toast.error('Failed to join group. You may already be a member.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleSubscribeChannel = async (channelId) => {
    setSubscribingId(channelId);
    try {
      await subscribeToChannel(channelId);
      toast.success('Successfully subscribed to the channel!');
      setUserChannels(prev => new Set([...prev, channelId]));
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Failed to subscribe. You may already be subscribed.');
    } finally {
      setSubscribingId(null);
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

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="discover-overlay">
      <div className="discover-container">
        <div className="discover-header">
          <h2>🔍 Discover</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="discover-tabs">
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            👥 Groups
          </button>
          <button
            className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            📢 Channels
          </button>
        </div>

        <div className="discover-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="search-input"
          />
        </div>

        <div className="discover-content">
          {isLoading ? (
            <div className="loading-discover">
              <div className="spinner"></div>
              <p>Loading {activeTab}...</p>
            </div>
          ) : activeTab === 'groups' ? (
            filteredGroups.length === 0 ? (
              <div className="no-results">
                <span className="no-results-icon">👥</span>
                <p>No groups found</p>
              </div>
            ) : (
              <div className="discover-grid">
                {filteredGroups.map((group) => {
                  const isMember = userGroups.has(group.groupId);
                  return (
                    <div key={group.groupId} className="discover-card">
                      <div className="discover-card-header">
                        <div className="discover-icon">👥</div>
                        <h3 className="discover-name">{group.name}</h3>
                      </div>
                      <div className="discover-meta">
                        <span className="meta-item">
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        <span className="meta-item">
                          Created {formatTimestamp(group.createdAt)}
                        </span>
                      </div>
                      <div className="discover-actions">
                        {isMember ? (
                          <>
                            <button
                              className="view-btn"
                              onClick={() => {
                                onSelectGroup(group);
                                onClose();
                              }}
                            >
                              💬 Open
                            </button>
                            <span className="joined-badge">✓ Joined</span>
                          </>
                        ) : (
                          <button
                            className="join-btn"
                            onClick={() => handleJoinGroup(group.groupId)}
                            disabled={joiningId === group.groupId}
                          >
                            {joiningId === group.groupId ? 'Joining...' : '➕ Join'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredChannels.length === 0 ? (
              <div className="no-results">
                <span className="no-results-icon">📢</span>
                <p>No channels found</p>
              </div>
            ) : (
              <div className="discover-grid">
                {filteredChannels.map((channel) => {
                  const isSubscribed = userChannels.has(channel.channelId);
                  return (
                    <div key={channel.channelId} className="discover-card">
                      <div className="discover-card-header">
                        <div className="discover-icon">📢</div>
                        <h3 className="discover-name">{channel.name}</h3>
                      </div>
                      <div className="discover-meta">
                        <span className="meta-item">
                          {channel.subscriberCount} {channel.subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                        </span>
                        <span className="meta-item">
                          Created {formatTimestamp(channel.createdAt)}
                        </span>
                      </div>
                      <div className="discover-actions">
                        {isSubscribed ? (
                          <>
                            <button
                              className="view-btn"
                              onClick={() => {
                                onSelectChannel(channel);
                                onClose();
                              }}
                            >
                              📡 Open
                            </button>
                            <span className="joined-badge">✓ Subscribed</span>
                          </>
                        ) : (
                          <button
                            className="subscribe-btn"
                            onClick={() => handleSubscribeChannel(channel.channelId)}
                            disabled={subscribingId === channel.channelId}
                          >
                            {subscribingId === channel.channelId ? 'Subscribing...' : '➕ Subscribe'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Discover;

