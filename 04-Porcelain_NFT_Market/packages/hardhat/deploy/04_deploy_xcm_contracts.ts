import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys XCM Bridge and Cross-Chain Marketplace contracts
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployXCMContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🚀 Deploying XCM contracts...");

  // Deploy XCM Bridge
  const xcmBridgeDeployment = await deploy("XCMBridge", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Get XCM Bridge contract instance
  const xcmBridge = await hre.ethers.getContract<Contract>("XCMBridge", deployer);

  console.log("✅ XCM Bridge deployed to:", xcmBridgeDeployment.address);

  // Deploy Cross-Chain Marketplace
  const marketplaceDeployment = await deploy("CrossChainMarketplace", {
    from: deployer,
    args: [xcmBridgeDeployment.address, deployer], // XCM Bridge address and fee recipient
    log: true,
    autoMine: true,
  });

  console.log("✅ Cross-Chain Marketplace deployed to:", marketplaceDeployment.address);

  // Get marketplace contract instance
  const marketplace = await hre.ethers.getContract<Contract>("CrossChainMarketplace", deployer);

  // Get YourCollectible contract if it exists
  try {
    const yourCollectible = await hre.ethers.getContract<Contract>("YourCollectible", deployer);

    // Authorize YourCollectible contract in XCM Bridge
    console.log("🔗 Authorizing YourCollectible contract in XCM Bridge...");
    const authTx = await xcmBridge.setContractAuthorization(yourCollectible.target, true);
    await authTx.wait();
    console.log("✅ YourCollectible contract authorized");

    // Set marketplace approval for YourCollectible
    console.log("🔗 Setting marketplace approval for YourCollectible...");
    const approvalTx = await yourCollectible.setApprovalForAll(marketplace.target, true);
    await approvalTx.wait();
    console.log("✅ Marketplace approval set");

  } catch (error) {
    console.log("⚠️  YourCollectible contract not found, skipping authorization");
  }

  // Configure supported chains based on current network
  const chainId = await hre.getChainId();
  console.log(`🌐 Current chain ID: ${chainId}`);

  // Set chain support in both contracts
  const supportedChains = [420420422, 1287]; // Polkadot Hub and Moonbase Alpha

  for (const supportedChainId of supportedChains) {
    if (parseInt(chainId) !== supportedChainId) {
      console.log(`🔗 Setting support for chain ${supportedChainId}...`);

      const bridgeChainTx = await xcmBridge.setChainSupport(supportedChainId, true);
      await bridgeChainTx.wait();

      const marketplaceChainTx = await marketplace.setChainSupport(supportedChainId, true);
      await marketplaceChainTx.wait();

      console.log(`✅ Chain ${supportedChainId} support enabled`);
    }
  }

  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`XCM Bridge: ${xcmBridgeDeployment.address}`);
  console.log(`Cross-Chain Marketplace: ${marketplaceDeployment.address}`);
  console.log(`Network: ${hre.network.name} (Chain ID: ${chainId})`);
  console.log("=".repeat(50));

  // Verify contracts on supported networks
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts...");

    try {
      await hre.run("verify:verify", {
        address: xcmBridgeDeployment.address,
        constructorArguments: [],
      });
      console.log("✅ XCM Bridge verified");
    } catch (error) {
      console.log("⚠️  XCM Bridge verification failed:", error);
    }

    try {
      await hre.run("verify:verify", {
        address: marketplaceDeployment.address,
        constructorArguments: [xcmBridgeDeployment.address, deployer],
      });
      console.log("✅ Cross-Chain Marketplace verified");
    } catch (error) {
      console.log("⚠️  Cross-Chain Marketplace verification failed:", error);
    }
  }
};

export default deployXCMContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployXCMContracts.tags = ["XCMBridge", "CrossChainMarketplace", "XCM"];