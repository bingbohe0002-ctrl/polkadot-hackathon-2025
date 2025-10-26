/**
 * Ethers.js Helper Functions and Examples
 * Provides examples and utilities for interacting with smart contracts using ethers.js
 */

import { ethers } from 'ethers';
import { OrderBookABI, PerpMarketABI, MarginVaultABI, ERC20ABI, OracleAdapterABI, SpotMarketABI, SpotOrderBookABI, TokenListingGovernorABI } from '@/lib/contracts/abi';
import { getContractAddresses } from '@/lib/contracts/addresses';

// Provider setup
export function getProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  const defaultRpcUrl = 'http://127.0.0.1:8545';
  const url = (rpcUrl || defaultRpcUrl).trim().replace('localhost', '127.0.0.1');
  return new ethers.JsonRpcProvider(url);
}

export function getSigner(privateKey: string, provider: ethers.JsonRpcProvider): ethers.Wallet {
  return new ethers.Wallet(privateKey, provider);
}

// Contract instances
export function getOrderBookContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const addresses = getContractAddresses(chainId);
  return new ethers.Contract(addresses.orderBook, OrderBookABI, signerOrProvider);
}

export function getPerpMarketContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const addresses = getContractAddresses(chainId);
  return new ethers.Contract(addresses.perpMarket, PerpMarketABI, signerOrProvider);
}

export function getMarginVaultContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const addresses = getContractAddresses(chainId);
  return new ethers.Contract(addresses.marginVault, MarginVaultABI, signerOrProvider);
}

export function getSpotMarketContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const addresses = getContractAddresses(chainId);
  if (!addresses.spotMarket) throw new Error('SpotMarket address not configured');
  return new ethers.Contract(addresses.spotMarket, SpotMarketABI, signerOrProvider);
}

export function getSpotOrderBookContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const addresses = getContractAddresses(chainId);
  if (!addresses.spotOrderBook) throw new Error('SpotOrderBook address not configured');
  return new ethers.Contract(addresses.spotOrderBook, SpotOrderBookABI, signerOrProvider);
}

export function getListingGovernorContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const addresses = getContractAddresses(chainId);
  const zero = '0x0000000000000000000000000000000000000000';
  if (!addresses.listingGovernor || addresses.listingGovernor.toLowerCase() === zero) {
    throw new Error('ListingGovernor address not configured');
  }
  return new ethers.Contract(addresses.listingGovernor, TokenListingGovernorABI, signerOrProvider);
}

export function getERC20Contract(
  tokenAddress: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(tokenAddress, ERC20ABI, signerOrProvider);
}

export function getOracleAdapterContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  const addresses = getContractAddresses(chainId);
  return new ethers.Contract(addresses.oracleAdapter, OracleAdapterABI, signerOrProvider);
}

