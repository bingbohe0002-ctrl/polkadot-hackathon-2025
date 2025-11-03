import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useContract } from '../hooks/useContract';
import MessageItem from './MessageItem';
import '../styles/GroupChat.css';

function GroupChat({ group, onClose, onOpenPrivateChat }) {
  const { address } = useAccount();
  const {
    sendGroupMessage,
    getLatestGroupMessages,
    getGroupMembers,
    getUserProfile,
    joinGroup
  } = useContract();

  const [isJoining, setIsJoining] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const loadMessages = async () => {
    try {
      const msgs = await getLatestGroupMessages(group.groupId, 100);
      setMessages(msgs);
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const memberAddresses = await getGroupMembers(group.groupId);
      setMembers(memberAddresses);

      // Check if current user is a member
      const userIsMember = memberAddresses.some(
        member => member.toLowerCase() === address?.toLowerCase()
      );
      setIsMember(userIsMember);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    loadMembers();
  }, [group.groupId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    if (newMessage.length > 1000) {
      toast.error('Message is too long (max 1000 characters)');
      return;
    }

    setIsSending(true);

    try {
      await sendGroupMessage(group.groupId, newMessage);
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
    return `${window.location.origin}?joinGroup=${group.groupId}`;
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    toast.success('Invite link copied to clipboard!');
  };

  const handleJoinGroup = async () => {
    setIsJoining(true);
    try {
      await joinGroup(group.groupId);
      toast.success('Successfully joined the group!');
      // Reload members to update isMember state
      await loadMembers();
    } catch (error) {
      console.error('Failed to join group:', error);
      toast.error('Failed to join group. You may already be a member.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="group-chat-overlay">
      <div className="group-chat-container">
        <div className="group-chat-header">
          <div className="group-info">
            <h2>{group.name}</h2>
            <span className="member-count">{members.length} members</span>
          </div>
          <div className="group-actions">
            <button
              className="action-btn"
              onClick={() => setShowMembers(!showMembers)}
            >
              👥 Members
            </button>
            {isMember && (
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
            <h3>Invite Members</h3>
            <div className="invite-link-section">
              <p>Share this link with anyone to invite them to join:</p>
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

        {showMembers && (
          <div className="members-panel">
            <h3>Members ({members.length})</h3>
            <div className="members-list">
              {members.map((memberAddr, index) => (
                <MemberItem 
                  key={index} 
                  address={memberAddr}
                  getUserProfile={getUserProfile}
                  isCurrentUser={memberAddr.toLowerCase() === address?.toLowerCase()}
                />
              ))}
            </div>
          </div>
        )}

        <div className="group-chat-messages-wrapper">
          <div className="group-chat-messages" ref={chatContainerRef}>
            {isLoading ? (
              <div className="loading-messages">
                <div className="spinner"></div>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="no-messages">
                <span className="no-messages-icon">💬</span>
                <p>No messages yet. Start the conversation!</p>
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

          {isMember ? (
            <form onSubmit={handleSendMessage} className="message-input-form">
              <div className="message-input-container">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
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
                      <span className="send-icon">➤</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="join-prompt">
              <p>👥 Join this group to participate in the conversation</p>
              <button
                className="join-btn"
                onClick={handleJoinGroup}
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : '✅ Join Group'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberItem({ address, getUserProfile, isCurrentUser }) {
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
    <div className="member-item">
      <div className="member-avatar">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="avatar" />
        ) : (
          <div className="default-avatar">👤</div>
        )}
      </div>
      <div className="member-info">
        <span className="member-name">
          {profile?.username || formatAddress(address)}
        </span>
        {isCurrentUser && <span className="you-badge">You</span>}
      </div>
    </div>
  );
}

export default GroupChat;

