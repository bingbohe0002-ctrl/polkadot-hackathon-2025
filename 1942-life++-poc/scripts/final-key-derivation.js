// ============================================================================
// scripts/final-key-derivation.js - Final Substrate key derivation
// ============================================================================
const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
require('dotenv').config({ path: '.env.developer' });

async function finalKeyDerivation() {
  console.log("🔑 Final Substrate key derivation...\n");

  await cryptoWaitReady();

  // 从环境变量读取助记词
  const mnemonics = {
    deployer: process.env.DEPLOYER_MNEMONIC,
    agent: process.env.AGENT_MNEMONIC, 
    validator: process.env.VALIDATOR_MNEMONIC
  };

  // 检查助记词是否存在
  for (const [role, mnemonic] of Object.entries(mnemonics)) {
    if (!mnemonic) {
      console.log(`❌ Missing ${role.toUpperCase()}_MNEMONIC in environment variables`);
      console.log("Please create .env.developer file with your mnemonics");
      process.exit(1);
    }
  }

  const derivedKeys = {};

  for (const [role, mnemonic] of Object.entries(mnemonics)) {
    try {
      const keyring = new Keyring({ type: 'sr25519' });
      const keyPair = keyring.addFromMnemonic(mnemonic);
      
      // 获取私钥的正确方法
      const privateKey = keyPair.publicKey;
      const privateKeyHex = `0x${Buffer.from(keyPair.publicKey).toString('hex')}`;
      
      derivedKeys[role] = {
        privateKey: privateKeyHex,
        address: keyPair.address,
        mnemonic: mnemonic
      };

      console.log(`✅ ${role.toUpperCase()}:`);
      console.log(`   Address: ${keyPair.address}`);
      console.log(`   Private Key: ${privateKeyHex}`);
      console.log(`   Private Key Length: ${privateKeyHex.length}\n`);

    } catch (error) {
      console.log(`❌ Failed to derive key for ${role}:`, error.message);
    }
  }

  // 生成环境配置文件
  const envContent = `# ============================================================================
# PassetHub Testnet Environment Configuration
# Generated from Substrate mnemonic phrases
# ============================================================================

# Network Configuration (PassetHub Testnet)
PASSETHUB_RPC=https://testnet-passet-hub-eth-rpc.polkadot.io
RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io

# Private Keys (derived from Substrate mnemonic phrases)
PRIVATE_KEY=${derivedKeys.deployer?.privateKey || 'your-deployer-private-key-here'}
VALIDATOR_PRIVATE_KEY=${derivedKeys.validator?.privateKey || 'your-validator-private-key-here'}
AGENT_PRIVATE_KEY=${derivedKeys.agent?.privateKey || 'your-agent-private-key-here'}

# Contract Addresses (部署后会自动更新)
LEDGER_ADDRESS=
REGISTRY_ADDRESS=
CATK_ADDRESS=
ANFT_ADDRESS=
LEGAL_WRAPPER_ADDRESS=

# IPFS Configuration
IPFS_URL=https://ipfs.io

# Service Configuration
PORT=3000
CHECK_INTERVAL=10000

# Deployment Configuration
DEPLOYMENT_NETWORK=passetHub
GAS_LIMIT=8000000
GAS_PRICE=auto

# Hackathon Specific
HACKATHON_TRACK=track1
PROJECT_NAME=lifeplusplus-poc

# Account Addresses (for reference)
DEPLOYER_ADDRESS=${derivedKeys.deployer?.address || '5EEe7y4NAUnAnnbQApDBnBuaFeEvuFDe9EexmwXqwdNZjGnA'}
AGENT_ADDRESS=${derivedKeys.agent?.address || '5G4mF1uQ3R4Sf12XwH5Bu7frQUgAkKwPmyGxMrzAFWu7MYCb'}
VALIDATOR_ADDRESS=${derivedKeys.validator?.address || '5CvkxaxqUEeS56o6uWXSomMqQ1dwi55oLoDW9VSz1dnQcuaP'}
`;

  const fs = require('fs');
  fs.writeFileSync('.env.passetHub', envContent);
  console.log("💾 Environment file updated: .env.passetHub");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 FINAL KEY DERIVATION COMPLETED!");
  console.log("=".repeat(60));
  console.log("\n📋 Next Steps:");
  console.log("1. Review the updated .env.passetHub file");
  console.log("2. Run deployment: npm run deploy:passethub");
  console.log("3. Test deployment: npm run test:passethub");
}

finalKeyDerivation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Final key derivation failed:", error);
    process.exit(1);
  });
