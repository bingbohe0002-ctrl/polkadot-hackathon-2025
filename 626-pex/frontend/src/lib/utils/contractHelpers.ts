/**
 * Contract Helper Utilities
 * Provides utility functions for contract interactions, data formatting, and error handling
 */

// Price and amount formatting utilities
export function formatPrice(price: bigint | string, decimals: number = 18): string {
  const priceStr = typeof price === 'bigint' ? price.toString() : price;
  const priceNum = Number(priceStr) / Math.pow(10, decimals);
  
  if (priceNum >= 1000000) {
    return (priceNum / 1000000).toFixed(2) + 'M';
  } else if (priceNum >= 1000) {
    return (priceNum / 1000).toFixed(2) + 'K';
  } else if (priceNum >= 1) {
    return priceNum.toFixed(2);
  } else {
    return priceNum.toFixed(6);
  }
}

export function formatAmount(amount: bigint | string, decimals: number = 18): string {
  const amountStr = typeof amount === 'bigint' ? amount.toString() : amount;
  const amountNum = Number(amountStr) / Math.pow(10, decimals);
  
  if (amountNum >= 1000000) {
    return (amountNum / 1000000).toFixed(3) + 'M';
  } else if (amountNum >= 1000) {
    return (amountNum / 1000).toFixed(3) + 'K';
  } else {
    return amountNum.toFixed(6);
  }
}

export function formatPercentage(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return (num * 100).toFixed(2) + '%';
}

export function formatPnL(pnl: bigint | string, decimals: number = 18): {
  value: string;
  formatted: string;
  isPositive: boolean;
} {
  const pnlStr = typeof pnl === 'bigint' ? pnl.toString() : pnl;
  const pnlNum = Number(pnlStr) / Math.pow(10, decimals);
  const isPositive = pnlNum >= 0;
  
  return {
    value: pnlNum.toFixed(2),
    formatted: (isPositive ? '+' : '') + '$' + Math.abs(pnlNum).toFixed(2),
    isPositive,
  };
}

// Market data utilities
export function calculateSpread(bestBid: string, bestAsk: string): {
  absolute: string;
  percentage: string;
} {
  const bid = parseFloat(bestBid);
  const ask = parseFloat(bestAsk);
  
  if (bid === 0 || ask === 0) {
    return { absolute: '0', percentage: '0' };
  }
  
  const absolute = (ask - bid).toFixed(2);
  const percentage = ((ask - bid) / ((ask + bid) / 2) * 100).toFixed(3);
  
  return { absolute, percentage };
}

export function calculateMarkPrice(indexPrice: bigint, fundingRate: bigint): bigint {
  // Simplified mark price calculation
  // In reality, this would involve more complex premium/discount calculations
  const indexPriceNum = Number(indexPrice);
  const fundingRateNum = Number(fundingRate) / 1e18; // Assuming 18 decimals for funding rate
  
  // Apply funding rate impact (simplified)
  const markPriceNum = indexPriceNum * (1 + fundingRateNum * 0.1);
  
  return BigInt(Math.floor(markPriceNum));
}

// Position and risk calculations
export function calculateLiquidationPrice(
  entryPrice: bigint,
  leverage: number,
  side: 'LONG' | 'SHORT',
  maintenanceMarginRate: bigint
): bigint {
  const entryPriceNum = Number(entryPrice);
  const mmRate = Number(maintenanceMarginRate) / 1e18;
  
  let liquidationPrice: number;
  
  if (side === 'LONG') {
    // For long positions: liquidation when price drops
    liquidationPrice = entryPriceNum * (1 - (1 / leverage) + mmRate);
  } else {
    // For short positions: liquidation when price rises
    liquidationPrice = entryPriceNum * (1 + (1 / leverage) - mmRate);
  }
  
  return BigInt(Math.floor(liquidationPrice));
}

