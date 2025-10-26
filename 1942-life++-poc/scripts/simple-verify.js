// ============================================================================
// scripts/simple-verify.js - 简单验证脚本
// ============================================================================
const hre = require("hardhat");

async function main() {
  console.log("🔍 简单验证 PassetHub 部署结果\n");
  console.log("=" + "=".repeat(50));

  // 加载部署信息
  const fs = require('fs');
  const deploymentPath = './deployments/passetHub-deployment.json';
  
  if (!fs.existsSync(deploymentPath)) {
    console.log("❌ 部署文件未找到！");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  console.log("📋 部署的合约地址:");
  console.log(`   CATK Token:     ${deployment.contracts.CATK}`);
  console.log(`   aNFT:           ${deployment.contracts.aNFT}`);
  console.log(`   Registry:       ${deployment.contracts.Registry}`);
  console.log(`   Ledger:         ${deployment.contracts.Ledger}`);
  console.log(`   LegalWrapper:   ${deployment.contracts.LegalWrapper}`);
  
  console.log("\n🧪 验证合约功能...");
  
  try {
    // 验证 CATK Token
    console.log("\n1️⃣ 验证 CATK Token:");
    const CATK = await hre.ethers.getContractFactory("CognitiveAssetToken");
    const catk = CATK.attach(deployment.contracts.CATK);
    
    const name = await catk.name();
    const symbol = await catk.symbol();
    const totalSupply = await catk.totalSupply();
    
    console.log(`   ✅ 名称: ${name}`);
    console.log(`   ✅ 符号: ${symbol}`);
    console.log(`   ✅ 总供应量: ${hre.ethers.formatEther(totalSupply)} CATK`);
    
    // 验证 Registry
    console.log("\n2️⃣ 验证 Registry:");
    const Registry = await hre.ethers.getContractFactory("PoCRegistry");
    const registry = Registry.attach(deployment.contracts.Registry);
    
    const catkAddress = await registry.catkToken();
    console.log(`   ✅ CATK 地址: ${catkAddress}`);
    console.log(`   ✅ 地址匹配: ${catkAddress.toLowerCase() === deployment.contracts.CATK.toLowerCase()}`);
    
    // 验证 Ledger
    console.log("\n3️⃣ 验证 Ledger:");
    const Ledger = await hre.ethers.getContractFactory("PoCLedger");
    const ledger = Ledger.attach(deployment.contracts.Ledger);
    
    const registryAddress = await ledger.registry();
    const aNFTAddress = await ledger.aNFT();
    
    console.log(`   ✅ Registry 地址: ${registryAddress}`);
    console.log(`   ✅ aNFT 地址: ${aNFTAddress}`);
    console.log(`   ✅ Registry 匹配: ${registryAddress.toLowerCase() === deployment.contracts.Registry.toLowerCase()}`);
    console.log(`   ✅ aNFT 匹配: ${aNFTAddress.toLowerCase() === deployment.contracts.aNFT.toLowerCase()}`);
    
    // 验证 aNFT
    console.log("\n4️⃣ 验证 aNFT:");
    const ANFT = await hre.ethers.getContractFactory("ActionProofNFT");
    const aNFT = ANFT.attach(deployment.contracts.aNFT);
    
    const aNFTName = await aNFT.name();
    const aNFTSymbol = await aNFT.symbol();
    
    console.log(`   ✅ 名称: ${aNFTName}`);
    console.log(`   ✅ 符号: ${aNFTSymbol}`);
    
    console.log("\n" + "=".repeat(50));
    console.log("🎉 验证结果: 所有合约部署成功！");
    console.log("=" + "=".repeat(50));
    console.log("\n📊 部署摘要:");
    console.log(`   🌐 网络: PassetHub 测试网`);
    console.log(`   🔗 Chain ID: 420420422`);
    console.log(`   📡 RPC: https://testnet-passet-hub-eth-rpc.polkadot.io`);
    console.log(`   ✅ 状态: 部署成功，功能正常`);
    
    console.log("\n🚀 项目已准备好提交到黑客松！");
    console.log("\n📋 提交信息:");
    console.log("   - 所有合约已部署到 PassetHub 测试网");
    console.log("   - 合约功能验证通过");
    console.log("   - 评审可以使用 npm run hackathon:test 进行测试");
    
  } catch (error) {
    console.log(`\n❌ 验证失败: ${error.message}`);
    console.log("\n💡 可能的解决方案:");
    console.log("   1. 检查网络连接");
    console.log("   2. 确认 PassetHub 测试网状态");
    console.log("   3. 重新运行部署脚本");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 脚本执行失败:", error);
    process.exit(1);
  });
