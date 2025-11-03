// ============================================================================
// scripts/request-testnet-tokens.js - Request testnet tokens
// ============================================================================
const { ethers } = require("hardhat");
const { maskPrivateKey } = require('./utils/mask-sensitive');

async function main() {
  console.log("💰 Requesting testnet DOT tokens");
  console.log("=".repeat(60));

  // Get accounts from environment variables
  const deployerKey = process.env.PRIVATE_KEY;
  const agentKey = process.env.AGENT_PRIVATE_KEY;
  const validatorKey = process.env.VALIDATOR_PRIVATE_KEY;

  if (!deployerKey || !agentKey || !validatorKey) {
    console.log("❌ Please set environment variables first:");
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

  console.log("\n📋 Accounts that need tokens:");
  console.log("=".repeat(60));

  accounts.forEach((account, index) => {
    const wallet = new ethers.Wallet(account.key);
    console.log(`${index + 1}. ${account.name}:`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${maskPrivateKey(account.key)}`);
  });

  console.log("\n🔗 Methods to request tokens:");
  console.log("=".repeat(60));
  console.log("Method 1: Official Faucet");
  console.log("1. Visit: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/accounts");
  console.log("2. Connect wallet or import account");
  console.log("3. Click 'Faucet' to request tokens");
  console.log("4. Enter account address to request");

  console.log("\nMethod 2: Community Faucet");
  console.log("1. Visit: https://faucet.polkadot.network/");
  console.log("2. Enter account address");
  console.log("3. Complete captcha");
  console.log("4. Click request");

  console.log("\nMethod 3: Discord Bot");
  console.log("1. Join Polkadot Discord: https://discord.gg/polkadot");
  console.log("2. Find #faucet channel");
  console.log("3. Send: !faucet <address>");
  console.log("4. Wait for bot response");

  console.log("\n📝 After requesting:");
  console.log("=".repeat(60));
  console.log("1. Check account balance");
  console.log("2. Ensure each account has 10+ DOT");
  console.log("3. Run: npm run deploy:testnet");
  console.log("4. Run: npm run test:testnet");

  console.log("\n⚠️  Notes:");
  console.log("=".repeat(60));
  console.log("1. Faucet may have rate limits");
  console.log("2. Limited amount per request");
  console.log("3. Wait for confirmation time");
  console.log("4. Network may be unstable");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Token request failed:", error);
    process.exit(1);
  });
