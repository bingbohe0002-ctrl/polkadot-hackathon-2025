// ============================================================================
// scripts/run-validator.ts - Validator Daemon Startup Script
// ============================================================================
/**
 * Validator Daemon Startup Script
 * 
 * This script initializes and starts the Validator Daemon service, which listens
 * to the blockchain for new proof submissions and automatically validates them
 * using the Cognitive Alignment Test (CAT) algorithm.
 * 
 * The validator runs as a background service, continuously monitoring the
 * blockchain for ProofSubmitted events and processing them through the CAT
 * validation process.
 * 
 * Environment Variables Required:
 * - RPC_URL: Blockchain RPC endpoint (default: http://localhost:8545)
 * - LEDGER_ADDRESS: PoCLedger contract address
 * - VALIDATOR_PRIVATE_KEY: Private key for validator wallet (EVM format)
 * - IPFS_URL: IPFS gateway URL for fetching evidence bundles (default: http://localhost:5001)
 * - CHECK_INTERVAL: Interval in milliseconds for checking new proofs (default: 5000)
 * 
 * Usage:
 *   npm run validator:start
 *   or
 *   ts-node scripts/run-validator.ts
 */

import { ValidatorDaemon } from '../src/validator/ValidatorDaemon';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Main function to start the Validator Daemon
 * 
 * Initializes the ValidatorDaemon with configuration from environment variables,
 * starts the service, and sets up graceful shutdown handlers for SIGINT signals.
 */
async function main() {
  // Initialize Validator Daemon with configuration from environment variables
  // Falls back to default values if environment variables are not set
  const validator = new ValidatorDaemon({
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',              // Blockchain RPC endpoint
    LEDGER_ADDRESS: process.env.LEDGER_ADDRESS || '',                      // PoCLedger contract address (required)
    VALIDATOR_PRIVATE_KEY: process.env.VALIDATOR_PRIVATE_KEY || '',        // Validator private key (required)
    IPFS_URL: process.env.IPFS_URL || 'http://localhost:5001',            // IPFS gateway URL
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '5000')          // Check interval in milliseconds
  });

  // Start the validator daemon service
  // This begins listening for ProofSubmitted events on the blockchain
  await validator.start();

  // Graceful shutdown handler for SIGINT (Ctrl+C)
  // Ensures the validator daemon stops cleanly when interrupted
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    await validator.stop();  // Stop the validator daemon
    process.exit(0);          // Exit the process
  });
}

// Start the main function and handle any errors
main().catch(console.error);
