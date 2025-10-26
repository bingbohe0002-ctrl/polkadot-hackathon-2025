// ============================================================================
// scripts/browser-verify.js - 浏览器验证脚本
// ============================================================================
const hre = require("hardhat");

async function main() {
  console.log("🌐 PassetHub 浏览器验证信息\n");
  console.log("=" + "=".repeat(60));
  console.log("📋 合约地址和验证方法");
  console.log("=" + "=".repeat(60) + "\n");

  // 加载部署信息
  const fs = require('fs');
  const deploymentPath = './deployments/passetHub-deployment.json';
  
  if (!fs.existsSync(deploymentPath)) {
    console.log("❌ Deployment file not found!");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  console.log("🔗 合约地址 (复制到浏览器中查看):");
  console.log(`   CATK Token:     ${deployment.contracts.CATK}`);
  console.log(`   aNFT:           ${deployment.contracts.aNFT}`);
  console.log(`   Registry:       ${deployment.contracts.Registry}`);
  console.log(`   Ledger:          ${deployment.contracts.Ledger}`);
  console.log(`   LegalWrapper:    ${deployment.contracts.LegalWrapper}`);
  
  console.log("\n🌐 浏览器查看步骤:");
  console.log("1. 访问: https://polkadot.js.org/apps/");
  console.log("2. 选择网络: Paseo (PassetHub 基于 Paseo)");
  console.log("3. 进入 Developer → Chain state");
  console.log("4. 输入合约地址查看状态");
  
  console.log("\n📊 可以验证的数据:");
  console.log("✅ CATK Token:");
  console.log("   - name(): 'Cognitive Asset Token'");
  console.log("   - symbol(): 'CATK'");
  console.log("   - totalSupply(): 1000000 CATK");
  
  console.log("\n✅ Registry:");
  console.log("   - catkToken(): 返回 CATK 地址");
  console.log("   - addressToCid(): 查询代理 CID");
  
  console.log("\n✅ Ledger:");
  console.log("   - registry(): 返回 Registry 地址");
  console.log("   - aNFT(): 返回 aNFT 地址");
  console.log("   - getProof(): 查询证明详情");
  
  console.log("\n✅ aNFT:");
  console.log("   - name(): 'Action Proof NFT'");
  console.log("   - symbol(): 'aNFT'");
  console.log("   - supportsInterface(): 支持 ERC721");
  
  console.log("\n🔍 具体验证方法:");
  console.log("1. 在 Polkadot.js Apps 中:");
  console.log("   - 选择 'Developer' → 'Chain state'");
  console.log("   - 选择 'contracts' 或 'evm' 相关选项");
  console.log("   - 输入合约地址和函数名");
  console.log("   - 点击查询按钮");
  
  console.log("\n2. 验证 CATK Token:");
  console.log(`   - 地址: ${deployment.contracts.CATK}`);
  console.log("   - 函数: name() → 应返回 'Cognitive Asset Token'");
  console.log("   - 函数: symbol() → 应返回 'CATK'");
  console.log("   - 函数: totalSupply() → 应返回 1000000");
  
  console.log("\n3. 验证 Registry:");
  console.log(`   - 地址: ${deployment.contracts.Registry}`);
  console.log("   - 函数: catkToken() → 应返回 CATK 地址");
  
  console.log("\n4. 验证 Ledger:");
  console.log(`   - 地址: ${deployment.contracts.Ledger}`);
  console.log("   - 函数: registry() → 应返回 Registry 地址");
  console.log("   - 函数: aNFT() → 应返回 aNFT 地址");
  
  console.log("\n📱 移动端查看:");
  console.log("如果使用手机，可以访问:");
  console.log("https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fpaseo-rpc.polkadot.io");
  
  console.log("\n🎉 验证完成后的结果:");
  console.log("✅ 所有合约地址都能在浏览器中查询到");
  console.log("✅ 合约函数调用返回正确结果");
  console.log("✅ 证明项目已成功部署到 PassetHub 测试网");
  
  console.log("\n" + "=".repeat(60));
  console.log("🚀 项目已准备好提交到黑客松！");
  console.log("=" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
