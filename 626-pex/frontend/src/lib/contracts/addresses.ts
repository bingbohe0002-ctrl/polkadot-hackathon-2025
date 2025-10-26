import { ChainConfig, ContractAddresses } from './types';
import deployed from './deployed.json';
import deployedAH from './deployed-assethub.json';

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: Record<number, {
  orderBook: string;
  perpMarket: string;
  marginVault: string;
  riskEngine: string;
  feeCollector: string;
  governance: string;
  oracleAdapter: string;
  // new modules
  spotMarket?: string;
  spotOrderBook?: string;
  listingGovernor?: string;
  pexToken?: string;
}> = {
  // PolkaVM Testnet
  9999: {
    orderBook: '0x0000000000000000000000000000000000000000',
    perpMarket: '0x0000000000000000000000000000000000000000',
    marginVault: '0x0000000000000000000000000000000000000000',
    riskEngine: '0x0000000000000000000000000000000000000000',
    feeCollector: '0x0000000000000000000000000000000000000000',
    governance: '0x0000000000000000000000000000000000000000',
    oracleAdapter: '0x0000000000000000000000000000000000000000',
    spotMarket: '0x0000000000000000000000000000000000000000',
    spotOrderBook: '0x0000000000000000000000000000000000000000',
    listingGovernor: '0x0000000000000000000000000000000000000000',
    pexToken: '0x0000000000000000000000000000000000000000',
  },
  // Hardhat Localhost
  31337: {
    // Fallback to common Hardhat local addresses if env not provided
    // These match deployments/localhost/*.json in this repo
    orderBook: process.env.NEXT_PUBLIC_ORDERBOOK_ADDRESS || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    perpMarket: process.env.NEXT_PUBLIC_PERPMARKET_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    marginVault: process.env.NEXT_PUBLIC_MARGINVAULT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    riskEngine: process.env.NEXT_PUBLIC_RISKENGINE_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    feeCollector: process.env.NEXT_PUBLIC_FEECOLLECTOR_ADDRESS || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    governance: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || '0x0000000000000000000000000000000000000000',
    oracleAdapter: process.env.NEXT_PUBLIC_ORACLEADAPTER_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    spotMarket: process.env.NEXT_PUBLIC_SPOTMARKET_ADDRESS || (deployed.contracts?.spotMarket ?? '0x0000000000000000000000000000000000000000'),
    spotOrderBook: process.env.NEXT_PUBLIC_SPOTORDERBOOK_ADDRESS || (deployed.contracts?.spotOrderBook ?? '0x0000000000000000000000000000000000000000'),
    listingGovernor: process.env.NEXT_PUBLIC_TOKENLISTING_GOVERNOR_ADDRESS || process.env.NEXT_PUBLIC_LISTINGGOVERNOR_ADDRESS || (deployed.contracts?.tokenListingGovernor ?? '0x0000000000000000000000000000000000000000'),
    pexToken: process.env.NEXT_PUBLIC_PEX_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
  // AssetHub Testnet
  420420422: {
    orderBook: deployedAH.contracts?.OrderBook || '0x0000000000000000000000000000000000000000',
    perpMarket: deployedAH.contracts?.PerpMarket || '0x0000000000000000000000000000000000000000',
    marginVault: deployedAH.contracts?.MarginVault || '0x0000000000000000000000000000000000000000',
    riskEngine: '0x0000000000000000000000000000000000000000',
    feeCollector: '0x0000000000000000000000000000000000000000',
    governance: '0x0000000000000000000000000000000000000000',
    oracleAdapter: deployedAH.contracts?.OracleAdapter || '0x0000000000000000000000000000000000000000',
    // new modules on AssetHub
    spotMarket: deployedAH.contracts?.SpotMarket || '0x0000000000000000000000000000000000000000',
    spotOrderBook: deployedAH.contracts?.SpotOrderBook || '0x0000000000000000000000000000000000000000',
    listingGovernor: deployedAH.contracts?.TokenListingGovernor || '0x0000000000000000000000000000000000000000',
    pexToken: '0x0000000000000000000000000000000000000000',
  },
};

// Supported token addresses for each network
export const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  // PolkaVM Testnet
  9999: {
    USDC: '0xA0b86a33E6441b8435b662763C0f801b5f7B6C01',
    USDT: '0xB1c86a33E6441b8435b662763C0f801b5f7B6C02',
    WETH: '0xC2d86a33E6441b8435b662763C0f801b5f7B6C03',
    PEX: '0x0000000000000000000000000000000000000000',
    BTC: '0x0000000000000000000000000000000000000000',
  },
  31337: {
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || (deployed.tokens?.usdc ?? '0x0000000000000000000000000000000000000000'),
    USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x0000000000000000000000000000000000000000',
    WETH: process.env.NEXT_PUBLIC_WETH_ADDRESS || (deployed.tokens?.weth ?? '0x0000000000000000000000000000000000000000'),
    PEX: process.env.NEXT_PUBLIC_PEX_ADDRESS || (deployed.tokens?.pex ?? '0x0000000000000000000000000000000000000000'),
    BTC: process.env.NEXT_PUBLIC_BTC_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
  420420422: {
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || (deployedAH.tokens?.USDC ?? '0x0000000000000000000000000000000000000000'),
    USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xF709b6038335E303eA7597bc19887E29508F3be8',
    BTC: process.env.NEXT_PUBLIC_BTC_ADDRESS || (deployedAH.tokens?.BTC ?? '0x0000000000000000000000000000000000000000'),
  },
};

// getContractAddresses moved to helper section below with DEFAULT_CHAIN_ID fallback

// Chain configurations
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // PolkaVM Testnet
  9999: {
    chainId: 9999,
    name: 'PolkaVM Testnet',
    rpcUrl: 'https://rpc.polkavm-testnet.io',
    blockExplorer: 'https://explorer.polkavm-testnet.io',
    contracts: CONTRACT_ADDRESSES[9999],
    supportedTokens: ['USDC', 'USDT', 'WETH', 'WBTC'],
    tradingPairs: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD', 'MATIC-USD'],
  },
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    blockExplorer: 'https://etherscan.io',
    contracts: CONTRACT_ADDRESSES[1],
    supportedTokens: ['USDC', 'USDT', 'WETH', 'WBTC'],
    tradingPairs: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD', 'MATIC-USD'],
  },
  // Ethereum Sepolia
  11155111: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://sepolia.etherscan.io',
    contracts: CONTRACT_ADDRESSES[11155111],
    supportedTokens: ['USDC', 'USDT', 'WETH', 'WBTC'],
    tradingPairs: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD', 'MATIC-USD'],
  },
  // Hardhat Localhost
  31337: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: (process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545').replace('localhost', '127.0.0.1'),
    blockExplorer: '',
    contracts: CONTRACT_ADDRESSES[31337],
    supportedTokens: ['USDC'],
    tradingPairs: ['BTC-USD', 'ETH-USD'],
  },
  // AssetHub Testnet
  420420422: {
    chainId: 420420422,
    name: 'Polkadot Hub TestNet',
    rpcUrl: (process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io').replace('localhost', '127.0.0.1'),
    blockExplorer: 'https://blockscout-passet-hub.parity-testnet.parity.io/',
    contracts: CONTRACT_ADDRESSES[420420422],
    supportedTokens: ['USDC', 'BTC'],
    tradingPairs: ['BTC-USD'],
  },
};

