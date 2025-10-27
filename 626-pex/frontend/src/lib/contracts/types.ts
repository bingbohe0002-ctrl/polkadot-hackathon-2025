// Contract Types and Interfaces
export interface OrderBookOrder {
  id: string;
  trader: string;
  market: string;
  orderType: 'LIMIT' | 'MARKET';
  side: 'BUY' | 'SELL';
  size: bigint;
  price: bigint;
  filledSize: bigint;
  leverage: number;
  status: 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';
  timestamp: bigint;
}

export interface Position {
  // UI helper identifier
  id?: string;
  // address of trader
  trader: `0x${string}` | string;
  // market symbol encoded as bytes32
  market: `0x${string}` | string;
  side: 'LONG' | 'SHORT';
  size: bigint;
  entryPrice: bigint;
  markPrice: bigint;
  liquidationPrice: bigint;
  leverage: number;
  margin: bigint;
  unrealizedPnl: bigint;
  // optional funding fields
  fundingPayment?: bigint;
  lastFundingIndex?: bigint;
  // timeline and status
  timestamp?: bigint;
  status?: 'OPEN' | 'CLOSED';
}

export interface Market {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  indexPrice: bigint;
  markPrice: bigint;
  fundingRate: bigint;
  nextFundingTime: bigint;
  openInterest: bigint;
  maxLeverage: number;
  minOrderSize?: bigint;
  tickSize?: bigint;
  isActive: boolean;
  maintenanceMarginRate?: bigint;
  lastUpdateTime?: bigint;
}

export interface Account {
  // primary fields used by UI hooks
  trader: `0x${string}` | string;
  totalCollateral: bigint;
  availableCollateral: bigint;
  usedCollateral: bigint;
  totalDebt: bigint;
  healthFactor: bigint;
  liquidationThreshold: bigint;
  lastUpdateTime?: bigint;
  // optional legacy fields for compatibility
  owner?: string;
  marginMode?: 'ISOLATED' | 'CROSS';
  totalBalance?: bigint;
  marginUsed?: bigint;
  unrealizedPnl?: bigint;
  maintenanceMargin?: bigint;
  marginRatio?: bigint;
}

export interface CollateralInfo {
  token: `0x${string}` | string;
  balance: bigint;
  value?: bigint;
  collateralFactor?: bigint;
  liquidationThreshold?: bigint;
  isActive: boolean;
  lastPriceUpdate?: bigint;
  // optional legacy fields
  weight?: number;
  maxDeposit?: bigint;
}

export interface RiskParameters {
  initialMarginRatio: bigint;
  maintenanceMarginRatio: bigint;
  liquidationFeeRatio: bigint;
  maxLeverage: number;
  maxPositionSize: bigint;
  fundingRateClamp: bigint;
}

export interface LiquidationInfo {
  trader: `0x${string}` | string;
  market: `0x${string}` | string;
  liquidationPrice: bigint;
  maintenanceMargin?: bigint;
  marginRatio: bigint;
  isLiquidatable?: boolean;
  timeToLiquidation?: bigint;
}

// Contract Event Types
export interface OrderPlacedEvent {
  orderId: string;
  trader: string;
  market: string;
  orderType: number;
  side: number;
  size: bigint;
  price: bigint;
  leverage: number;
}

export interface OrderFilledEvent {
  orderId: string;
  trader: string;
  market: string;
  side: number;
  size: bigint;
  price: bigint;
  fee: bigint;
}

export interface PositionOpenedEvent {
  trader: string;
  market: string;
  side: number;
  size: bigint;
  entryPrice: bigint;
  margin: bigint;
}

export interface PositionClosedEvent {
  trader: string;
  market: string;
  side: number;
  size: bigint;
  exitPrice: bigint;
  pnl: bigint;
}

export interface LiquidationEvent {
  trader: string;
  market: string;
  liquidator: string;
  size: bigint;
  liquidationPrice: bigint;
  fee: bigint;
}

// Transaction Types
export interface PlaceOrderParams {
  market: string;
  orderType: 'LIMIT' | 'MARKET';
  side: 'BUY' | 'SELL';
  size: string;
  price?: string;
  leverage: number;
  // optional marketId for direct contract calls when available
  marketId?: number | bigint;
}

export interface CancelOrderParams {
  orderId: string;
}

export interface ClosePositionParams {
  market: string;
  size?: string; // If not provided, closes entire position
}

// Perp open position params used by hooks
export interface OpenPositionParams {
  market: string;
  side: 'LONG' | 'SHORT';
  size: string; // in base asset
  leverage: number;
  margin: string; // in quote asset
}

export interface DepositParams {
  token: string;
  amount: string;
}

export interface WithdrawParams {
  token: string;
  amount: string;
}

// Contract Addresses
export interface ContractAddresses {
  orderBook: string;
  perpMarket: string;
  marginVault: string;
  riskEngine: string;
  feeCollector: string;
  governance: string;
  oracleAdapter: string;
  // spot & governance modules
  spotMarket?: string;
  spotOrderBook?: string;
  listingGovernor?: string;
  pexToken?: string;
}

// Chain Configuration
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  contracts: ContractAddresses;
  supportedTokens: string[];
  tradingPairs: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface OrderBookData {
  market: string;
  bids: Array<[string, string]>; // [price, size]
  asks: Array<[string, string]>; // [price, size]
  timestamp: number;
}

export interface TradeData {
  id: string;
  market: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface CandleData {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// WebSocket Message Types
export interface WSMessage {
  type: 'orderbook' | 'trades' | 'positions' | 'orders' | 'account';
  data: any;
  timestamp: number;
}

export interface WSOrderBookUpdate {
  market: string;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
}

export interface WSTradeUpdate {
  market: string;
  trades: TradeData[];
}

export interface WSPositionUpdate {
  positions: Position[];
}

export interface WSOrderUpdate {
  orders: OrderBookOrder[];
}

export interface WSAccountUpdate {
  account: Account;
}