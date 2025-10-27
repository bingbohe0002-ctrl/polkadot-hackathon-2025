import { ethers } from "hardhat";

async function main() {
  console.log("🔗 Configuring cross-chain contract mappings...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // 获取当前网络信息
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);

  console.log(`Current network chain ID: ${currentChainId}`);

  // 从部署记录中获取实际的合约地址
  const deployments = {
    moonbaseAlpha: {
      YourCollectible: "0x0D1BA5D32C8648337C56659e05EE4161490Fe460",
      XCMBridge: "0xDbd1ed48581d42295057754D9f268970aEA25c9B", // 从部署记录获取的实际地址
      CrossChainMarketplace: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788"
    },
    polkadotHubTestnet: {
      YourCollectible: "0xeC3B47E3679B2D0D1Ba3AC01a52121871A358e2C",
      XCMBridge: "0x15dEBed7142159A331EBEa55bD48994B34F0c473", // 从部署记录获取的实际地址
      CrossChainMarketplace: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
    }
  };

  const currentNetwork = currentChainId === 1287 ? "moonbaseAlpha" : "polkadotHubTestnet";
  const currentContracts = deployments[currentNetwork];

  console.log(`Configuring ${currentNetwork} contracts...`);

  try {
    // 获取合约实例
    const xcmBridge = await ethers.getContractAt("XCMBridge", currentContracts.XCMBridge);
    const yourCollectible = await ethers.getContractAt("YourCollectible", currentContracts.YourCollectible);

    // 1. 在XCMBridge中授权YourCollectible合约
    console.log("Authorizing YourCollectible contract in XCMBridge...");
    const authTx = await xcmBridge.setContractAuthorization(currentContracts.YourCollectible, true);
    await authTx.wait();
    console.log(`✅ YourCollectible authorized: ${currentContracts.YourCollectible}`);

    // 2. 在YourCollectible中设置XCMBridge地址
    console.log("Setting XCMBridge address in YourCollectible...");
    const bridgeTx = await yourCollectible.setXCMBridge(currentContracts.XCMBridge);
    await bridgeTx.wait();
    console.log(`✅ XCMBridge address set: ${currentContracts.XCMBridge}`);

    // 3. 设置支持的链
    console.log("Setting chain support...");
    const targetChainId = currentNetwork === "moonbaseAlpha" ? 420420422 : 1287; // 对方链的ID
    const chainSupportTx = await xcmBridge.setChainSupport(targetChainId, true);
    await chainSupportTx.wait();
    console.log(`✅ Chain support set for chain ID: ${targetChainId}`);

    console.log("🎉 Cross-chain configuration completed successfully!");

  } catch (error) {
    console.error("❌ Error configuring cross-chain mappings:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });