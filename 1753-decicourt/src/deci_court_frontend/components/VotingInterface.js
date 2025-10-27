'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { DECICOURT_ABI, CONTRACT_CONFIG } from '../config/contracts';
import { generateVoteHash, generateRandomSalt, VOTE_OPTIONS, getTimeRemaining } from '../lib/voting';

const VotingInterface = ({ caseData, onVoteSuccess }) => {
  const { address } = useAccount();
  const [voteOption, setVoteOption] = useState('');
  const [salt, setSalt] = useState('');
  const [voteHash, setVoteHash] = useState('');
  const [isCommitPhase, setIsCommitPhase] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ expired: false, text: '' });
  const [error, setError] = useState('');
  const [storedVoteData, setStoredVoteData] = useState(null);

  const { writeContract: commitVote, data: commitHash, isPending: isCommitting } = useWriteContract();
  const { writeContract: revealVote, data: revealHash, isPending: isRevealing } = useWriteContract();
  
  const { isLoading: isCommitConfirming } = useWaitForTransactionReceipt({
    hash: commitHash,
  });
  
  const { isLoading: isRevealConfirming } = useWaitForTransactionReceipt({
    hash: revealHash,
  });

  // 检查用户是否是该案件的陪审员
  const { data: isJuror } = useReadContract({
    address: CONTRACT_CONFIG.DECICOURT_ADDRESS,
    abi: DECICOURT_ABI,
    functionName: 'getCaseJurors',
    args: [BigInt(caseData.id)],
    query: {
      select: (jurors) => jurors.includes(address),
    },
  });

  // 更新时间和阶段
  useEffect(() => {
    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const commitDeadline = Number(caseData.commitDeadline);
      const revealDeadline = Number(caseData.revealDeadline);
      
      if (now <= commitDeadline) {
        setIsCommitPhase(true);
        setTimeRemaining(getTimeRemaining(commitDeadline));
      } else if (now <= revealDeadline) {
        setIsCommitPhase(false);
        setTimeRemaining(getTimeRemaining(revealDeadline));
      } else {
        setTimeRemaining({ expired: true, text: '投票已结束' });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [caseData]);

  // 从本地存储加载投票数据
  useEffect(() => {
    const stored = localStorage.getItem(`vote_${caseData.id}_${address}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setStoredVoteData(data);
        setVoteOption(data.vote);
        setSalt(data.salt);
        setVoteHash(data.hash);
      } catch (error) {
        console.error('Failed to load stored vote data:', error);
      }
    }
  }, [caseData.id, address]);

  const handleGenerateVote = () => {
    if (!voteOption) {
      setError('请选择投票选项');
      return;
    }

    try {
      const newSalt = generateRandomSalt();
      const hash = generateVoteHash(parseInt(voteOption), newSalt);
      
      setSalt(newSalt);
      setVoteHash(hash);
      setError('');

      // 保存到本地存储
      const voteData = {
        vote: parseInt(voteOption),
        salt: newSalt,
        hash: hash,
        caseId: caseData.id,
        timestamp: Date.now()
      };
      localStorage.setItem(`vote_${caseData.id}_${address}`, JSON.stringify(voteData));
      setStoredVoteData(voteData);
    } catch (error) {
      setError('生成投票哈希失败: ' + error.message);
    }
  };

  const handleCommitVote = async () => {
    if (!voteHash) {
      setError('请先生成投票哈希');
      return;
    }

    try {
      setError('');
      await commitVote({
        address: CONTRACT_CONFIG.DECICOURT_ADDRESS,
        abi: DECICOURT_ABI,
        functionName: 'commitVote',
        args: [BigInt(caseData.id), voteHash],
      });
    } catch (error) {
      setError('提交投票承诺失败: ' + error.message);
    }
  };

  const handleRevealVote = async () => {
    if (!storedVoteData) {
      setError('未找到投票数据，请确保您已在承诺阶段提交投票');
      return;
    }

    try {
      setError('');
      await revealVote({
        address: CONTRACT_CONFIG.DECICOURT_ADDRESS,
        abi: DECICOURT_ABI,
        functionName: 'revealVote',
        args: [BigInt(caseData.id), storedVoteData.vote, storedVoteData.salt],
      });
    } catch (error) {
      setError('揭示投票失败: ' + error.message);
    }
  };

  // 监听交易确认
  useEffect(() => {
    if (commitHash && !isCommitConfirming) {
      onVoteSuccess?.('投票承诺提交成功');
    }
  }, [commitHash, isCommitConfirming, onVoteSuccess]);

  useEffect(() => {
    if (revealHash && !isRevealConfirming) {
      onVoteSuccess?.('投票揭示成功');
      // 清除本地存储的投票数据
      localStorage.removeItem(`vote_${caseData.id}_${address}`);
    }
  }, [revealHash, isRevealConfirming, onVoteSuccess, caseData.id, address]);

  if (!isJuror) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600">您不是此案件的陪审员</p>
      </div>
    );
  }

  if (timeRemaining.expired) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600">投票时间已结束</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4">
        {isCommitPhase ? '投票承诺阶段' : '投票揭示阶段'}
      </h3>
      
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="text-blue-800 text-sm">
          剩余时间: {timeRemaining.text}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {isCommitPhase ? (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择您的投票:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="1"
                  checked={voteOption === '1'}
                  onChange={(e) => setVoteOption(e.target.value)}
                  className="mr-2"
                />
                <span>支持原告</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="2"
                  checked={voteOption === '2'}
                  onChange={(e) => setVoteOption(e.target.value)}
                  className="mr-2"
                />
                <span>支持被告</span>
              </label>
            </div>
          </div>

          {!voteHash && (
            <button
              onClick={handleGenerateVote}
              disabled={!voteOption}
              className="w-full mb-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded transition-colors"
            >
              生成投票哈希
            </button>
          )}

          {voteHash && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">投票哈希:</p>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                {voteHash}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                请保存此信息，揭示阶段需要使用
              </p>
            </div>
          )}

          <button
            onClick={handleCommitVote}
            disabled={!voteHash || isCommitting || isCommitConfirming}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-2 px-4 rounded transition-colors"
          >
            {isCommitting || isCommitConfirming ? '提交中...' : '提交投票承诺'}
          </button>
        </div>
      ) : (
        <div>
          {storedVoteData ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">您的投票:</p>
              <p className="font-medium">{VOTE_OPTIONS[storedVoteData.vote]}</p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
              <p className="text-yellow-700 text-sm">
                未找到您的投票数据。请确保您在承诺阶段已提交投票。
              </p>
            </div>
          )}

          <button
            onClick={handleRevealVote}
            disabled={!storedVoteData || isRevealing || isRevealConfirming}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-2 px-4 rounded transition-colors"
          >
            {isRevealing || isRevealConfirming ? '揭示中...' : '揭示投票'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VotingInterface;