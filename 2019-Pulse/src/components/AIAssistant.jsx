import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useContract } from '../hooks/useContract';
import '../styles/AIAssistant.css';

function AIAssistant({ 
  inputText, 
  onApplyText, 
  messages = [],
  onSummaryGenerated 
}) {
  const { address } = useAccount();
  const { checkAIAccess, mintAINFT, getMintPrice } = useContract();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintPrice, setMintPrice] = useState('0');
  const [aiResult, setAiResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3001';

  // Check AI access on mount
  useEffect(() => {
    const checkAccess = async () => {
      if (address) {
        try {
          const access = await checkAIAccess(address);
          setHasAccess(access);
        } catch (error) {
          console.error('Error checking AI access:', error);
        }
      }
    };

    checkAccess();
  }, [address, checkAIAccess]);

  // Get mint price
  useEffect(() => {
    const fetchMintPrice = async () => {
      try {
        const price = await getMintPrice();
        setMintPrice(price);
      } catch (error) {
        console.error('Error fetching mint price:', error);
      }
    };

    fetchMintPrice();
  }, [getMintPrice]);

  const handleAIAction = async (action) => {
    if (!hasAccess) {
      setShowMintModal(true);
      setShowMenu(false);
      return;
    }

    setIsLoading(true);
    setShowMenu(false);

    try {
      let result;

      switch (action) {
        case 'smart-reply':
          result = await generateSmartReply();
          break;
        case 'polish':
          result = await polishContent();
          break;
        case 'summarize':
          result = await summarizeChat();
          break;
        default:
          throw new Error('Unknown action');
      }

      setAiResult(result);
      setShowResultModal(true);
    } catch (error) {
      console.error('AI action error:', error);
      toast.error(error.message || 'AI service error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartReply = async () => {
    if (!inputText || inputText.trim() === '') {
      throw new Error('Please enter some text first');
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/smart-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userInput: inputText,
        context: messages.slice(-3).map(m => m.content).join(' ') 
      }),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    return {
      type: 'smart-reply',
      title: 'Smart Reply Generated',
      content: data.reply,
      action: 'Use Reply',
    };
  };

  const polishContent = async () => {
    if (!inputText || inputText.trim() === '') {
      throw new Error('Please enter some text first');
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/polish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: inputText }),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    return {
      type: 'polish',
      title: 'Polished Content',
      original: data.original,
      content: data.polished,
      action: 'Use Polished Text',
    };
  };

  const summarizeChat = async () => {
    if (!messages || messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    const today = new Date().toLocaleDateString();
    const todayMessages = messages.filter(msg => {
      const msgDate = new Date(msg.timestamp * 1000).toLocaleDateString();
      return msgDate === today;
    });

    if (todayMessages.length === 0) {
      throw new Error('No messages from today');
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: todayMessages.map(m => ({
          sender: m.username || 'User',
          content: m.content,
          timestamp: m.timestamp,
        })),
        date: today,
      }),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    return {
      type: 'summary',
      title: `Chat Summary - ${today}`,
      content: data.summary,
      messageCount: todayMessages.length,
      action: 'Close',
    };
  };

  const handleMintNFT = async () => {
    setIsLoading(true);
    try {
      await mintAINFT(mintPrice);
      toast.success('AI NFT minted successfully! 🎉');
      setHasAccess(true);
      setShowMintModal(false);
    } catch (error) {
      console.error('Mint error:', error);
      toast.error(error.message || 'Failed to mint NFT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyResult = () => {
    if (aiResult && (aiResult.type === 'smart-reply' || aiResult.type === 'polish')) {
      onApplyText(aiResult.content);
      toast.success('Applied to input!');
    }
    
    if (aiResult && aiResult.type === 'summary' && onSummaryGenerated) {
      onSummaryGenerated(aiResult);
    }
    
    setShowResultModal(false);
    setAiResult(null);
  };

  return (
    <>
      {/* AI Button */}
      <div className="ai-assistant-container">
        <button
          type="button"
          className={`ai-button ${hasAccess ? 'active' : 'locked'}`}
          onClick={() => setShowMenu(!showMenu)}
          disabled={isLoading}
          title={hasAccess ? 'AI Assistant' : 'Mint NFT to unlock AI'}
        >
          {isLoading ? (
            <span className="ai-loading">⚙️</span>
          ) : (
            <span className="ai-icon">🤖</span>
          )}
        </button>

        {/* AI Menu */}
        {showMenu && (
          <div className="ai-menu">
            <div className="ai-menu-header">
              <span>🤖 AI Assistant</span>
              {!hasAccess && <span className="lock-badge">🔒 Locked</span>}
            </div>
            
            <button
              type="button"
              className="ai-menu-item"
              onClick={() => handleAIAction('smart-reply')}
              disabled={isLoading}
            >
              <span className="ai-menu-icon">💡</span>
              <div className="ai-menu-text">
                <div className="ai-menu-title">Smart Reply</div>
                <div className="ai-menu-desc">Generate intelligent response</div>
              </div>
            </button>

            <button
              type="button"
              className="ai-menu-item"
              onClick={() => handleAIAction('polish')}
              disabled={isLoading}
            >
              <span className="ai-menu-icon">✨</span>
              <div className="ai-menu-text">
                <div className="ai-menu-title">Polish Text</div>
                <div className="ai-menu-desc">Improve your message</div>
              </div>
            </button>

            <button
              type="button"
              className="ai-menu-item"
              onClick={() => handleAIAction('summarize')}
              disabled={isLoading}
            >
              <span className="ai-menu-icon">📝</span>
              <div className="ai-menu-text">
                <div className="ai-menu-title">Summarize Today</div>
                <div className="ai-menu-desc">Get today's chat summary</div>
              </div>
            </button>

            {!hasAccess && (
              <div className="ai-menu-footer">
                <button
                  type="button"
                  className="mint-nft-button"
                  onClick={() => {
                    setShowMintModal(true);
                    setShowMenu(false);
                  }}
                >
                  🎫 Mint AI NFT to Unlock
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mint NFT Modal */}
      {showMintModal && (
        <div className="ai-modal-overlay" onClick={() => setShowMintModal(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h2>🎫 Mint AI Assistant NFT</h2>
              <button
                type="button"
                className="ai-modal-close"
                onClick={() => setShowMintModal(false)}
              >
                ×
              </button>
            </div>

            <div className="ai-modal-content">
              <div className="nft-preview">
                <div className="nft-image">🤖</div>
                <h3>Pulse AI Assistant Pass</h3>
                <p>Unlock AI-powered features forever</p>
              </div>

              <div className="nft-features">
                <div className="feature-item">
                  <span className="feature-icon">💡</span>
                  <span>Smart Reply Generation</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✨</span>
                  <span>Content Polish & Enhancement</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📝</span>
                  <span>Daily Chat Summaries</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">♾️</span>
                  <span>Lifetime Access</span>
                </div>
              </div>

              <div className="mint-info">
                <div className="mint-price">
                  <span>Price:</span>
                  <strong>{mintPrice} PAS</strong>
                </div>
              </div>

              <button
                type="button"
                className="mint-button"
                onClick={handleMintNFT}
                disabled={isLoading}
              >
                {isLoading ? 'Minting...' : '🎫 Mint NFT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Result Modal */}
      {showResultModal && aiResult && (
        <div className="ai-modal-overlay" onClick={() => setShowResultModal(false)}>
          <div className="ai-modal ai-result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h2>{aiResult.title}</h2>
              <button
                type="button"
                className="ai-modal-close"
                onClick={() => setShowResultModal(false)}
              >
                ×
              </button>
            </div>

            <div className="ai-modal-content">
              {aiResult.original && (
                <div className="ai-result-section">
                  <h4>Original:</h4>
                  <p className="original-text">{aiResult.original}</p>
                </div>
              )}

              <div className="ai-result-section">
                <h4>{aiResult.type === 'summary' ? 'Summary:' : 'Result:'}</h4>
                <p className="result-text">{aiResult.content}</p>
              </div>

              {aiResult.messageCount && (
                <div className="ai-result-info">
                  Analyzed {aiResult.messageCount} messages
                </div>
              )}

              <button
                type="button"
                className="apply-button"
                onClick={handleApplyResult}
              >
                {aiResult.action}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="ai-menu-backdrop"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
}

export default AIAssistant;

