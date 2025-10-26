'use client';

import { createConfig, http } from 'wagmi';
import { hardhat, mainnet } from 'wagmi/chains';

// 本地测试网配置
const localTestnet = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337'),
  name: 'Local Testnet',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Local Explorer',
      url: process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'http://localhost:8080',
    },
  },
};

export const config = createConfig({
  chains: [localTestnet, hardhat, mainnet],
  transports: {
    [localTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'),
    [hardhat.id]: http('http://localhost:8545'),
    [mainnet.id]: http(),
  },
  ssr: false,
});

export { localTestnet };