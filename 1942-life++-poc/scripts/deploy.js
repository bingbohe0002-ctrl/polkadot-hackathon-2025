// ============================================================================
// scripts/deploy.js - Main deployment script
// ============================================================================
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Life++ PoC Smart Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // 1. Deploy CATK Token
  console.log("📦 Deploying Cognitive Asset Token (CATK)...");
  const CATK = await hre.ethers.getContractFactory("CognitiveAssetToken");
  const catk = await CATK.deploy();
  await catk.waitForDeployment();
  console.log("✅ CATK deployed to:", await catk.getAddress(), "\n");

  // 2. Deploy aNFT
  console.log("📦 Deploying Action Proof NFT (aNFT)...");
  const ANFT = await hre.ethers.getContractFactory("ActionProofNFT");
  const aNFT = await ANFT.deploy();
  await aNFT.waitForDeployment();
  console.log("✅ aNFT deployed to:", await aNFT.getAddress(), "\n");

  // 3. Deploy Registry
  console.log("📦 Deploying PoC Registry...");
  const Registry = await hre.ethers.getContractFactory("PoCRegistry");
  const registry = await Registry.deploy(await catk.getAddress());
  await registry.waitForDeployment();
  console.log("✅ Registry deployed to:", await registry.getAddress(), "\n");

  // 4. Deploy Ledger
  console.log("📦 Deploying PoC Ledger...");
  const Ledger = await hre.ethers.getContractFactory("PoCLedger");
  const ledger = await Ledger.deploy(await registry.getAddress(), await aNFT.getAddress());
  await ledger.waitForDeployment();
  console.log("✅ Ledger deployed to:", await ledger.getAddress(), "\n");

  // 5. Deploy Legal Wrapper
  console.log("📦 Deploying Legal Wrapper...");
  const LegalWrapper = await hre.ethers.getContractFactory("LegalWrapper");
  const legalWrapper = await LegalWrapper.deploy();
  await legalWrapper.waitForDeployment();
  console.log("✅ Legal Wrapper deployed to:", await legalWrapper.getAddress(), "\n");

  // 6. Setup roles
  console.log("🔧 Setting up roles and permissions...");
  
  // Grant MINTER_ROLE to Ledger for aNFT
  const MINTER_ROLE = await aNFT.MINTER_ROLE();
  await aNFT.grantRole(MINTER_ROLE, await ledger.getAddress());
  console.log("✅ Granted MINTER_ROLE to Ledger for aNFT");

  // Grant VALIDATOR_ROLE to deployer (for testing)
  const VALIDATOR_ROLE = await ledger.VALIDATOR_ROLE();
  await ledger.grantRole(VALIDATOR_ROLE, deployer.address);
  console.log("✅ Granted VALIDATOR_ROLE to deployer");

  // Approve Registry to spend CATK (for staking)
  const stakeAmount = hre.ethers.parseEther("1000");
  await catk.approve(await registry.getAddress(), stakeAmount * 100n);
  console.log("✅ Approved Registry to spend CATK\n");

  // Save deployment addresses
  const deployment = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      CATK: await catk.getAddress(),
      aNFT: await aNFT.getAddress(),
      Registry: await registry.getAddress(),
      Ledger: await ledger.getAddress(),
      LegalWrapper: await legalWrapper.getAddress()
    }
  };

  console.log("📝 Deployment Summary:");
  console.log(JSON.stringify(deployment, null, 2));

  // Save to file
  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\n💾 Deployment saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
