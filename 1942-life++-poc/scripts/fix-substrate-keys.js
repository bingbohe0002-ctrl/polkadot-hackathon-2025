// ============================================================================
// scripts/fix-substrate-keys.js - Fix Substrate key derivation
// ============================================================================
const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { mnemonicToMiniSecret } = require('@polkadot/util-crypto');

async function fixSubstrateKeys() {
  console.log("🔧 Fixing Substrate key derivation...\n");

  await cryptoWaitReady();

  const mnemonics = {
    deployer: "gym prize december digital hover churn exile pledge path hub safe dolphin",
    agent: "alarm clerk hungry shield collect tattoo ten devote truth chaos zebra together", 
    validator: "shrimp muscle aunt escape dirt ancient shove reopen orange prefer another tail"
  };

  const derivedKeys = {};

  for (const [role, mnemonic] of Object.entries(mnemonics)) {
    try {
      // 方法1: 使用 Keyring
      const keyring = new Keyring({ type: 'sr25519' });
      const keyPair = keyring.addFromMnemonic(mnemonic);
      
      // 方法2: 直接从助记词获取私钥
      const miniSecret = mnemonicToMiniSecret(mnemonic);
      const privateKey = `0x${miniSecret.toString('hex')}`;
      
      derivedKeys[role] = {
        privateKey: privateKey,
        address: keyPair.address,
        mnemonic: mnemonic
      };

      console.log(`✅ ${role.toUpperCase()}:`);
      console.log(`   Address: ${keyPair.address}`);
      console.log(`   Private Key: ${privateKey}`);
      console.log(`   Private Key Length: ${privateKey.length}\n`);

    } catch (error) {
      console.log(`❌ Failed to derive key for ${role}:`, error.message);
    }
  }

  // 生成环境配置文件
  const envContent = `# ============================================================================
# Paseo Testnet Environment Configuration
# Generated from Substrate mnemonic phrases
# ============================================================================

# Network Configuration (Paseo Testnet)
PASEO_RPC=https://paseo-rpc.polkadot.io
RPC_URL=https://paseo-rpc.polkadot.io

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
  console.log("🎉 SUBSTRATE KEYS FIXED!");
  console.log("=".repeat(60));
  console.log("\n📋 Next Steps:");
  console.log("1. Review the updated .env.passetHub file");
  console.log("2. Run deployment: npm run deploy:passethub");
  console.log("3. Test deployment: npm run test:passethub");
}

fixSubstrateKeys()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Key fixing failed:", error);
    process.exit(1);
  });
