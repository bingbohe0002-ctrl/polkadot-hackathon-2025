import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import '../styles/InviteAccept.css';

function InviteAccept({ type, id, name, onAccept, onCancel }) {
  const { isConnected } = useAccount();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsAccepting(true);
    try {
      await onAccept();
    } catch (error) {
      console.error('Failed to accept invite:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="invite-accept-overlay">
      <div className="invite-accept-container">
        <div className="invite-accept-header">
          <h2>🎉 You've been invited!</h2>
        </div>
        
        <div className="invite-accept-content">
          {type === 'channel' && (
            <>
              <div className="invite-icon">📢</div>
              <h3>Subscribe to Channel</h3>
              {name && <p className="invite-name">{name}</p>}
              <p className="invite-description">
                You've been invited to subscribe to this channel. 
                Click the button below to accept the invitation.
              </p>
            </>
          )}
          
          {type === 'group' && (
            <>
              <div className="invite-icon">👥</div>
              <h3>Join Group</h3>
              {name && <p className="invite-name">{name}</p>}
              <p className="invite-description">
                You've been invited to join this group. 
                Click the button below to accept the invitation.
              </p>
            </>
          )}

          {!isConnected && (
            <div className="invite-warning">
              ⚠️ Please connect your wallet first to accept this invitation
            </div>
          )}
        </div>

        <div className="invite-accept-actions">
          <button 
            className="accept-btn"
            onClick={handleAccept}
            disabled={isAccepting || !isConnected}
          >
            {isAccepting ? 'Accepting...' : `Accept & ${type === 'channel' ? 'Subscribe' : 'Join'}`}
          </button>
          <button 
            className="cancel-btn"
            onClick={onCancel}
            disabled={isAccepting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteAccept;

