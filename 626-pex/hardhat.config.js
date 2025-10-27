require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-deploy");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-coverage");

// Load environment variables
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "istanbul",
    },
  },
  
  networks: {
    // Local development network
    hardhat: {
      // chainId: 31337,
      chainId: 420420420,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        accountsBalance: "10000000000000000000000", // 10,000 ETH
      },
    },
    
    // Local node
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 420420420,
      accounts: [PRIVATE_KEY, PRIVATE_KEY, PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
    },
    
    // AssetHub Testnet
    assethub: {
      url: process.env.ASSETHUB_RPC_URL || "https://testnet-passet-hub-eth-rpc.polkadot.io",
      // chainId is fetched from RPC
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
    },
    
    // Ethereum Mainnet
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      chainId: 1,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
    },
    
    // Ethereum Sepolia Testnet
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
    },
    
    // PolkaVM Testnet (placeholder configuration)
    polkavm_testnet: {
      url: "http://localhost:9944", // Replace with actual PolkaVM RPC endpoint
      chainId: 1000, // Replace with actual chain ID
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
    },
  },
  
  // Etherscan verification
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    gasPrice: 20, // gwei
    showTimeSpent: true,
    showMethodSig: true,
    maxMethodDiff: 10,
  },
  
  // Contract sizer configuration
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [":OrderBook$", ":PerpMarket$", ":MarginVault$"],
  },
  
  // Hardhat deploy configuration
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0, // mainnet
      11155111: 0, // sepolia
      31337: 0, // hardhat
      420420420: 0, //polkavm
    },
    admin: {
      default: 1,
      1: 1,
      11155111: 1,
      31337: 1,
      420420420: 0, // polkavm local: use deployer
    },
    treasury: {
      default: 2,
      1: 2,
      11155111: 2,
      31337: 2,
      420420420: 0, // polkavm local: use deployer
    },
  },
  
  // Paths configuration
  paths: {
    sources: "./contracts/src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
    deployments: "./deployments",
  },
  
  // Mocha configuration for tests
  mocha: {
    timeout: 60000, // 60 seconds
    bail: false,
    allowUncaught: false,
  },
  
  // TypeChain configuration
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["externalArtifacts/*.json"],
    dontOverrideCompile: false,
  },
  
  // Solidity coverage configuration
  solcover: {
    skipFiles: ["test/", "mock/", "interfaces/"],
    measureStatementCoverage: true,
    measureFunctionCoverage: true,
    measureBranchCoverage: true,
    measureLineCoverage: true,
  },
  
  // Foundry integration disabled when forge is not available
  
  // Custom tasks and configurations
  external: {
    contracts: [
      {
        artifacts: "node_modules/@openzeppelin/contracts/build/contracts",
        deploy: "node_modules/@openzeppelin/hardhat-upgrades/dist/deploy",
      },
    ],
  },
  
  // Warnings configuration
  warnings: {
    "*": {
      "code-size": false,
      "unused-param": "error",
      "unused-var": "error",
    },
  },
};