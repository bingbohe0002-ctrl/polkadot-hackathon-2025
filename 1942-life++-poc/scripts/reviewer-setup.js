// ============================================================================
// scripts/reviewer-setup.js - 评审者设置指南
// ============================================================================
const fs = require('fs');
const path = require('path');

function main() {
  console.log("🔧 Life++ PoC - 评审者设置指南\n");
  console.log("=" + "=".repeat(60));
  
  console.log("📋 评审者需要完成的步骤:");
  console.log("=" + "=".repeat(60));
  
  console.log("\n1️⃣ 准备测试钱包:");
  console.log("   • 创建新的测试钱包（不要使用主钱包）");
  console.log("   • 获取钱包地址和私钥");
  console.log("   • 确保钱包有足够的测试代币");
  
  console.log("\n2️⃣ 获取测试代币:");
  console.log("   • 访问: https://faucet.polkadot.io/");
  console.log("   • 选择 'Paseo' 网络（PassetHub 基于 Paseo）");
  console.log("   • 输入你的钱包地址");
  console.log("   • 点击 'Get some PAS' 获取测试代币");
  
  console.log("\n3️⃣ 配置环境变量:");
  console.log("   • 生成环境变量（二选一）:");
  console.log("     A) node scripts/create-developer-env.js");
  console.log("     B) 直接使用已配置的 .env.passetHub 文件");
  console.log("   • 设置你的私钥:");
  console.log("     PRIVATE_KEY=your-private-key-here");
  
  console.log("\n4️⃣ 运行测试:");
  console.log("   • 安装依赖: npm install");
  console.log("   • 运行测试: npm run hackathon:test");
  
  console.log("\n" + "=".repeat(60));
  console.log("⚠️  重要安全提醒:");
  console.log("=" + "=".repeat(60));
  console.log("• 不要使用主钱包的私钥");
  console.log("• 不要提交包含真实私钥的文件到 Git");
  console.log("• 测试完成后可以删除测试钱包");
  console.log("• 项目已部署，评审只需要测试功能");
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 项目信息:");
  console.log("=" + "=".repeat(60));
  
  // 读取部署信息
  const deploymentPath = './deployments/passetHub-deployment.json';
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    console.log("🌐 网络信息:");
    console.log(`   网络: ${deployment.network}`);
    console.log(`   Chain ID: 420420422`);
    console.log(`   RPC: https://testnet-passet-hub-eth-rpc.polkadot.io`);
    
    console.log("\n📦 合约地址:");
    Object.entries(deployment.contracts).forEach(([name, address]) => {
      console.log(`   ${name.padEnd(15)}: ${address}`);
    });
    
    console.log("\n🧪 测试命令:");
    console.log("   npm run hackathon:test");
    
    console.log("\n✅ 项目已准备就绪，评审可以开始测试！");
  } else {
    console.log("❌ 部署文件未找到，请先部署项目");
  }
}

main();