export function calculateUnrealizedPnL(
  entryPrice: bigint,
  markPrice: bigint,
  size: bigint,
  side: 'LONG' | 'SHORT'
): bigint {
  const entryPriceNum = Number(entryPrice);
  const markPriceNum = Number(markPrice);
  const sizeNum = Number(size) / 1e18; // Assuming 18 decimals for size
  
  let pnl: number;
  
  if (side === 'LONG') {
    pnl = (markPriceNum - entryPriceNum) * sizeNum;
  } else {
    pnl = (entryPriceNum - markPriceNum) * sizeNum;
  }
  
  return BigInt(Math.floor(pnl * 1e18)); // Convert back to wei
}

export function calculateMarginRatio(
  totalCollateral: bigint,
  usedMargin: bigint,
  unrealizedPnL: bigint
): number {
  const totalCollateralNum = Number(totalCollateral) / 1e18;
  const usedMarginNum = Number(usedMargin) / 1e18;
  const pnlNum = Number(unrealizedPnL) / 1e18;
  
  const netCollateral = totalCollateralNum + pnlNum;
  
  if (usedMarginNum === 0) return Infinity;
  
  return netCollateral / usedMarginNum;
}

// Order utilities
export function validateOrderParams(params: {
  market: string;
  side: 'BUY' | 'SELL';
  size: string;
  price?: string;
  orderType: 'LIMIT' | 'MARKET';
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!params.market) {
    errors.push('Market is required');
  }
  
  if (!params.side || !['BUY', 'SELL'].includes(params.side)) {
    errors.push('Valid side (BUY/SELL) is required');
  }
  
  if (!params.size || parseFloat(params.size) <= 0) {
    errors.push('Size must be greater than 0');
  }
  
  if (params.orderType === 'LIMIT' && (!params.price || parseFloat(params.price) <= 0)) {
    errors.push('Price is required for limit orders and must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculateOrderValue(size: string, price: string): string {
  const sizeNum = parseFloat(size);
  const priceNum = parseFloat(price);
  
  if (isNaN(sizeNum) || isNaN(priceNum)) return '0';
  
  return (sizeNum * priceNum).toFixed(2);
}

export function calculateTradingFee(
  orderValue: string,
  feeRate: number = 0.001 // 0.1% default
): string {
  const value = parseFloat(orderValue);
  if (isNaN(value)) return '0';
  
  return (value * feeRate).toFixed(6);
}

// Error handling utilities
export function parseContractError(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle different error types
  if (error.reason) {
    return error.reason;
  }
  
  if (error.message) {
    // Parse common error patterns
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for this transaction';
    }
    
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    
    if (error.message.includes('gas')) {
      return 'Transaction failed due to gas issues';
    }
    
    if (error.message.includes('revert')) {
      // Extract revert reason if available
      const revertMatch = error.message.match(/revert (.+)/);
      if (revertMatch) {
        return revertMatch[1];
      }
      return 'Transaction was reverted';
    }
    
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

// Time utilities
export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * (timestamp.toString().length === 10 ? 1000 : 1));
  return date.toLocaleString();
}

export function getTimeUntil(futureTimestamp: bigint | number): string {
  const now = Date.now();
  const future = Number(futureTimestamp) * (futureTimestamp.toString().length === 10 ? 1000 : 1);
  const diff = future - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Market status utilities
export function getMarketStatus(market: {
  isActive: boolean;
  lastUpdateTime: bigint;
}): 'ACTIVE' | 'INACTIVE' | 'STALE' {
  if (!market.isActive) return 'INACTIVE';
  
  const now = Date.now();
  const lastUpdate = Number(market.lastUpdateTime);
  const timeDiff = now - lastUpdate;
  
  // Consider data stale if older than 5 minutes
  if (timeDiff > 5 * 60 * 1000) return 'STALE';
  
  return 'ACTIVE';
}

// Conversion utilities
export function weiToEther(wei: bigint): string {
  return (Number(wei) / 1e18).toString();
}

export function etherToWei(ether: string): bigint {
  return BigInt(Math.floor(parseFloat(ether) * 1e18));
}

export function bpsToPercentage(bps: bigint): string {
  return (Number(bps) / 100).toFixed(2) + '%';
}

export function percentageToBps(percentage: string): bigint {
  return BigInt(Math.floor(parseFloat(percentage) * 100));
}