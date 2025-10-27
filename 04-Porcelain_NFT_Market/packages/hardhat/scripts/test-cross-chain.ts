import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing cross-chain NFT functionality...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // 获取当前网络信息
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log(`Current network chain ID: ${currentChainId}`);
  
  // 合约地址 - 使用部署记录中的实际地址
  const deployments = {
    moonbaseAlpha: {
      YourCollectible: "0x0D1BA5D32C8648337C56659e05EE4161490Fe460",
      XCMBridge: "0xDbd1ed48581d42295057754D9f268970aEA25c9B", // 从部署记录获取的实际地址
      CrossChainMarketplace: "0x62CF8Ed114C18f8aD4774a49F4a754a77Fa6a2cD" // 使用正确的部署地址
    },
    polkadotHubTestnet: {
      YourCollectible: "0xeC3B47E3679B2D0D1Ba3AC01a52121871A358e2C",
      XCMBridge: "0x15dEBed7142159A331EBEa55bD48994B34F0c473", // 从部署记录获取的实际地址
      CrossChainMarketplace: "0xA594a3FF1448af756D4814a48F07EBc06FD76861" // 使用正确的部署地址
    }
  };

  const currentNetwork = currentChainId === 1287 ? "moonbaseAlpha" : "polkadotHubTestnet";
  const currentContracts = deployments[currentNetwork];
  
  console.log(`Testing on ${currentNetwork}...`);

  try {
    // 获取合约实例
    const yourCollectible = await ethers.getContractAt("YourCollectible", currentContracts.YourCollectible);
    const xcmBridge = await ethers.getContractAt("XCMBridge", currentContracts.XCMBridge);
    const marketplace = await ethers.getContractAt("CrossChainMarketplace", currentContracts.CrossChainMarketplace);

    console.log("\n📋 Contract Status Check:");
    console.log("=".repeat(50));

    // 1. 检查YourCollectible合约状态
    console.log("1. YourCollectible Contract:");
    const totalSupply = await yourCollectible.totalSupply();
    console.log(`   Total NFTs minted: ${totalSupply}`);
    
    const xcmBridgeAddress = await yourCollectible.xcmBridge();
    console.log(`   XCM Bridge address: ${xcmBridgeAddress}`);
    console.log(`   Bridge configured: ${xcmBridgeAddress.toLowerCase() === currentContracts.XCMBridge.toLowerCase()}`);

    // 2. 检查XCMBridge合约状态
    console.log("\n2. XCMBridge Contract:");
    const targetChainId = currentNetwork === "moonbaseAlpha" ? 420420422 : 1287;
    const isChainSupported = await xcmBridge.supportedChains(targetChainId);
    console.log(`   Target chain ${targetChainId} supported: ${isChainSupported}`);
    
    const isContractAuthorized = await xcmBridge.authorizedContracts(currentContracts.YourCollectible);
    console.log(`   YourCollectible authorized: ${isContractAuthorized}`);

    // 3. 检查Marketplace合约状态
    console.log("\n3. CrossChainMarketplace Contract:");
    const marketplaceXcmBridge = await marketplace.xcmBridge();
    console.log(`   XCM Bridge address: ${marketplaceXcmBridge}`);
    console.log(`   Bridge configured: ${marketplaceXcmBridge.toLowerCase() === currentContracts.XCMBridge.toLowerCase()}`);

    // 4. 如果有NFT，测试跨链转移
    if (totalSupply > 0) {
      console.log("\n🔄 Testing Cross-Chain Transfer:");
      console.log("=".repeat(50));
      
      // 获取第一个NFT的所有者
      const tokenId = 1;
      try {
        const owner = await yourCollectible.ownerOf(tokenId);
        console.log(`   Token ${tokenId} owner: ${owner}`);
        
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
          console.log(`   ✅ You own token ${tokenId}, ready for cross-chain transfer`);
          
          // 准备跨链转移参数
          const targetAddress = deployer.address; // 转移给自己在目标链上
          const targetChainContracts = currentNetwork === "moonbaseAlpha" 
            ? deployments.polkadotHubTestnet 
            : deployments.moonbaseAlpha;
          
          console.log(`   Target chain: ${targetChainId}`);
          console.log(`   Target contract: ${targetChainContracts.YourCollectible}`);
          console.log(`   Target address: ${targetAddress}`);
          
          // 注意：实际的跨链转移需要XCM消息传递，这里只是显示参数
          console.log("   ⚠️  Cross-chain transfer requires XCM message passing");
          console.log("   ⚠️  This would be executed via xcmBridge.sendXCMMessage()");
          
        } else {
          console.log(`   ❌ Token ${tokenId} is owned by ${owner}, not by deployer`);
        }
      } catch (error) {
        console.log(`   ❌ Token ${tokenId} does not exist or error: ${error.message}`);
      }
    } else {
      console.log("\n📝 No NFTs found. Consider minting some NFTs first:");
      console.log("   Run: npx hardhat run scripts/mint-nft.ts --network <network>");
    }

    console.log("\n🎯 Configuration Summary:");
    console.log("=".repeat(50));
    console.log(`✅ Network: ${currentNetwork} (Chain ID: ${currentChainId})`);
    console.log(`✅ YourCollectible: ${currentContracts.YourCollectible}`);
    console.log(`✅ XCMBridge: ${currentContracts.XCMBridge}`);
    console.log(`✅ CrossChainMarketplace: ${currentContracts.CrossChainMarketplace}`);
    console.log(`✅ Target chain ${targetChainId} supported: ${isChainSupported}`);
    console.log(`✅ Contract authorization: ${isContractAuthorized}`);
    
    console.log("\n🎉 Cross-chain configuration test completed!");
    
  } catch (error) {
    console.error("❌ Error testing cross-chain functionality:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });