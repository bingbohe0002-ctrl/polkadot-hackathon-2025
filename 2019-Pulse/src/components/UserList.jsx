import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import '../styles/UserList.css';

function UserList({ onUserClick }) {
  const { getAllUsers, getUserProfile } = useContract();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userAddresses = await getAllUsers();
      
      // Load profiles for all users
      const userProfiles = await Promise.all(
        userAddresses.map(async (address) => {
          const profile = await getUserProfile(address);
          return {
            address,
            ...profile
          };
        })
      );

      setUsers(userProfiles);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Members ({users.length})</h3>
        <button onClick={loadUsers} className="refresh-btn" title="Refresh users">
          🔄
        </button>
      </div>

      {isLoading ? (
        <div className="user-list-loading">
          <div className="spinner small"></div>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="no-users">
          <p>No users yet</p>
        </div>
      ) : (
        <div className="user-list-items">
          {users.map((user) => (
            <div
              key={user.address}
              className="user-list-item"
              onClick={() => onUserClick(user)}
            >
              <div className="user-avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="user-info">
                <div className="user-name">{user.username}</div>
                <div className="user-address">{formatAddress(user.address)}</div>
                {user.signature && (
                  <div className="user-signature" title={user.signature}>
                    "{user.signature}"
                  </div>
                )}
                <div className="user-joined">
                  Joined {formatDate(user.registeredAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserList;

