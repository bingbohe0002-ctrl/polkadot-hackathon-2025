'use client'

import { useState } from 'react';

export default function NetworkPage() {
  const [status, setStatus] = useState<string>('');

  const CHAIN_ID_HEX = '0x190f1b44'; // 420420420
  const CHAIN_ID_DEC = 420420420;
  const RAW_RPC = (process.env.NEXT_PUBLIC_POLKAVM_RPC_URL || 'http://localhost:8545');
  const RPC_URLS = [RAW_RPC.replace('127.0.0.1', 'localhost'), RAW_RPC.replace('localhost', '127.0.0.1')];
  const CHAIN_NAME = 'PolkaVM Local';
  const NATIVE = { name: 'PEX', symbol: 'PEX', decimals: 18 };

  const verifyRpc = async () => {
    setStatus('验证 RPC 中...');
    try {
      const res = await fetch(RAW_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] })
      });
      const data = await res.json();
      setStatus(`eth_chainId: ${data?.result || '未知'}`);
    } catch (e: any) {
      setStatus(`RPC 验证失败: ${e?.message || String(e)}`);
    }
  };

  const addNetwork = async () => {
    setStatus('添加网络中...');
    const eth = (window as any).ethereum;
    if (!eth) {
      setStatus('未检测到钱包 (window.ethereum)');
      return;
    }
    try {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: CHAIN_ID_HEX,
          chainName: CHAIN_NAME,
          // MetaMask 要求至少一个有效的 HTTPS 或 localhost HTTP；我们同时提供 localhost 与 127 以兼容取链ID
          rpcUrls: RPC_URLS,
          nativeCurrency: NATIVE,
          blockExplorerUrls: [],
        }],
      });
      setStatus('网络已添加');
    } catch (e: any) {
      setStatus(`添加失败: ${e?.message || String(e)}`);
    }
  };

  const switchNetwork = async () => {
    setStatus('切换网络中...');
    const eth = (window as any).ethereum;
    if (!eth) {
      setStatus('未检测到钱包 (window.ethereum)');
      return;
    }
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
      });
      setStatus(`已切换到链 ${CHAIN_ID_DEC}`);
    } catch (e: any) {
      if (e?.code === 4902 || String(e?.message || '').includes('Unrecognized chain')) {
        try {
          await addNetwork();
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
          setStatus(`已添加并切换到链 ${CHAIN_ID_DEC}`);
        } catch (e2: any) {
          setStatus(`添加/切换失败: ${e2?.message || String(e2)}`);
        }
      } else {
        setStatus(`切换失败: ${e?.message || String(e)}`);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">PolkaVM 本地网络</h1>
      <p className="text-sm mb-2">链ID: {CHAIN_ID_DEC} (hex: {CHAIN_ID_HEX})</p>
      <p className="text-sm mb-6">RPC: {RAW_RPC}（尝试: {RPC_URLS.join(', ')})</p>
      <div className="flex gap-3 mb-6">
        <button onClick={verifyRpc} className="px-4 py-2 rounded bg-gray-200">验证本地 RPC</button>
        <button onClick={addNetwork} className="px-4 py-2 rounded bg-blue-500 text-white">添加网络</button>
        <button onClick={switchNetwork} className="px-4 py-2 rounded bg-green-600 text-white">添加并切换</button>
      </div>
      <div className="text-sm text-gray-700">{status}</div>
    </div>
  );
}