require("@nomicfoundation/hardhat-toolbox");
require("hardhat/config");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      accounts: {
        count: 20 // 增加测试账户数量到20个
      }
    },
    passethub: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      chainId: 420420422,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 120000,
      gasPrice: 50000000000
    }
  },
  etherscan: {
    apiKey: {
      passethub: "any" // blockscout 不需要 API key
    },
    customChains: [
      {
        network: "passethub",
        chainId: 420420422,
        urls: {
          apiURL: "https://blockscout-passet-hub.parity-testnet.parity.io/api",
          browserURL: "https://blockscout-passet-hub.parity-testnet.parity.io"
        }
      }
    ]
  }
};
