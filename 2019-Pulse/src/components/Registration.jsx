import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '../hooks/useContract';
import '../styles/Registration.css';

function Registration({ onComplete }) {
  const { address } = useAccount();
  const { registerUser, checkUsernameAvailable } = useContract();
  
  const [formData, setFormData] = useState({
    username: '',
    signature: '',
    avatarUrl: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset username availability when username changes
    if (name === 'username') {
      setUsernameAvailable(null);
      setError('');
    }
  };

  const checkUsername = async () => {
    if (!formData.username || formData.username.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (formData.username.length > 50) {
      setError('Username must be less than 50 characters');
      return;
    }

    setUsernameChecking(true);
    setError('');
    
    try {
      const available = await checkUsernameAvailable(formData.username);
      setUsernameAvailable(available);
      
      if (!available) {
        setError('Username is already taken');
      }
    } catch (err) {
      setError('Failed to check username availability');
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username) {
      setError('Username is required');
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await registerUser(
        formData.username,
        formData.signature || '',
        formData.avatarUrl || ''
      );
      
      // Wait a bit for transaction to be mined
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card card">
        <h2 className="registration-title">Create Your Profile</h2>
        <p className="registration-subtitle">
          Set up your profile to start chatting on Pulse
        </p>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username <span className="required">*</span>
            </label>
            <div className="username-input-group">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className={`form-input ${usernameAvailable === false ? 'error' : usernameAvailable === true ? 'success' : ''}`}
                required
                maxLength={50}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={checkUsername}
                className="check-btn"
                disabled={!formData.username || usernameChecking || isSubmitting}
              >
                {usernameChecking ? '...' : 'Check'}
              </button>
            </div>
            {usernameAvailable === true && (
              <span className="field-hint success">✓ Username is available</span>
            )}
            {usernameAvailable === false && (
              <span className="field-hint error">✗ Username is taken</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="signature" className="form-label">
              Personal Signature <span className="optional">(Optional)</span>
            </label>
            <textarea
              id="signature"
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              placeholder="A short bio or signature..."
              className="form-input form-textarea"
              maxLength={200}
              rows={3}
              disabled={isSubmitting}
            />
            <span className="field-hint">
              {formData.signature.length}/200 characters
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="avatarUrl" className="form-label">
              Avatar URL <span className="optional">(Optional)</span>
            </label>
            <input
              type="url"
              id="avatarUrl"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/avatar.jpg"
              className="form-input"
              disabled={isSubmitting}
            />
            <span className="field-hint">
              Enter a URL for your avatar image
            </span>
          </div>

          {formData.avatarUrl && (
            <div className="avatar-preview">
              <img 
                src={formData.avatarUrl} 
                alt="Avatar preview"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span style={{ display: 'none' }}>Invalid image URL</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || !formData.username || usernameAvailable === false}
          >
            {isSubmitting ? (
              <>
                <span className="spinner small"></span>
                Registering...
              </>
            ) : (
              'Create Profile & Join Chat'
            )}
          </button>
        </form>

        <div className="registration-footer">
          <p className="footer-note">
            💡 Registration requires a transaction on Polkadot Hub TestNet
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registration;

