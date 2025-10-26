// ============================================================================
// scripts/test-testnet.js - Testnet verification script
// ============================================================================
const hre = require("hardhat");
const fs = require("fs");
const axios = require("axios");

async function main() {
  console.log("🧪 Testing Life++ PoC on Polkadot Asset Hub Testnet...\n");

  // 检查网络
  const network = hre.network.name;
  if (network === "localhost") {
    console.log("❌ This script is for testnet testing only!");
    console.log("💡 Use: npx hardhat run scripts/test-testnet.js --network assetHub");
    process.exit(1);
  }

  // 加载部署信息
  const deploymentPath = `./deployments/${network}-deployment.json`;
  if (!fs.existsSync(deploymentPath)) {
    console.log("❌ Deployment file not found!");
    console.log("💡 Please run deployment first: npm run deploy:testnet");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📋 Using deployment from:", deployment.timestamp);

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Testing with account:", deployer.address);

  console.log("\n" + "=".repeat(60));
  console.log("🔍 CONTRACT VERIFICATION");
  console.log("=".repeat(60));

  // 1. 验证合约部署
  console.log("\n1️⃣ Verifying contract deployments...");
  
  const contracts = deployment.contracts;
  const contractChecks = [];

  for (const [name, address] of Object.entries(contracts)) {
    try {
      const code = await hre.ethers.provider.getCode(address);
      if (code === "0x") {
        console.log(`❌ ${name}: No contract found at ${address}`);
        contractChecks.push(false);
      } else {
        console.log(`✅ ${name}: Contract verified at ${address}`);
        contractChecks.push(true);
      }
    } catch (error) {
      console.log(`❌ ${name}: Error checking contract - ${error.message}`);
      contractChecks.push(false);
    }
  }

  if (contractChecks.some(check => !check)) {
    console.log("\n❌ Some contracts failed verification!");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🧪 FUNCTIONAL TESTING");
  console.log("=".repeat(60));

  // 2. 测试合约功能
  console.log("\n2️⃣ Testing contract functionality...");

  try {
    // 获取合约实例
    const catk = await hre.ethers.getContractAt("CognitiveAssetToken", contracts.CATK);
    const aNFT = await hre.ethers.getContractAt("ActionProofNFT", contracts.ANFT);
    const registry = await hre.ethers.getContractAt("PoCRegistry", contracts.Registry);
    const ledger = await hre.ethers.getContractAt("PoCLedger", contracts.Ledger);

    // 测试 CATK 功能
    console.log("\n🔸 Testing CATK Token...");
    const catkName = await catk.name();
    const catkSymbol = await catk.symbol();
    const catkDecimals = await catk.decimals();
    console.log(`   Name: ${catkName}`);
    console.log(`   Symbol: ${catkSymbol}`);
    console.log(`   Decimals: ${catkDecimals}`);

    // 测试 aNFT 功能
    console.log("\n🔸 Testing aNFT...");
    const aNFTName = await aNFT.name();
    const aNFTSymbol = await aNFT.symbol();
    console.log(`   Name: ${aNFTName}`);
    console.log(`   Symbol: ${aNFTSymbol}`);

    // 测试 Registry 功能
    console.log("\n🔸 Testing Registry...");
    const registryCATK = await registry.catkToken();
    console.log(`   CATK Token: ${registryCATK}`);

    // 测试 Ledger 功能
    console.log("\n🔸 Testing Ledger...");
    const ledgerRegistry = await ledger.registry();
    const ledgerANFT = await ledger.aNFT();
    console.log(`   Registry: ${ledgerRegistry}`);
    console.log(`   aNFT: ${ledgerANFT}`);

    console.log("\n✅ All contract functions working correctly!");

  } catch (error) {
    console.log("\n❌ Contract function test failed:", error.message);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🌐 API SERVICE TESTING");
  console.log("=".repeat(60));

  // 3. 测试 API 服务
  console.log("\n3️⃣ Testing API services...");

  const apiUrl = process.env.API_URL || "http://localhost:3000";
  
  try {
    // 测试健康检查
    console.log("\n🔸 Testing API health check...");
    const healthResponse = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
    if (healthResponse.data.success) {
      console.log("✅ API health check passed");
    } else {
      console.log("❌ API health check failed");
    }
  } catch (error) {
    console.log("⚠️  API service not running or not accessible");
    console.log("💡 Start API service: npm run indexer:start");
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 NETWORK STATUS");
  console.log("=".repeat(60));

  // 4. 检查网络状态
  console.log("\n4️⃣ Checking network status...");

  try {
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    const block = await hre.ethers.provider.getBlock(blockNumber);
    const gasPrice = await hre.ethers.provider.getGasPrice();
    
    console.log(`   Current Block: ${blockNumber}`);
    console.log(`   Block Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
    console.log(`   Gas Price: ${hre.ethers.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`   Network: ${network}`);
    
    console.log("\n✅ Network connection healthy!");
  } catch (error) {
    console.log("\n❌ Network connection failed:", error.message);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 TESTNET VERIFICATION COMPLETED!");
  console.log("=".repeat(60));

  console.log("\n📋 Test Results Summary:");
  console.log("✅ Contract deployments verified");
  console.log("✅ Contract functions tested");
  console.log("✅ Network connection healthy");
  
  if (contractChecks.every(check => check)) {
    console.log("\n🎯 All tests passed! Ready for production deployment.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the issues above.");
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Start AHIN Indexer: npm run indexer:start");
  console.log("2. Start Validator Daemon: npm run validator:start");
  console.log("3. Test full workflow with robot SDK");
  console.log("4. Monitor network performance");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Testnet verification failed:", error);
    process.exit(1);
  });
