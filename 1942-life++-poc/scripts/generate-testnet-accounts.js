// ============================================================================
// scripts/generate-testnet-accounts.js - Generate testnet accounts
// ============================================================================
const { ethers } = require("hardhat");
const { maskPrivateKey, maskMnemonic } = require('./utils/mask-sensitive');

async function main() {
  console.log("🔑 Generating testnet accounts");
  console.log("=".repeat(60));

  // Generate 3 test accounts
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

  console.log("\n📋 Generated test accounts:");
  console.log("=".repeat(60));

  accounts.forEach((account, index) => {
    console.log(`\n${index + 1}. ${account.name} Account:`);
    console.log(`   Address: ${account.address}`);
    console.log(`   Private Key: ${maskPrivateKey(account.privateKey)}`);
    console.log(`   Mnemonic: ${maskMnemonic(account.mnemonic)}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("⚠️  Important Reminders:");
  console.log("=".repeat(60));
  console.log("1. Please securely save private keys and mnemonics");
  console.log("2. These are test accounts, do not use on mainnet");
  console.log("3. Please request testnet DOT tokens from faucet");
  console.log("4. Ensure each account has sufficient balance");

  console.log("\n🔗 Getting testnet DOT tokens:");
  console.log("1. Visit: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/accounts");
  console.log("2. Connect wallet or import account");
  console.log("3. Click 'Faucet' to request tokens");
  console.log("4. Wait for tokens to arrive");

  console.log("\n📝 Environment variable configuration:");
  console.log("=".repeat(60));
  console.log("Add the following to .env.testnet file:");
  console.log("");
  console.log(`PRIVATE_KEY=${accounts[0].privateKey}`);
  console.log(`VALIDATOR_PRIVATE_KEY=${accounts[2].privateKey}`);
  console.log(`AGENT_PRIVATE_KEY=${accounts[1].privateKey}`);
  console.log("");
  console.log("⚠️  WARNING: Sensitive information will be printed above. Ensure it is not logged or exposed.");
  console.log("Then run: npm run deploy:testnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Account generation failed:", error);
    process.exit(1);
  });
