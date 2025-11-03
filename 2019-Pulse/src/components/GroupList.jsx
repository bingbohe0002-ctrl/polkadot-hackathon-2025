import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useContract } from '../hooks/useContract';
import '../styles/GroupList.css';

function GroupList({ onSelectGroup, onClose }) {
  const { address } = useAccount();
  const { getMyGroups, createGroup } = useContract();
  
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const groupsData = await getMyGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [address]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) return;

    if (newGroupName.length > 100) {
      toast.error('Group name is too long (max 100 characters)');
      return;
    }

    setIsCreating(true);
    
    try {
      const groupId = await createGroup(newGroupName);
      setNewGroupName('');
      setShowCreateForm(false);
      
      setTimeout(() => {
        loadGroups();
      }, 2000);

      toast.success('Group created successfully!');
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group. Please try again.');
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
    <div className="group-list-overlay">
      <div className="group-list-container">
        <div className="group-list-header">
          <h2>My Groups</h2>
          <div className="header-actions">
            <button 
              className="create-group-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              ➕ Create Group
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {showCreateForm && (
          <div className="create-group-form">
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                className="group-name-input"
                maxLength={100}
                disabled={isCreating}
              />
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isCreating || !newGroupName.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewGroupName('');
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="groups-content">
          {isLoading ? (
            <div className="loading-groups">
              <div className="spinner"></div>
              <p>Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="no-groups">
              <span className="no-groups-icon">👥</span>
              <p>You haven't joined any groups yet</p>
              <p className="hint">Create a new group or join via invite link</p>
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map((group) => (
                <div 
                  key={group.groupId.toString()} 
                  className="group-card"
                  onClick={() => onSelectGroup(group)}
                >
                  <div className="group-icon">👥</div>
                  <div className="group-details">
                    <h3 className="group-name">{group.name}</h3>
                    <div className="group-meta">
                      <span className="member-count">
                        {Number(group.memberCount)} {Number(group.memberCount) === 1 ? 'member' : 'members'}
                      </span>
                      <span className="group-created">
                        Created {formatTimestamp(group.createdAt)}
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

export default GroupList;

