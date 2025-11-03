// ============================================================================
// src/validator/ValidatorDaemon.ts - Main Validator Service
// ============================================================================
/**
 * Validator Daemon Service
 * 
 * This service listens to the blockchain for new proof submissions and automatically
 * validates them using the Cognitive Alignment Test (CAT) algorithm.
 * 
 * Responsibilities:
 * - Listen for ProofSubmitted events on the blockchain
 * - Fetch evidence bundles from IPFS
 * - Run CAT validation algorithm
 * - Submit attestation (approve/reject) to blockchain
 * 
 * Architecture:
 * - Event-driven: Listens to blockchain events in real-time
 * - Automated: Processes proofs without manual intervention
 * - Resilient: Error handling ensures one failed proof doesn't stop the daemon
 * 
 * Environment Variables Required:
 * - RPC_URL: Blockchain RPC endpoint
 * - LEDGER_ADDRESS: PoCLedger contract address
 * - VALIDATOR_PRIVATE_KEY: Private key for validator wallet
 * - IPFS_URL: IPFS gateway URL for fetching evidence
 */

import { ethers } from 'ethers';
import axios from 'axios';
import { CognitiveAlignmentTest } from './CognitiveAlignmentTest';
import { EvidenceBundle, ValidatorConfig } from '../types';

/**
 * ValidatorDaemon Class
 * 
 * Background service that automatically validates cognitive proofs submitted to the blockchain.
 * Uses event listeners to detect new proofs and processes them through the CAT algorithm.
 */
export class ValidatorDaemon {
  private provider: ethers.JsonRpcProvider; // Blockchain provider connection
  private wallet: ethers.Wallet;              // Validator wallet for signing attestations
  private ledger: ethers.Contract;            // PoCLedger contract instance
  private cat: CognitiveAlignmentTest;        // CAT algorithm implementation
  private ipfsGateway: string;               // IPFS gateway URL for evidence retrieval

  /**
   * Initialize Validator Daemon
   * 
   * Sets up blockchain connection, wallet, and contract instances.
   * 
   * @param config - Validator configuration from environment variables
   */
  constructor(config: ValidatorConfig) {
    // Initialize blockchain provider
    this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
    
    // Create wallet from private key for signing attestation transactions
    this.wallet = new ethers.Wallet(config.VALIDATOR_PRIVATE_KEY, this.provider);
    
    // PoCLedger contract ABI for proof attestation
    const LEDGER_ABI = [
      "function attestProof(bytes32 proofId, bool approve) external", // Submit validation result
      "function getProof(bytes32 proofId) view returns (tuple(bytes32 cid, bytes32 inputHash, bytes32 reasoningHash, bytes32 outputHash, string metadataCID, uint256 timestamp, uint8 status, address[] attestedBy, uint256 chainRank))", // Get proof details
      "event ProofSubmitted(bytes32 indexed proofId, bytes32 indexed cid, string metadataCID)" // Event emitted when proof is submitted
    ];
    
    // Initialize contract instance
    this.ledger = new ethers.Contract(config.LEDGER_ADDRESS, LEDGER_ABI, this.wallet);
    
    // Initialize CAT algorithm
    this.cat = new CognitiveAlignmentTest();
    
    // IPFS gateway for fetching evidence bundles
    this.ipfsGateway = config.IPFS_URL || 'http://localhost:5001';
  }

  /**
   * Start the validator daemon
   * 
   * Begins listening for ProofSubmitted events and automatically processes them.
   * This method sets up the event listener and runs indefinitely until stopped.
   */
  async start() {
    console.log('🚀 Validator Daemon starting...');
    console.log(`👤 Validator address: ${this.wallet.address}`);

    // Set up event listener for ProofSubmitted events
    // When a new proof is submitted, automatically validate it
    this.ledger.on('ProofSubmitted', async (proofId, cid, metadataCID, event) => {
      console.log(`\n📨 New proof submitted: ${proofId}`);
      await this.processProof(proofId.toString(), metadataCID);
    });

    console.log('✅ Validator Daemon running. Listening for proofs...\n');
  }

  /**
   * Process a single proof through validation
   * 
   * This method:
   * 1. Fetches evidence bundle from IPFS
   * 2. Runs CAT validation algorithm
   * 3. Submits attestation (approve/reject) to blockchain
   * 
   * @param proofId - Unique identifier of the proof to validate
   * @param metadataCID - IPFS CID of the evidence bundle
   */
  private async processProof(proofId: string, metadataCID: string) {
    try {
      console.log(`🔄 Processing proof: ${proofId}`);

      // Step 1: Fetch evidence bundle from IPFS
      const evidenceBundle = await this.fetchEvidence(metadataCID);
      console.log(`📥 Evidence retrieved from IPFS: ${metadataCID}`);

      // Step 2: Run Cognitive Alignment Test validation
      const catResult = await this.cat.validate(proofId, evidenceBundle);
      console.log(`🧪 CAT Result:`, catResult);

      // Step 3: Submit attestation to blockchain
      // Approve if score >= 75 (3 out of 4 checks pass)
      const approve = catResult.overallScore >= 75;
      console.log(`${approve ? '✅' : '❌'} Submitting attestation: ${approve ? 'APPROVE' : 'REJECT'}`);

      // Submit attestation transaction
      const tx = await this.ledger.attestProof(proofId, approve);
      const receipt = await tx.wait(); // Wait for transaction confirmation

      console.log(`✅ Attestation submitted. Tx: ${receipt.transactionHash}`);
      
      // Log rejection reasons if proof was rejected
      if (!approve) {
        console.log(`📋 Rejection reasons: Score ${catResult.overallScore}/100`);
      }

    } catch (error: any) {
      console.error(`❌ Error processing proof ${proofId}:`, error.message);
      // Continue processing other proofs even if one fails
    }
  }

  /**
   * Fetch evidence bundle from IPFS
   * 
   * Retrieves the complete evidence bundle stored on IPFS using the metadata CID.
   * 
   * @param metadataCID - IPFS Content Identifier of the evidence bundle
   * @returns Evidence bundle containing cognitive event data
   */
  private async fetchEvidence(metadataCID: string): Promise<EvidenceBundle> {
    const url = `${this.ipfsGateway}/ipfs/${metadataCID}`;
    const response = await axios.get(url);
    return response.data;
  }

  /**
   * Stop the validator daemon
   * 
   * Removes all event listeners and stops processing new proofs.
   * Used for graceful shutdown.
   */
  async stop() {
    console.log('🛑 Stopping Validator Daemon...');
    this.ledger.removeAllListeners(); // Remove all event listeners
  }
}
