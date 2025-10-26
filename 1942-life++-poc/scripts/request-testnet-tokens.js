// ============================================================================
// scripts/request-testnet-tokens.js - 申请测试网代币
// ============================================================================
const { ethers } = require("hardhat");

async function main() {
  console.log("💰 申请测试网 DOT 代币");
  console.log("=".repeat(60));

  // 从环境变量获取账号
  const deployerKey = process.env.PRIVATE_KEY;
  const agentKey = process.env.AGENT_PRIVATE_KEY;
  const validatorKey = process.env.VALIDATOR_PRIVATE_KEY;

  if (!deployerKey || !agentKey || !validatorKey) {
    console.log("❌ 请先设置环境变量:");
    console.log("   PRIVATE_KEY=0x...");
    console.log("   AGENT_PRIVATE_KEY=0x...");
    console.log("   VALIDATOR_PRIVATE_KEY=0x...");
    process.exit(1);
  }

  const accounts = [
    { name: "Deployer", key: deployerKey },
    { name: "Agent", key: agentKey },
    { name: "Validator", key: validatorKey }
  ];

  console.log("\n📋 需要申请代币的账号:");
  console.log("=".repeat(60));

  accounts.forEach((account, index) => {
    const wallet = new ethers.Wallet(account.key);
    console.log(`${index + 1}. ${account.name}:`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Polkadot Address: ${wallet.address}`);
  });

  console.log("\n🔗 申请代币的方法:");
  console.log("=".repeat(60));
  console.log("方法 1: 官方水龙头");
  console.log("1. 访问: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/accounts");
  console.log("2. 连接钱包或导入账号");
  console.log("3. 点击 'Faucet' 申请代币");
  console.log("4. 输入账号地址申请");

  console.log("\n方法 2: 社区水龙头");
  console.log("1. 访问: https://faucet.polkadot.network/");
  console.log("2. 输入账号地址");
  console.log("3. 完成验证码");
  console.log("4. 点击申请");

  console.log("\n方法 3: Discord 机器人");
  console.log("1. 加入 Polkadot Discord: https://discord.gg/polkadot");
  console.log("2. 找到 #faucet 频道");
  console.log("3. 发送: !faucet <address>");
  console.log("4. 等待机器人回复");

  console.log("\n📝 申请完成后:");
  console.log("=".repeat(60));
  console.log("1. 检查账号余额");
  console.log("2. 确保每个账号有 10+ DOT");
  console.log("3. 运行: npm run deploy:testnet");
  console.log("4. 运行: npm run test:testnet");

  console.log("\n⚠️  注意事项:");
  console.log("=".repeat(60));
  console.log("1. 水龙头可能有频率限制");
  console.log("2. 每次申请数量有限");
  console.log("3. 需要等待确认时间");
  console.log("4. 网络可能不稳定");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 申请代币失败:", error);
    process.exit(1);
  });
