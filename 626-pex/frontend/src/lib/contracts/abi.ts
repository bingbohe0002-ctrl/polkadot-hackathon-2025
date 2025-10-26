// Contract ABIs
export const OrderBookABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "orderId", "type": "uint256" },
      { "indexed": true, "name": "trader", "type": "address" },
      { "indexed": true, "name": "marketId", "type": "uint256" },
      { "indexed": false, "name": "orderType", "type": "uint8" },
      { "indexed": false, "name": "side", "type": "uint8" },
      { "indexed": false, "name": "size", "type": "uint256" },
      { "indexed": false, "name": "price", "type": "uint256" },
      { "indexed": false, "name": "leverage", "type": "uint256" }
    ],
    "name": "OrderPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "orderId", "type": "uint256" },
      { "indexed": true, "name": "trader", "type": "address" },
      { "indexed": true, "name": "marketId", "type": "uint256" },
      { "indexed": false, "name": "filledSize", "type": "uint256" },
      { "indexed": false, "name": "fillPrice", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "OrderFilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "orderId", "type": "uint256" },
      { "indexed": true, "name": "trader", "type": "address" },
      { "indexed": true, "name": "marketId", "type": "uint256" }
    ],
    "name": "OrderCancelled",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      { "name": "marketId", "type": "uint256" },
      { "name": "orderType", "type": "uint8" },
      { "name": "side", "type": "uint8" },
      { "name": "size", "type": "uint256" },
      { "name": "price", "type": "uint256" },
      { "name": "leverage", "type": "uint256" }
    ],
    "name": "placeOrder",
    "outputs": [{ "name": "orderId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "orderId", "type": "uint256" }],
    "name": "cancelOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "orderId", "type": "uint256" }],
    "name": "getOrder",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "trader", "type": "address" },
          { "name": "marketId", "type": "uint256" },
          { "name": "orderType", "type": "uint8" },
          { "name": "side", "type": "uint8" },
          { "name": "size", "type": "uint256" },
          { "name": "price", "type": "uint256" },
          { "name": "filledSize", "type": "uint256" },
          { "name": "timestamp", "type": "uint256" },
          { "name": "status", "type": "uint8" },
          { "name": "leverage", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "trader", "type": "address" }],
    "name": "getOrdersByTrader",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "marketId", "type": "uint256" },
      { "name": "depth", "type": "uint256" }
    ],
    "name": "getOrderBook",
    "outputs": [
      {
        "components": [
          { "name": "price", "type": "uint256" },
          { "name": "totalSize", "type": "uint256" },
          { "name": "orderCount", "type": "uint256" }
        ],
        "internalType": "tuple[]",
        "name": "bids",
        "type": "tuple[]"
      },
      {
        "components": [
          { "name": "price", "type": "uint256" },
          { "name": "totalSize", "type": "uint256" },
          { "name": "orderCount", "type": "uint256" }
        ],
        "internalType": "tuple[]",
        "name": "asks",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const PerpMarketABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "trader", "type": "address" },
      { "indexed": true, "name": "marketId", "type": "uint256" },
      { "indexed": false, "name": "side", "type": "uint8" },
      { "indexed": false, "name": "size", "type": "uint256" },
      { "indexed": false, "name": "entryPrice", "type": "uint256" },
      { "indexed": false, "name": "leverage", "type": "uint256" },
      { "indexed": false, "name": "margin", "type": "uint256" }
    ],
    "name": "PositionOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "trader", "type": "address" },
      { "indexed": true, "name": "marketId", "type": "uint256" },
      { "indexed": false, "name": "size", "type": "uint256" },
      { "indexed": false, "name": "exitPrice", "type": "uint256" },
      { "indexed": false, "name": "pnl", "type": "int256" }
    ],
    "name": "PositionClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "trader", "type": "address" },
      { "indexed": true, "name": "marketId", "type": "uint256" },
      { "indexed": false, "name": "fundingPayment", "type": "int256" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "FundingPayment",
    "type": "event"
  },
  // Functions (subset used by frontend)
  {
    "inputs": [],
    "name": "getAllMarkets",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "symbol", "type": "string" },
          { "name": "baseAsset", "type": "string" },
          { "name": "quoteAsset", "type": "string" },
          { "name": "maxLeverage", "type": "uint256" },
          { "name": "minOrderSize", "type": "uint256" },
          { "name": "tickSize", "type": "uint256" },
          { "name": "fundingRate", "type": "uint256" },
          { "name": "lastFundingTime", "type": "uint256" },
          { "name": "openInterest", "type": "uint256" },
          { "name": "isActive", "type": "bool" }
        ],
        "name": "markets_",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // View: get positions by trader
  {
    "inputs": [
      { "name": "trader", "type": "address" }
    ],
    "name": "getPositionsByTrader",
    "outputs": [ { "name": "", "type": "uint256[]" } ],
    "stateMutability": "view",
    "type": "function"
  },
  // View: get position detail by id
  {
    "inputs": [
      { "name": "positionId", "type": "uint256" }
    ],
    "name": "getPosition",
    "outputs": [
      {
        "components": [
          { "name": "trader", "type": "address" },
          { "name": "marketId", "type": "uint256" },
          { "name": "side", "type": "uint8" },
          { "name": "size", "type": "uint256" },
          { "name": "entryPrice", "type": "uint256" },
          { "name": "leverage", "type": "uint256" },
          { "name": "margin", "type": "uint256" },
          { "name": "unrealizedPnl", "type": "int256" },
          { "name": "lastFundingPayment", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "marketId", "type": "uint256" }
    ],
    "name": "getMarket",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "symbol", "type": "string" },
          { "name": "baseAsset", "type": "string" },
          { "name": "quoteAsset", "type": "string" },
          { "name": "maxLeverage", "type": "uint256" },
          { "name": "minOrderSize", "type": "uint256" },
          { "name": "tickSize", "type": "uint256" },
          { "name": "fundingRate", "type": "uint256" },
          { "name": "lastFundingTime", "type": "uint256" },
          { "name": "openInterest", "type": "uint256" },
          { "name": "isActive", "type": "bool" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "marketId", "type": "uint256" },
      { "name": "side", "type": "uint8" },
      { "name": "size", "type": "uint256" },
      { "name": "leverage", "type": "uint256" },
      { "name": "acceptablePrice", "type": "uint256" }
    ],
    "name": "openPosition",
    "outputs": [ { "name": "positionId", "type": "uint256" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "positionId", "type": "uint256" },
      { "name": "size", "type": "uint256" },
      { "name": "acceptablePrice", "type": "uint256" }
    ],
    "name": "closePosition",
    "outputs": [ { "name": "pnl", "type": "int256" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const MarginVaultABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": true, "name": "token", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": true, "name": "token", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Withdraw",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      {"name": "token", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "token", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getAccountInfo",
    "outputs": [
      {
        "components": [
          {"name": "marginMode", "type": "uint8"},
          {"name": "totalCollateral", "type": "uint256"},
          {"name": "totalMargin", "type": "uint256"},
          {"name": "availableBalance", "type": "uint256"},
          {"name": "unrealizedPnl", "type": "int256"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "user", "type": "address"},
      {"name": "token", "type": "address"}
    ],
    "name": "getBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const RiskEngineABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "trader", "type": "address"},
      {"indexed": true, "name": "market", "type": "bytes32"},
      {"indexed": true, "name": "liquidator", "type": "address"},
      {"indexed": false, "name": "size", "type": "uint256"},
      {"indexed": false, "name": "liquidationPrice", "type": "uint256"},
      {"indexed": false, "name": "fee", "type": "uint256"}
    ],
    "name": "LiquidationExecuted",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      {"name": "trader", "type": "address"},
      {"name": "market", "type": "bytes32"}
    ],
    "name": "checkLiquidation",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "trader", "type": "address"},
      {"name": "market", "type": "bytes32"}
    ],
    "name": "executeLiquidation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "trader", "type": "address"}],
    "name": "getAccountRisk",
    "outputs": [
      {
        "components": [
          {"name": "marginRatio", "type": "uint256"},
          {"name": "maintenanceMargin", "type": "uint256"},
          {"name": "liquidationThreshold", "type": "uint256"},
          {"name": "canLiquidate", "type": "bool"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ERC20 Token ABI (for collateral tokens)
export const ERC20ABI = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// OracleAdapter ABI (subset for price reads and events)
export const OracleAdapterABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "symbol", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "symbol", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "feed", "type": "address" }
    ],
    "name": "FeedSet",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      { "internalType": "bytes32", "name": "symbol", "type": "bytes32" }
    ],
    "name": "getPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// SpotMarket ABI
export const SpotMarketABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": false, "name": "baseToken", "type": "address"},
      {"indexed": false, "name": "quoteToken", "type": "address"},
      {"indexed": false, "name": "symbol", "type": "string"}
    ],
    "name": "MarketAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"}
    ],
    "name": "MarketActivated",
    "type": "event"
  },
  {
    "inputs": [
      {"name": "baseToken", "type": "address"},
      {"name": "quoteToken", "type": "address"},
      {"name": "symbol", "type": "string"},
      {"name": "baseIsNative", "type": "bool"},
      {"name": "quoteIsNative", "type": "bool"}
    ],
    "name": "addMarket",
    "outputs": [{"name": "id", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "marketId", "type": "uint256"}],
    "name": "activateMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "marketId", "type": "uint256"}],
    "name": "getMarket",
    "outputs": [
      {
        "components": [
          {"name": "id", "type": "uint256"},
          {"name": "baseToken", "type": "address"},
          {"name": "quoteToken", "type": "address"},
          {"name": "symbol", "type": "string"},
          {"name": "isActive", "type": "bool"},
          {"name": "baseDecimals", "type": "uint8"},
          {"name": "quoteDecimals", "type": "uint8"},
          {"name": "baseIsNative", "type": "bool"},
          {"name": "quoteIsNative", "type": "bool"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMarkets",
    "outputs": [
      {
        "components": [
          {"name": "id", "type": "uint256"},
          {"name": "baseToken", "type": "address"},
          {"name": "quoteToken", "type": "address"},
          {"name": "symbol", "type": "string"},
          {"name": "isActive", "type": "bool"},
          {"name": "baseDecimals", "type": "uint8"},
          {"name": "quoteDecimals", "type": "uint8"},
          {"name": "baseIsNative", "type": "bool"},
          {"name": "quoteIsNative", "type": "bool"}
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "marketId", "type": "uint256"}],
    "name": "isMarketActive",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "GOVERNOR_ROLE",
    "outputs": [{"name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "role", "type": "bytes32"},
      {"name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// SpotOrderBook ABI

// TokenListingGovernor ABI

// SpotOrderBook ABI
export const SpotOrderBookABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "orderId", "type": "uint256"},
      {"indexed": true, "name": "trader", "type": "address"},
      {"indexed": true, "name": "marketId", "type": "uint256"},
      {"indexed": false, "name": "orderType", "type": "uint8"},
      {"indexed": false, "name": "side", "type": "uint8"},
      {"indexed": false, "name": "size", "type": "uint256"},
      {"indexed": false, "name": "price", "type": "uint256"}
    ],
    "name": "OrderPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "orderId", "type": "uint256"},
      {"indexed": true, "name": "trader", "type": "address"},
      {"indexed": true, "name": "marketId", "type": "uint256"},
      {"indexed": false, "name": "filledSize", "type": "uint256"},
      {"indexed": false, "name": "fillPrice", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "OrderFilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "orderId", "type": "uint256"},
      {"indexed": true, "name": "trader", "type": "address"},
      {"indexed": true, "name": "marketId", "type": "uint256"}
    ],
    "name": "OrderCancelled",
    "type": "event"
  },
  {
    "inputs": [
      {"name": "marketId", "type": "uint256"},
      {"name": "orderType", "type": "uint8"},
      {"name": "side", "type": "uint8"},
      {"name": "size", "type": "uint256"},
      {"name": "price", "type": "uint256"}
    ],
    "name": "placeOrder",
    "outputs": [{"name": "orderId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "orderId", "type": "uint256"}],
    "name": "cancelOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "orderId", "type": "uint256"}],
    "name": "getOrder",
    "outputs": [
      {
        "components": [
          {"name": "id", "type": "uint256"},
          {"name": "trader", "type": "address"},
          {"name": "marketId", "type": "uint256"},
          {"name": "orderType", "type": "uint8"},
          {"name": "side", "type": "uint8"},
          {"name": "size", "type": "uint256"},
          {"name": "price", "type": "uint256"},
          {"name": "filledSize", "type": "uint256"},
          {"name": "timestamp", "type": "uint256"},
          {"name": "status", "type": "uint8"},
          {"name": "reservedBase", "type": "uint256"},
          {"name": "reservedQuote", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "trader", "type": "address"}],
    "name": "getOrdersByTrader",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// TokenListingGovernor ABI
export const TokenListingGovernorABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": true, "name": "proposer", "type": "address"},
      {"indexed": true, "name": "baseToken", "type": "address"},
      {"indexed": false, "name": "quoteToken", "type": "address"},
      {"indexed": false, "name": "symbol", "type": "string"},
      {"indexed": false, "name": "startBlock", "type": "uint256"},
      {"indexed": false, "name": "endBlock", "type": "uint256"}
    ],
    "name": "ProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": true, "name": "voter", "type": "address"},
      {"indexed": false, "name": "support", "type": "bool"},
      {"indexed": false, "name": "weight", "type": "uint256"}
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "voter", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "releaseTime", "type": "uint256"}
    ],
    "name": "TokensLocked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "voter", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "TokensUnlocked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": false, "name": "approved", "type": "bool"},
      {"indexed": false, "name": "yesVotes", "type": "uint256"},
      {"indexed": false, "name": "noVotes", "type": "uint256"}
    ],
    "name": "ProposalFinalized",
    "type": "event"
  },
  {
    "inputs": [
      {"name": "baseToken", "type": "address"},
      {"name": "quoteToken", "type": "address"},
      {"name": "symbol", "type": "string"}
    ],
    "name": "createProposal",
    "outputs": [{"name": "id", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "proposalId", "type": "uint256"},
      {"name": "support", "type": "bool"}
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "proposalId", "type": "uint256"}],
    "name": "finalize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimUnlocked",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getLockedSummary",
    "outputs": [
      {"name": "total", "type": "uint256"},
      {"name": "claimable", "type": "uint256"},
      {"name": "nextRelease", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pexToken",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;