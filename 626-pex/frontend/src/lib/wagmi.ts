import { configureChains, createConfig } from 'wagmi';
import { mainnet, goerli, sepolia } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import type { Chain } from 'viem';

// Polkadot Hub TestNet (AssetHub EVM)
const polkadotHubTestnet = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 420420422),
  name: 'Polkadot Hub TestNet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: { decimals: 18, name: 'PAS', symbol: 'PAS' },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io'] },
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://blockscout-passet-hub.parity-testnet.parity.io/' },
  },
  testnet: true,
} as unknown as Chain;

// Define Hardhat local chain (31337)
const hardhatLocal = {
  id: 31337,
  name: 'Hardhat Local',
  network: 'hardhat',
  nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'] },
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'] },
  },
  blockExplorers: { default: { name: 'Local Explorer', url: '' } },
  testnet: true,
} as unknown as Chain;

// Define PolkaVM local chain (420420420)
const polkaVMLocal = {
  id: Number(process.env.NEXT_PUBLIC_POLKAVM_CHAIN_ID || 420420420),
  name: 'PolkaVM Local',
  network: 'polkavm-local',
  nativeCurrency: { decimals: 18, name: 'PEX', symbol: 'PEX' },
  rpcUrls: {
    public: { http: [(process.env.NEXT_PUBLIC_POLKAVM_RPC_URL || 'http://localhost:8545').replace('127.0.0.1', 'localhost')] },
    default: { http: [(process.env.NEXT_PUBLIC_POLKAVM_RPC_URL || 'http://localhost:8545').replace('127.0.0.1', 'localhost')] },
  },
  blockExplorers: { default: { name: 'Local Explorer', url: '' } },
  testnet: true,
} as unknown as Chain;

// Configure chains and providers
const enableLocalhost =
  process.env.NEXT_PUBLIC_ENABLE_LOCALHOST === 'true' ||
  process.env.NODE_ENV === 'development';

// Only enable Alchemy provider when API key is present to avoid 401s
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    polkadotHubTestnet as Chain,
    mainnet,
    goerli,
    sepolia,
    ...(enableLocalhost ? [polkaVMLocal as Chain, hardhatLocal as Chain] : []),
  ],
  [
    ...(alchemyApiKey ? [alchemyProvider({ apiKey: alchemyApiKey })] : []),
    publicProvider(),
  ]
);

// Configure wallets
const { connectors } = getDefaultWallets({
  appName: 'PEX - PolkaVM Perpetual DEX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains,
});

// Create wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };

// Contract addresses (to be updated with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  [polkadotHubTestnet.id]: {
    OrderBook: '0x0000000000000000000000000000000000000000',
    PerpMarket: '0x0000000000000000000000000000000000000000',
    MarginVault: '0x0000000000000000000000000000000000000000',
    RiskEngine: '0x0000000000000000000000000000000000000000',
    FeeCollector: '0x0000000000000000000000000000000000000000',
    Governance: '0x0000000000000000000000000000000000000000',
    OracleAdapter: '0x0000000000000000000000000000000000000000',
  },
  [goerli.id]: {
    OrderBook: '0x0000000000000000000000000000000000000000',
    PerpMarket: '0x0000000000000000000000000000000000000000',
    MarginVault: '0x0000000000000000000000000000000000000000',
    RiskEngine: '0x0000000000000000000000000000000000000000',
    FeeCollector: '0x0000000000000000000000000000000000000000',
    Governance: '0x0000000000000000000000000000000000000000',
    OracleAdapter: '0x0000000000000000000000000000000000000000',
  },
} as const;

// Supported tokens
export const SUPPORTED_TOKENS = {
  [polkadotHubTestnet.id]: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: '/tokens/usdc.svg',
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoURI: '/tokens/usdt.svg',
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logoURI: '/tokens/dai.svg',
    },
  ],
} as const;

// Trading pairs
export const TRADING_PAIRS = {
  [polkadotHubTestnet.id]: [
    {
      id: 1,
      symbol: 'BTC-USD',
      baseAsset: 'BTC',
      quoteAsset: 'USD',
      tickSize: 0.01,
      minOrderSize: 0.001,
      maxLeverage: 100,
      fundingInterval: 8 * 60 * 60, // 8 hours
    },
    {
      id: 2,
      symbol: 'ETH-USD',
      baseAsset: 'ETH',
      quoteAsset: 'USD',
      tickSize: 0.01,
      minOrderSize: 0.01,
      maxLeverage: 50,
      fundingInterval: 8 * 60 * 60,
    },
    {
      id: 3,
      symbol: 'DOT-USD',
      baseAsset: 'DOT',
      quoteAsset: 'USD',
      tickSize: 0.001,
      minOrderSize: 1,
      maxLeverage: 25,
      fundingInterval: 8 * 60 * 60,
    },
  ],
} as const;