'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';

const WalletConnection = ({ targetChainId = 31337 }) => {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  const [error, setError] = useState('');

  const isWrongNetwork = isConnected && chainId !== targetChainId;

  const handleConnect = async () => {
    try {
      setError('');
      connect({ connector: injected() });
    } catch (err) {
      setError('连接钱包失败: ' + err.message);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      setError('');
      await switchChain({ chainId: targetChainId });
    } catch (err) {
      setError('切换网络失败: ' + err.message);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setError('');
  };

  // 检查是否安装了 MetaMask
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum;

  if (!isMetaMaskInstalled) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">钱包连接</h2>
        <div className="text-center">
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded">
            <p className="text-red-700">未检测到 MetaMask</p>
          </div>
          <p className="text-gray-600 mb-4">请安装 MetaMask 浏览器扩展</p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
          >
            安装 MetaMask
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">钱包连接</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {!isConnected ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">请连接您的钱包以使用DeciCourt</p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            {isConnecting ? '连接中...' : '连接钱包'}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">已连接账户:</p>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
              {address}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">当前网络:</p>
            <p className="text-sm font-medium">
              链ID: {chainId} {chainId === targetChainId ? '✓' : '❌'}
            </p>
          </div>
          
          {isWrongNetwork && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
              <p className="text-yellow-700 text-sm mb-2">
                当前网络不正确，请切换到本地测试网 (链ID: {targetChainId})
              </p>
              <button
                onClick={handleSwitchNetwork}
                disabled={isSwitching}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white text-sm px-3 py-1 rounded transition-colors"
              >
                {isSwitching ? '切换中...' : '切换网络'}
              </button>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-green-600 text-sm">
              ✓ 钱包已连接
            </div>
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              断开连接
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;