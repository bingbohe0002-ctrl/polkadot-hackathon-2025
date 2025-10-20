// hardhat.config.js
require('dotenv').config(); // 从项目根目录的 .env 加载环境变量
const path = require("path");
require("@nomicfoundation/hardhat-toolbox");
require("@parity/hardhat-polkadot");

// 读取 PRIVATE_KEY（优先使用 .env -> process.env）
let PRIVATE_KEY = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : undefined;
if (PRIVATE_KEY && !PRIVATE_KEY.startsWith('0x')) {
  PRIVATE_KEY = '0x' + PRIVATE_KEY;
}

if (!PRIVATE_KEY) {
  console.warn(
    '\n[warning] PRIVATE_KEY not found in environment. ' +
    'passetHub network will not have an "accounts" entry. ' +
    'If you intend to deploy, set PRIVATE_KEY in a .env file or environment variables.\n'
  );
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // 指定 solidity 版本（按需替换）
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        parameters:'z',
        fallback0z:true,
        // runs 的选择取决于合约的调用/部署频率：
        // 200 是常用折中值；若想更小的部署体积可尝试 50、100 等
        runs: 50
      },
      // 减少 metadata 中的额外字节（可微幅降低大小）
      metadata: {
        bytecodeHash: "none"
      },
      // 可显式指定 EVM 版本（可选）
      evmVersion: "paris"
    }
  },

  // resolc（如果你在使用本地 resolc）
  resolc: {
    compilerPath: "/Users/bingbohe/.cargo/bin/resolc",
  },

  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: 'INSERT_PATH_TO_SUBSTRATE_NODE',
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: 'INSERT_PATH_TO_ETH_RPC_ADAPTER',
        dev: true,
      },
    },
    localNode: {
      polkavm: true,
      url: `http://127.0.0.1:8545`,
    },
    passetHub: {
      polkavm: true,
      url: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
      // 只有在 PRIVATE_KEY 存在时才传 accounts（避免未配置时报错）
      ...(PRIVATE_KEY ? { accounts: [PRIVATE_KEY] } : {})
    },
  },
};