// Default chain (PolkaVM Testnet)
export const DEFAULT_CHAIN_ID = 420420422;

// Helper functions
export function getContractAddresses(chainId: number): ContractAddresses {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];
}

export function getTokenAddress(chainId: number, symbol: string): string {
  return TOKEN_ADDRESSES[chainId]?.[symbol] || '';
}

export function getChainConfig(chainId: number): ChainConfig {
  return CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
}

export function getSupportedChainIds(): number[] {
  return Object.keys(CHAIN_CONFIGS).map((key) => parseInt(key, 10));
}

export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}

// Market symbols to bytes32 conversion
export function marketSymbolToBytes32(symbol: string): `0x${string}` {
  // Convert market symbol (e.g., "BTC-USD") to bytes32 format
  const encoder = new TextEncoder();
  const data = encoder.encode(symbol);
  const hex = Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return ('0x' + hex.padEnd(64, '0')) as `0x${string}`;
}

export function bytes32ToMarketSymbol(bytes32: string): string {
  // Convert bytes32 back to market symbol
  const hex = bytes32.slice(2); // Remove '0x' prefix
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substr(i, 2), 16);
    if (byte === 0) break; // Stop at null terminator
    bytes.push(byte);
  }
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

// Trading pair configurations
export const TRADING_PAIRS = {
  'BTC-USD': {
    symbol: 'BTC-USD',
    name: 'Bitcoin / USD',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    minOrderSize: '0.001',
    tickSize: '0.01',
    maxLeverage: 100,
  },
  'ETH-USD': {
    symbol: 'ETH-USD',
    name: 'Ethereum / USD',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    minOrderSize: '0.01',
    tickSize: '0.01',
    maxLeverage: 50,
  },
  'SOL-USD': {
    symbol: 'SOL-USD',
    name: 'Solana / USD',
    baseAsset: 'SOL',
    quoteAsset: 'USD',
    minOrderSize: '0.1',
    tickSize: '0.001',
    maxLeverage: 25,
  },
  'AVAX-USD': {
    symbol: 'AVAX-USD',
    name: 'Avalanche / USD',
    baseAsset: 'AVAX',
    quoteAsset: 'USD',
    minOrderSize: '0.1',
    tickSize: '0.001',
    maxLeverage: 25,
  },
  'MATIC-USD': {
    symbol: 'MATIC-USD',
    name: 'Polygon / USD',
    baseAsset: 'MATIC',
    quoteAsset: 'USD',
    minOrderSize: '1',
    tickSize: '0.0001',
    maxLeverage: 20,
  },
} as const;

export type TradingPairSymbol = keyof typeof TRADING_PAIRS;