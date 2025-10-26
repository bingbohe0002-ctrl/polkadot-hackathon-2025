'use client';

import React from 'react';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';

type SubstrateAccount = {
  address: string;
  meta?: { name?: string };
};

export default function PolkadotConnect() {
  const [accounts, setAccounts] = React.useState<SubstrateAccount[]>([]);
  const [connecting, setConnecting] = React.useState(false);

  const isConnected = accounts.length > 0;
  const primary = accounts[0];

  const connect = async () => {
    try {
      setConnecting(true);
      const extensions = await web3Enable('PEX - PolkaVM Perpetual DEX');
      if (!extensions || extensions.length === 0) {
        alert('未检测到 Polkadot 扩展，请安装 SubWallet 或 polkadot.js 扩展');
        return;
      }
      const accs = await web3Accounts();
      setAccounts(accs as SubstrateAccount[]);
    } catch (e) {
      console.error('Polkadot connect error', e);
      alert('连接 Polkadot 扩展失败，请重试');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAccounts([]);
  };

  return (
    <div className="flex items-center space-x-2">
      {!isConnected ? (
        <button
          onClick={connect}
          disabled={connecting}
          className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {connecting ? '连接中…' : '连接钱包'}
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {primary?.meta?.name ? `${primary.meta.name} · ` : ''}
            {primary?.address?.slice(0, 6)}…{primary?.address?.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            className="px-2 py-1 rounded-md border border-border text-sm hover:bg-muted"
          >
            断开
          </button>
        </div>
      )}
    </div>
  );
}