// ============================================================================
// scripts/run-validator.ts - Validator startup script
// ============================================================================
import { ValidatorDaemon } from '../src/validator/ValidatorDaemon';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const validator = new ValidatorDaemon({
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
    LEDGER_ADDRESS: process.env.LEDGER_ADDRESS || '',
    VALIDATOR_PRIVATE_KEY: process.env.VALIDATOR_PRIVATE_KEY || '',
    IPFS_URL: process.env.IPFS_URL || 'http://localhost:5001',
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '5000')
  });

  await validator.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    await validator.stop();
    process.exit(0);
  });
}

main().catch(console.error);
