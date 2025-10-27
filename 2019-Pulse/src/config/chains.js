import { http } from 'viem';

// Polkadot Hub TestNet configuration
export const polkadotHubTestnet = {
  id: 420420422,
  name: 'Polkadot Hub TestNet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'PAS',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    },
  },
  testnet: true,
};

export const transport = http('https://testnet-passet-hub-eth-rpc.polkadot.io');

export const chains = [polkadotHubTestnet];

