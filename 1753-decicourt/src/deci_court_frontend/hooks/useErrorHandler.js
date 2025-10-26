'use client';

import { useState, useCallback } from 'react';

/**
 * 错误处理Hook
 * 提供统一的错误处理和用户友好的错误消息
 */
export function useErrorHandler() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const handleError = useCallback((error) => {
    console.error('Error occurred:', error);
    
    let userMessage = '操作失败，请重试';
    
    if (error?.message) {
      const message = error.message.toLowerCase();
      
      // 合约特定错误
      if (message.includes('already registered')) {
        userMessage = '您已经注册为陪审员';
      } else if (message.includes('not a registered juror')) {
        userMessage = '您还未注册为陪审员';
      } else if (message.includes('cannot unregister while serving')) {
        userMessage = '正在审理案件时无法注销';
      } else if (message.includes('invalid defendant')) {
        userMessage = '被告地址无效';
      } else if (message.includes('not enough available jurors')) {
        userMessage = '可用陪审员不足';
      } else if (message.includes('filing fee transfer failed')) {
        userMessage = '立案费支付失败，请检查余额和授权';
      } else if (message.includes('not a juror for this case')) {
        userMessage = '您不是此案件的陪审员';
      } else if (message.includes('already committed')) {
        userMessage = '您已经提交过投票承诺';
      } else if (message.includes('commit phase ended')) {
        userMessage = '承诺阶段已结束';
      } else if (message.includes('reveal phase ended')) {
        userMessage = '揭示阶段已结束';
      } else if (message.includes('did not commit')) {
        userMessage = '您未在承诺阶段提交投票';
      } else if (message.includes('already revealed')) {
        userMessage = '您已经揭示过投票';
      } else if (message.includes('vote does not match commit')) {
        userMessage = '投票与承诺不匹配';
      } else if (message.includes('case not ready for verdict')) {
        userMessage = '案件尚未准备好执行判决';
      } else if (message.includes('reveal phase not ended')) {
        userMessage = '揭示阶段尚未结束';
      } else if (message.includes('only losing party can appeal')) {
        userMessage = '只有败诉方可以上诉';
      } else if (message.includes('appeal deadline passed')) {
        userMessage = '上诉期限已过';
      } else if (message.includes('case already appealed')) {
        userMessage = '案件已经上诉过';
      }
      
      // 钱包和网络错误
      else if (message.includes('user rejected')) {
        userMessage = '用户取消了交易';
      } else if (message.includes('insufficient funds')) {
        userMessage = '余额不足';
      } else if (message.includes('network')) {
        userMessage = '网络连接问题，请检查网络设置';
      } else if (message.includes('chain')) {
        userMessage = '请切换到正确的网络';
      } else if (message.includes('metamask')) {
        userMessage = 'MetaMask 连接问题';
      }
      
      // 通用错误
      else if (message.includes('execution reverted')) {
        userMessage = '交易执行失败，请检查参数';
      } else if (message.includes('gas')) {
        userMessage = 'Gas 费用不足或估算失败';
      } else if (message.includes('nonce')) {
        userMessage = '交易序号错误，请重试';
      } else if (message.includes('timeout')) {
        userMessage = '操作超时，请重试';
      }
    }
    
    setError(userMessage);
  }, []);

  const executeWithErrorHandling = useCallback(async (asyncFunction, loadingMessage = '') => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await asyncFunction();
      return result;
    } catch (error) {
      handleError(error);
      throw error; // 重新抛出错误，让调用者可以处理
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return {
    error,
    isLoading,
    clearError,
    handleError,
    executeWithErrorHandling
  };
}

/**
 * 交易状态Hook
 * 跟踪交易的各个阶段
 */
export function useTransactionStatus() {
  const [status, setStatus] = useState('idle'); // idle, pending, confirming, success, error
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash('');
    setError('');
  }, []);

  const setPending = useCallback(() => {
    setStatus('pending');
    setError('');
  }, []);

  const setConfirming = useCallback((hash) => {
    setStatus('confirming');
    setTxHash(hash);
  }, []);

  const setSuccess = useCallback(() => {
    setStatus('success');
  }, []);

  const setError = useCallback((error) => {
    setStatus('error');
    setError(error);
  }, []);

  return {
    status,
    txHash,
    error,
    reset,
    setPending,
    setConfirming,
    setSuccess,
    setError,
    isPending: status === 'pending',
    isConfirming: status === 'confirming',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
}