// OrderBook Examples
export class OrderBookService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(chainId: number, signer: ethers.Signer) {
    this.contract = getOrderBookContract(chainId, signer);
    this.signer = signer;
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    marketId: number | bigint,
    side: 'BUY' | 'SELL',
    size: string,
    price: string,
    leverage: number
  ): Promise<ethers.ContractTransactionResponse> {
    const marketIdBN = BigInt(marketId);
    const orderType = 0; // LIMIT
    const orderSide = side === 'BUY' ? 0 : 1;
    const sizeWei = ethers.parseEther(size);
    const priceWei = ethers.parseEther(price);

    const tx = await this.contract.placeOrder(
      marketIdBN,
      orderType,
      orderSide,
      sizeWei,
      priceWei,
      leverage
    );

    console.log('Limit order placed:', tx.hash);
    return tx;
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(
    marketId: number | bigint,
    side: 'BUY' | 'SELL',
    size: string,
    leverage: number
  ): Promise<ethers.ContractTransactionResponse> {
    const marketIdBN = BigInt(marketId);
    const orderType = 1; // MARKET
    const orderSide = side === 'BUY' ? 0 : 1;
    const sizeWei = ethers.parseEther(size);

    const tx = await this.contract.placeOrder(
      marketIdBN,
      orderType,
      orderSide,
      sizeWei,
      0, // No price for market orders
      leverage
    );

    console.log('Market order placed:', tx.hash);
    return tx;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<ethers.ContractTransactionResponse> {
    const idBN = BigInt(orderId);
    const tx = await this.contract.cancelOrder(idBN);
    console.log('Order cancelled:', tx.hash);
    return tx;
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    const idBN = BigInt(orderId);
    const order = await this.contract.getOrder(idBN);
    return {
      id: order[0],
      trader: order[1],
      marketId: Number(order[2]),
      orderType: order[3] === 0 ? 'LIMIT' : 'MARKET',
      side: order[4] === 0 ? 'BUY' : 'SELL',
      size: ethers.formatEther(order[5]),
      price: ethers.formatEther(order[6]),
      filledSize: ethers.formatEther(order[7]),
      timestamp: Number(order[8]),
      status: ['PENDING', 'PARTIAL', 'FILLED', 'CANCELLED'][order[9]],
      leverage: Number(order[10]),
    };
  }

  /**
   * Get order book for a market
   */
  async getOrderBook(marketId: number | bigint, depth: number = 10): Promise<{
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
  }> {
    const marketIdBN = BigInt(marketId);
    const orderBook = await this.contract.getOrderBook(marketIdBN, BigInt(depth));
    
    return {
      bids: (orderBook[0] as Array<{ price: bigint; totalSize: bigint; orderCount: bigint }>).map((level) => [
        ethers.formatEther(level.price),
        ethers.formatEther(level.totalSize),
      ]),
      asks: (orderBook[1] as Array<{ price: bigint; totalSize: bigint; orderCount: bigint }>).map((level) => [
        ethers.formatEther(level.price),
        ethers.formatEther(level.totalSize),
      ]),
    };
  }

  /**
   * Listen to order events
   */
  setupEventListeners(): void {
    // Order Placed Event
    this.contract.on('OrderPlaced', (orderId, trader, marketId, orderType, side, size, price, leverage, event) => {
      console.log('Order Placed:', {
        orderId,
        trader,
        marketId,
        orderType: orderType === 0 ? 'LIMIT' : 'MARKET',
        side: side === 0 ? 'BUY' : 'SELL',
        size: ethers.formatEther(size),
        price: ethers.formatEther(price),
        leverage: Number(leverage),
        blockNumber: event.log.blockNumber,
      });
    });

    // Order Filled Event
    this.contract.on('OrderFilled', (orderId, trader, marketId, filledSize, fillPrice, timestamp, event) => {
      console.log('Order Filled:', {
        orderId,
        trader,
        marketId,
        filledSize: ethers.formatEther(filledSize),
        fillPrice: ethers.formatEther(fillPrice),
        timestamp: Number(timestamp),
        blockNumber: event.log.blockNumber,
      });
    });

    // Order Cancelled Event
    this.contract.on('OrderCancelled', (orderId, trader, marketId, event) => {
      console.log('Order Cancelled:', {
        orderId,
        trader,
        marketId,
        blockNumber: event.log.blockNumber,
      });
    });
  }
}

// PerpMarket Examples
export class PerpMarketService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(chainId: number, signer: ethers.Signer) {
    this.contract = getPerpMarketContract(chainId, signer);
    this.signer = signer;
  }

  /**
   * Open a position (marketId-based)
   */
  async openPosition(
    marketId: number | bigint,
    side: 'LONG' | 'SHORT',
    size: string,
    leverage: number,
    acceptablePrice?: string
  ): Promise<ethers.ContractTransactionResponse> {
    const marketIdBN = BigInt(marketId);
    const positionSide = side === 'LONG' ? 0 : 1;
    const sizeWei = ethers.parseEther(size);
    const acceptablePriceWei = acceptablePrice ? ethers.parseEther(acceptablePrice) : 0n;

    const tx = await this.contract.openPosition(
      marketIdBN,
      positionSide,
      sizeWei,
      leverage,
      acceptablePriceWei
    );

    console.log('Position opened:', tx.hash);
    return tx;
  }

  /**
   * Close a position
   */
  async closePosition(
    positionId: number | bigint,
    size?: string,
    acceptablePrice?: string
  ): Promise<ethers.ContractTransactionResponse> {
    const positionIdBN = BigInt(positionId);
    const sizeWei = size ? ethers.parseEther(size) : ethers.MaxUint256; // Close entire position if no size specified
    const acceptablePriceWei = acceptablePrice ? ethers.parseEther(acceptablePrice) : 0n;

    const tx = await this.contract.closePosition(positionIdBN, sizeWei, acceptablePriceWei);
    console.log('Position closed:', tx.hash);
    return tx;
  }

  /**
   * Get position details
   */
  async getPosition(trader: string, marketId: number | bigint): Promise<any> {
    // NOTE: Current PerpMarket ABI does not expose getPosition.
    // This method is a placeholder to avoid breaking callers.
    // Implement via dedicated query endpoint or contract view when available.
    throw new Error('getPosition is not available in current PerpMarket ABI');
  }

  /**
   * Get market information
   */
  async getMarketInfo(marketId: number | bigint): Promise<any> {
    const marketIdBN = BigInt(marketId);
    const m = await this.contract.getMarket(marketIdBN);
    return {
      id: Number(m?.id ?? m?.[0]),
      symbol: m?.symbol ?? m?.[1],
      baseAsset: m?.baseAsset ?? m?.[2],
      quoteAsset: m?.quoteAsset ?? m?.[3],
      maxLeverage: Number(m?.maxLeverage ?? m?.[4]),
      minOrderSize: ethers.formatEther(m?.minOrderSize ?? m?.[5]),
      tickSize: ethers.formatEther(m?.tickSize ?? m?.[6]),
      fundingRate: ethers.formatEther(m?.fundingRate ?? m?.[7]),
      lastFundingTime: Number(m?.lastFundingTime ?? m?.[8]),
      openInterest: ethers.formatEther(m?.openInterest ?? m?.[9]),
      isActive: Boolean(m?.isActive ?? m?.[10]),
    };
  }

  /**
   * Setup event listeners for position events
   */
  setupEventListeners(): void {
    // Position Opened Event
    this.contract.on('PositionOpened', (trader, marketId, side, size, entryPrice, leverage, margin, event) => {
      console.log('Position Opened:', {
        trader,
        marketId: Number(marketId),
        side: side === 0 ? 'LONG' : 'SHORT',
        size: ethers.formatEther(size),
        entryPrice: ethers.formatEther(entryPrice),
        leverage: Number(leverage),
        margin: ethers.formatEther(margin),
        blockNumber: event.log.blockNumber,
      });
    });

    // Position Closed Event
    this.contract.on('PositionClosed', (trader, marketId, size, exitPrice, pnl, event) => {
      console.log('Position Closed:', {
        trader,
        marketId: Number(marketId),
        size: ethers.formatEther(size),
        exitPrice: ethers.formatEther(exitPrice),
        pnl: ethers.formatEther(pnl),
        blockNumber: event.log.blockNumber,
      });
    });

    // Funding Payment Event
    this.contract.on('FundingPayment', (trader, marketId, fundingPayment, timestamp, event) => {
      console.log('Funding Payment:', {
        trader,
        marketId: Number(marketId),
        fundingPayment: ethers.formatEther(fundingPayment),
        timestamp: Number(timestamp),
        blockNumber: event.log.blockNumber,
      });
    });
  }
}

