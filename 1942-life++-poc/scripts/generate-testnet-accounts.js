// ============================================================================
// scripts/generate-testnet-accounts.js - 生成测试网账号
// ============================================================================
const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 生成测试网账号");
  console.log("=".repeat(60));

  // 生成 3 个测试账号
  const accounts = [];
  
  for (let i = 0; i < 3; i++) {
    const wallet = ethers.Wallet.createRandom();
    accounts.push({
      name: i === 0 ? "Deployer" : i === 1 ? "Agent" : "Validator",
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase
    });
  }

  console.log("\n📋 生成的测试账号:");
  console.log("=".repeat(60));

  accounts.forEach((account, index) => {
    console.log(`\n${index + 1}. ${account.name} Account:`);
    console.log(`   Address: ${account.address}`);
    console.log(`   Private Key: ${account.privateKey}`);
    console.log(`   Mnemonic: ${account.mnemonic}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("⚠️  重要提醒:");
  console.log("=".repeat(60));
  console.log("1. 请妥善保存私钥和助记词");
  console.log("2. 这些是测试账号，不要用于主网");
  console.log("3. 请到水龙头申请测试网 DOT 代币");
  console.log("4. 确保每个账号有足够的余额");

  console.log("\n🔗 获取测试网 DOT 代币:");
  console.log("1. 访问: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/accounts");
  console.log("2. 连接钱包或导入账号");
  console.log("3. 点击 'Faucet' 申请代币");
  console.log("4. 等待代币到账");

  console.log("\n📝 环境变量配置:");
  console.log("=".repeat(60));
  console.log("将以下内容添加到 .env.testnet 文件:");
  console.log("");
  console.log(`PRIVATE_KEY=${accounts[0].privateKey}`);
  console.log(`VALIDATOR_PRIVATE_KEY=${accounts[2].privateKey}`);
  console.log(`AGENT_PRIVATE_KEY=${accounts[1].privateKey}`);
  console.log("");
  console.log("然后运行: npm run deploy:testnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 生成账号失败:", error);
    process.exit(1);
  });
