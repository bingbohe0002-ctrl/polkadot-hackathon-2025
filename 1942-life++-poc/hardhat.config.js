// ============================================================================
// hardhat.config.js
// ============================================================================
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: '.env.passetHub' });

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local REVM node
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // PassetHub Testnet (Official Polkadot Hub TestNet)
    passetHub: {
      url: process.env.PASSETHUB_RPC || "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: (() => {
        if (!process.env.PRIVATE_KEY) {
          throw new Error("❌ 致命错误：未配置 PRIVATE_KEY！请运行: source .env.passetHub");
        }
        if (!process.env.PRIVATE_KEY.startsWith('0x') || process.env.PRIVATE_KEY.length !== 66) {
          throw new Error("❌ 私钥格式错误！必须是 EVM 格式私钥 (0x + 64位十六进制)");
        }
        return [process.env.PRIVATE_KEY];
      })(),
      chainId: 420420422, // Official PassetHub Chain ID
      gasPrice: "auto",
      timeout: 120000,
      retries: 5
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