// MarginVault Examples
export class MarginVaultService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(chainId: number, signer: ethers.Signer) {
    this.contract = getMarginVaultContract(chainId, signer);
    this.signer = signer;
  }

  /**
   * Deposit collateral
   */
  async deposit(tokenAddress: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const tokenContract = getERC20Contract(tokenAddress, this.signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    const approveTx = await tokenContract.approve(await this.contract.getAddress(), amountWei);
    await approveTx.wait();
    const tx = await this.contract.deposit(tokenAddress, amountWei);
    console.log('Collateral deposited:', tx.hash);
    return tx;
  }

  /**
   * Withdraw collateral
   */
  async withdraw(tokenAddress: string, amount: string): Promise<ethers.ContractTransactionResponse> {
    const tokenContract = getERC20Contract(tokenAddress, this.signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    const tx = await this.contract.withdraw(tokenAddress, amountWei);
    console.log('Collateral withdrawn:', tx.hash);
    return tx;
  }

  /**
   * Get account information
   */
  async getAccount(trader: string): Promise<any> {
    const account = await this.contract.getAccount(trader);
    
    return {
      trader: account[0],
      totalCollateral: ethers.formatEther(account[1]),
      availableCollateral: ethers.formatEther(account[2]),
      usedCollateral: ethers.formatEther(account[3]),
      totalDebt: ethers.formatEther(account[4]),
      healthFactor: ethers.formatEther(account[5]),
      liquidationThreshold: ethers.formatEther(account[6]),
      lastUpdateTime: Number(account[7]),
    };
  }

  /**
   * Get collateral balance for a specific token
   */
  async getCollateralBalance(trader: string, tokenAddress: string): Promise<string> {
    const balance = await this.contract.getCollateralBalance(trader, tokenAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Setup event listeners for vault events
   */
  setupEventListeners(): void {
    // Deposit Event
    this.contract.on('Deposit', (trader, token, amount, event) => {
      console.log('Deposit:', {
        trader,
        token,
        amount: ethers.formatEther(amount),
        blockNumber: event.log.blockNumber,
      });
    });

    // Withdraw Event
    this.contract.on('Withdraw', (trader, token, amount, event) => {
      console.log('Withdraw:', {
        trader,
        token,
        amount: ethers.formatEther(amount),
        blockNumber: event.log.blockNumber,
      });
    });

    // Liquidation Event
    this.contract.on('Liquidation', (trader, liquidator, collateralSeized, debtRepaid, event) => {
      console.log('Liquidation:', {
        trader,
        liquidator,
        collateralSeized: ethers.formatEther(collateralSeized),
        debtRepaid: ethers.formatEther(debtRepaid),
        blockNumber: event.log.blockNumber,
      });
    });
  }
}

// Utility functions for common operations
export class TradingUtils {
  private orderBookService: OrderBookService;
  private perpMarketService: PerpMarketService;
  private marginVaultService: MarginVaultService;
  private chainId: number;
  private signer: ethers.Signer;

  constructor(chainId: number, signer: ethers.Signer) {
    this.orderBookService = new OrderBookService(chainId, signer);
    this.perpMarketService = new PerpMarketService(chainId, signer);
    this.marginVaultService = new MarginVaultService(chainId, signer);
    this.chainId = chainId;
    this.signer = signer;
  }

  /**
   * Complete trading workflow: deposit, place order, monitor position
   */
  async executeTrade(params: {
    collateralToken: string;
    collateralAmount: string;
    market: string;
    side: 'BUY' | 'SELL';
    size: string;
    price?: string;
    leverage: number;
    orderType: 'LIMIT' | 'MARKET';
  }): Promise<void> {
    try {
      // 1. Deposit collateral
      console.log('Depositing collateral...');
      const depositTx = await this.marginVaultService.deposit(
        params.collateralToken,
        params.collateralAmount
      );
      await depositTx.wait();

      // 2. Place order
      console.log('Placing order...');
      // Resolve marketId from symbol
      const marketId = await this.resolveMarketId(params.market);
      let orderTx;
      if (params.orderType === 'LIMIT' && params.price) {
        orderTx = await this.orderBookService.placeLimitOrder(
          marketId,
          params.side,
          params.size,
          params.price,
          params.leverage
        );
      } else {
        orderTx = await this.orderBookService.placeMarketOrder(
          marketId,
          params.side,
          params.size,
          params.leverage
        );
      }
      await orderTx.wait();

      console.log('Trade executed successfully!');
    } catch (error) {
      console.error('Trade execution failed:', error);
      throw error;
    }
  }

  private async resolveMarketId(symbol: string): Promise<bigint> {
    const contract = getPerpMarketContract(this.chainId, this.signer);
    const markets: Array<{ id: bigint; symbol: string } & Record<string, any>> = await contract.getAllMarkets();
    const m = markets.find((mm) => mm.symbol === symbol);
    if (!m) throw new Error(`Unknown market symbol: ${symbol}`);
    return BigInt(m.id);
  }

  /**
   * Monitor account health and positions
   */
  async monitorAccount(trader: string): Promise<{
    account: any;
    positions: any[];
    healthStatus: 'HEALTHY' | 'WARNING' | 'DANGER';
  }> {
    const account = await this.marginVaultService.getAccount(trader);
    const healthFactor = parseFloat(account.healthFactor);
    
    let healthStatus: 'HEALTHY' | 'WARNING' | 'DANGER';
    if (healthFactor > 2.0) {
      healthStatus = 'HEALTHY';
    } else if (healthFactor > 1.2) {
      healthStatus = 'WARNING';
    } else {
      healthStatus = 'DANGER';
    }

    // Positions query is not available via current ABI; return empty list.
    const positions: any[] = [];

    return {
      account,
      positions,
      healthStatus,
    };
  }
}

// Example usage function
export async function exampleUsage(): Promise<void> {
  // Setup
  const provider = getProvider('http://127.0.0.1:8545');
  const privateKey = '0x' + '0'.repeat(64); // Replace with actual private key
  const signer = getSigner(privateKey, provider);
  const chainId = 31337; // Local network

  // Initialize services
  const tradingUtils = new TradingUtils(chainId, signer);

  try {
    // Execute a sample trade
    await tradingUtils.executeTrade({
      collateralToken: '0x...', // USDC address
      collateralAmount: '1000', // $1000 USDC
      market: 'BTC-USD',
      side: 'BUY',
      size: '0.1', // 0.1 BTC
      price: '45000', // $45,000
      leverage: 10,
      orderType: 'LIMIT',
    });

    // Monitor account
    const traderAddress = await signer.getAddress();
    const accountStatus = await tradingUtils.monitorAccount(traderAddress);
    console.log('Account Status:', accountStatus);

  } catch (error) {
    console.error('Example execution failed:', error);
  }
}