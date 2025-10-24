// ============================================================================
// scripts/deploy-testnet.js - Testnet deployment script
// ============================================================================
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 检查网络配置
  const network = hre.network.name;
  console.log(`📡 Network: ${network}`);
  
  if (network === "localhost") {
    console.log("❌ This script is for testnet deployment only!");
    console.log("💡 Use: npx hardhat run scripts/deploy-testnet.js --network passetHub");
    process.exit(1);
  }

  // 根据网络显示不同的部署信息
  if (network === "passetHub") {
    console.log("🚀 Deploying Life++ PoC to PassetHub Testnet (Hackathon Track 1)...\n");
  } else if (network === "assetHub") {
    console.log("🚀 Deploying Life++ PoC to Polkadot Asset Hub Testnet...\n");
  } else {
    console.log(`🚀 Deploying Life++ PoC to ${network}...\n`);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  
  // 检查账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("❌ Insufficient balance for deployment!");
    console.log("💡 Please fund your account with testnet tokens");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📦 DEPLOYING SMART CONTRACTS");
  console.log("=".repeat(60));

  // 1. Deploy CATK Token
  console.log("\n1️⃣ Deploying Cognitive Asset Token (CATK)...");
  const CATK = await hre.ethers.getContractFactory("CognitiveAssetToken");
  const catk = await CATK.deploy();
  await catk.waitForDeployment();
  const catkAddress = await catk.getAddress();
  console.log("✅ CATK deployed to:", catkAddress);

  // 2. Deploy aNFT
  console.log("\n2️⃣ Deploying Action Proof NFT (aNFT)...");
  const ANFT = await hre.ethers.getContractFactory("ActionProofNFT");
  const aNFT = await ANFT.deploy();
  await aNFT.waitForDeployment();
  const aNFTAddress = await aNFT.getAddress();
  console.log("✅ aNFT deployed to:", aNFTAddress);

  // 3. Deploy Registry
  console.log("\n3️⃣ Deploying PoC Registry...");
  const Registry = await hre.ethers.getContractFactory("PoCRegistry");
  const registry = await Registry.deploy(catkAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ Registry deployed to:", registryAddress);

  // 4. Deploy Ledger
  console.log("\n4️⃣ Deploying PoC Ledger...");
  const Ledger = await hre.ethers.getContractFactory("PoCLedger");
  const ledger = await Ledger.deploy(registryAddress, aNFTAddress);
  await ledger.waitForDeployment();
  const ledgerAddress = await ledger.getAddress();
  console.log("✅ Ledger deployed to:", ledgerAddress);

  // 5. Deploy Legal Wrapper
  console.log("\n5️⃣ Deploying Legal Wrapper...");
  const LegalWrapper = await hre.ethers.getContractFactory("LegalWrapper");
  const legalWrapper = await LegalWrapper.deploy();
  await legalWrapper.waitForDeployment();
  const legalWrapperAddress = await legalWrapper.getAddress();
  console.log("✅ Legal Wrapper deployed to:", legalWrapperAddress);

  console.log("\n" + "=".repeat(60));
  console.log("🔧 SETTING UP ROLES AND PERMISSIONS");
  console.log("=".repeat(60));

  // Setup roles
  console.log("\n🔐 Setting up roles and permissions...");
  
  // Grant MINTER_ROLE to Ledger for aNFT
  const MINTER_ROLE = await aNFT.MINTER_ROLE();
  const grantMinterTx = await aNFT.grantRole(MINTER_ROLE, ledgerAddress);
  await grantMinterTx.wait();
  console.log("✅ Granted MINTER_ROLE to Ledger for aNFT");

  // Grant VALIDATOR_ROLE to deployer (for testing)
  const VALIDATOR_ROLE = await ledger.VALIDATOR_ROLE();
  const grantValidatorTx = await ledger.grantRole(VALIDATOR_ROLE, deployer.address);
  await grantValidatorTx.wait();
  console.log("✅ Granted VALIDATOR_ROLE to deployer");

  // Approve Registry to spend CATK (for staking)
  const stakeAmount = hre.ethers.parseEther("1000");
  const approveTx = await catk.approve(registryAddress, stakeAmount * 100n);
  await approveTx.wait();
  console.log("✅ Approved Registry to spend CATK");

  console.log("\n" + "=".repeat(60));
  console.log("📝 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));

  // Save deployment addresses
  const deployment = {
    network: network,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      CATK: catkAddress,
      aNFT: aNFTAddress,
      Registry: registryAddress,
      Ledger: ledgerAddress,
      LegalWrapper: legalWrapperAddress
    },
    explorer: {
      baseUrl: "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/explorer",
      contracts: {
        CATK: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/explorer/query/${catkAddress}`,
        aNFT: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/explorer/query/${aNFTAddress}`,
        Registry: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/explorer/query/${registryAddress}`,
        Ledger: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/explorer/query/${ledgerAddress}`,
        LegalWrapper: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/explorer/query/${legalWrapperAddress}`
      }
    }
  };

  console.log("\n📋 Contract Addresses:");
  console.log(`   CATK:           ${catkAddress}`);
  console.log(`   aNFT:           ${aNFTAddress}`);
  console.log(`   Registry:       ${registryAddress}`);
  console.log(`   Ledger:         ${ledgerAddress}`);
  console.log(`   LegalWrapper:   ${legalWrapperAddress}`);

  // Save to file
  const deploymentPath = `./deployments/${network}-deployment.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\n💾 Deployment saved to: ${deploymentPath}`);

  // Generate environment file
  const rpcUrl = network === "passetHub" 
    ? (process.env.PASSET_HUB_RPC || "https://passet-hub-rpc.polkadot.io")
    : (process.env.RPC_URL || "https://polkadot-asset-hub-rpc.polkadot.io");
    
  const envContent = `# ${network === "passetHub" ? "PassetHub" : "Testnet"} Deployment Environment
# Generated on ${new Date().toISOString()}

RPC_URL=${rpcUrl}
LEDGER_ADDRESS=${ledgerAddress}
REGISTRY_ADDRESS=${registryAddress}
CATK_ADDRESS=${catkAddress}
ANFT_ADDRESS=${aNFTAddress}
LEGAL_WRAPPER_ADDRESS=${legalWrapperAddress}
PRIVATE_KEY=${process.env.PRIVATE_KEY || "your-private-key-here"}
VALIDATOR_PRIVATE_KEY=${process.env.VALIDATOR_PRIVATE_KEY || "your-validator-private-key-here"}
AGENT_PRIVATE_KEY=${process.env.AGENT_PRIVATE_KEY || "your-agent-private-key-here"}
IPFS_URL=${process.env.IPFS_URL || "https://ipfs.io"}
PORT=3000
CHECK_INTERVAL=10000
DEPLOYMENT_NETWORK=${network}
HACKATHON_TRACK=${network === "passetHub" ? "track1" : "testnet"}
PROJECT_NAME=lifeplusplus-poc
`;

  const envPath = `./deployments/${network}-env.txt`;
  fs.writeFileSync(envPath, envContent);
  console.log(`💾 Environment file saved to: ${envPath}`);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the environment variables to your .env file");
  
  if (network === "passetHub") {
    console.log("2. Start PassetHub services: npm run start:passethub");
    console.log("3. Run PassetHub verification: npm run test:passethub");
    console.log("4. Submit to hackathon: Use the generated contract addresses");
  } else {
    console.log("2. Start the AHIN Indexer: npm run indexer:start");
    console.log("3. Start the Validator Daemon: npm run validator:start");
    console.log("4. Run testnet verification: npm run test:testnet");
  }
  
  console.log("\n🔗 View contracts on Polkadot Explorer:");
  console.log(`   ${deployment.explorer.baseUrl}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
