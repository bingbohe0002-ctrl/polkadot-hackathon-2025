// ============================================================================
// scripts/convert-mnemonics-to-evm.js - 将助记词转换为 EVM 私钥和地址
// ============================================================================
const { ethers } = require('ethers');

async function main() {
  console.log("🔄 助记词转 EVM 私钥工具");
  console.log("=" + "=".repeat(50));
  
  // 助记词数据
  const accounts = [
    {
      name: "Life++ Deployer",
      mnemonic: "gym prize december digital hover churn exile pledge path hub safe dolphin",
      substrateAddress: "5EEe7y4NAUnAnnbQApDBnBuaFeEvuFDe9EexmwXqwdNZjGnA"
    },
    {
      name: "Life++ Agent", 
      mnemonic: "alarm clerk hungry shield collect tattoo ten devote truth chaos zebra together",
      substrateAddress: "5G4mF1uQ3R4Sf12XwH5Bu7frQUgAkKwPmyGxMrzAFWu7MYCb"
    },
    {
      name: "Life++ Validator",
      mnemonic: "shrimp muscle aunt escape dirt ancient shove reopen orange prefer another tail", 
      substrateAddress: "5CvkxaxqUEeS56o6uWXSomMqQ1dwi55oLoDW9VSz1dnQcuaP"
    }
  ];
  
  const evmData = {};
  
  console.log("\n📋 转换结果:");
  console.log("=" + "=".repeat(50));
  
  for (const account of accounts) {
    try {
      const wallet = ethers.Wallet.fromPhrase(account.mnemonic);
      
      console.log(`\n🔑 ${account.name}:`);
      console.log(`   Substrate 地址: ${account.substrateAddress}`);
      console.log(`   EVM 地址: ${wallet.address}`);
      console.log(`   EVM 私钥: ${wallet.privateKey}`);
      
      // 存储数据
      evmData[account.name.toLowerCase().replace('life++ ', '').replace(' ', '_')] = {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
      
    } catch (error) {
      console.error(`❌ ${account.name} 转换失败:`, error.message);
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("📝 .env.passetHub 配置内容:");
  console.log("=" + "=".repeat(50));
  
  console.log(`# 使用 Deployer 账户作为主要私钥`);
  console.log(`PRIVATE_KEY=${evmData.deployer?.privateKey || '请填入Deployer的EVM私钥'}`);
  console.log(`VALIDATOR_PRIVATE_KEY=${evmData.validator?.privateKey || '请填入Validator的EVM私钥'}`);
  console.log(`AGENT_PRIVATE_KEY=${evmData.agent?.privateKey || '请填入Agent的EVM私钥'}`);
  console.log(``);
  console.log(`# 更新对应的 EVM 地址`);
  console.log(`DEPLOYER_ADDRESS=${evmData.deployer?.address || '请填入Deployer的EVM地址'}`);
  console.log(`AGENT_ADDRESS=${evmData.agent?.address || '请填入Agent的EVM地址'}`);
  console.log(`VALIDATOR_ADDRESS=${evmData.validator?.address || '请填入Validator的EVM地址'}`);
  
  console.log("\n" + "=".repeat(50));
  console.log("🎯 下一步操作:");
  console.log("=" + "=".repeat(50));
  console.log("1. 将上述配置复制到 .env.passetHub 文件中");
  console.log("2. 为这些 EVM 地址获取 PassetHub 测试网 ETH");
  console.log("3. 运行: source .env.passetHub");
  console.log("4. 运行: npm run hackathon:test");
  
  return evmData;
}

main()
  .then((data) => {
    console.log("\n✅ 转换完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 转换失败:", error);
    process.exit(1);
  });
