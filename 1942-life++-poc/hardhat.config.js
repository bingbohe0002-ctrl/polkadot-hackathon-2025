// ============================================================================
// hardhat.config.js - Hardhat Configuration for Life++ PoC
// ============================================================================
/**
 * Hardhat configuration file for the Life++ PoC project.
 * 
 * This file configures:
 * - Solidity compiler settings and optimization
 * - Network configurations (localhost, PassetHub testnet, Asset Hub)
 * - Account management from environment variables
 * - Etherscan API key for contract verification
 * 
 * Environment Variables Required:
 * - PRIVATE_KEY: EVM format private key (0x + 64 hex characters)
 * - PASSETHUB_RPC: RPC URL for PassetHub testnet (optional, has default)
 * - ETHERSCAN_API_KEY: API key for contract verification (optional)
 */

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  // Solidity compiler configuration
  solidity: {
    version: "0.8.20", // Solidity version for all contracts
    settings: {
      optimizer: {
        enabled: true, // Enable optimizer to reduce contract size and gas costs
        runs: 200      // Optimization runs - balances between contract size and gas efficiency
      }
    }
  },
  networks: {
    // Local REVM node for development and testing
    localhost: {
      url: "http://127.0.0.1:8545", // Local Hardhat node RPC endpoint
      chainId: 31337                // Standard Hardhat local network chain ID
    },
    // PassetHub Testnet - Official Polkadot Hub TestNet for testing
    passetHub: {
      url: process.env.PASSETHUB_RPC || "https://testnet-passet-hub-eth-rpc.polkadot.io",
      // Account configuration with validation
      accounts: (() => {
        // Validate that PRIVATE_KEY environment variable is set
        if (!process.env.PRIVATE_KEY) {
          throw new Error("Fatal error: PRIVATE_KEY not configured! Please run: source .env.passetHub");
        }
        // Validate private key format: must be EVM format (0x prefix + 64 hex characters)
        if (!process.env.PRIVATE_KEY.startsWith('0x') || process.env.PRIVATE_KEY.length !== 66) {
          throw new Error("Private key format error! Must be EVM format private key (0x + 64 hexadecimal characters)");
        }
        return [process.env.PRIVATE_KEY];
      })(),
      chainId: 420420422, // Official PassetHub Chain ID
      gasPrice: "auto",   // Let network determine gas price automatically
      timeout: 120000,    // Request timeout in milliseconds (2 minutes)
      retries: 5          // Number of retries for failed transactions
    },
    // Polkadot Asset Hub testnet
    assetHub: {
      url: process.env.ASSET_HUB_RPC || "https://polkadot-asset-hub-rpc.polkadot.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1000,
      gasPrice: "auto",
      timeout: 60000,
      retries: 3
    },
    // Polkadot Asset Hub mainnet
    assetHubMainnet: {
      url: process.env.ASSET_HUB_MAINNET_RPC || "https://polkadot-asset-hub-rpc.polkadot.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1000,
      gasPrice: "auto",
      timeout: 120000,
      retries: 5
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
