// ============================================================================
// src/validator/ValidatorDaemon.ts - Main Validator Service
// ============================================================================
import { ethers } from 'ethers';
import axios from 'axios';
import { CognitiveAlignmentTest } from './CognitiveAlignmentTest';
import { EvidenceBundle, ValidatorConfig } from '../types';

export class ValidatorDaemon {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private ledger: ethers.Contract;
  private cat: CognitiveAlignmentTest;
  private ipfsGateway: string;

  constructor(config: ValidatorConfig) {
    this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
    this.wallet = new ethers.Wallet(config.VALIDATOR_PRIVATE_KEY, this.provider);
    
    const LEDGER_ABI = [
      "function attestProof(bytes32 proofId, bool approve) external",
      "function getProof(bytes32 proofId) view returns (tuple(bytes32 cid, bytes32 inputHash, bytes32 reasoningHash, bytes32 outputHash, string metadataCID, uint256 timestamp, uint8 status, address[] attestedBy, uint256 chainRank))",
      "event ProofSubmitted(bytes32 indexed proofId, bytes32 indexed cid, string metadataCID)"
    ];
    
    this.ledger = new ethers.Contract(config.LEDGER_ADDRESS, LEDGER_ABI, this.wallet);
    this.cat = new CognitiveAlignmentTest();
    this.ipfsGateway = config.IPFS_URL || 'http://localhost:5001';
  }

  /**
   * Start listening for new proofs
   */
  async start() {
    console.log('🚀 Validator Daemon starting...');
    console.log(`👤 Validator address: ${this.wallet.address}`);

    // Listen for ProofSubmitted events
    this.ledger.on('ProofSubmitted', async (proofId, cid, metadataCID, event) => {
      console.log(`\n📨 New proof submitted: ${proofId}`);
      await this.processProof(proofId.toString(), metadataCID);
    });

    console.log('✅ Validator Daemon running. Listening for proofs...\n');
  }

  /**
   * Process a single proof
   */
  private async processProof(proofId: string, metadataCID: string) {
    try {
      console.log(`🔄 Processing proof: ${proofId}`);

      // 1. Fetch evidence from IPFS
      const evidenceBundle = await this.fetchEvidence(metadataCID);
      console.log(`📥 Evidence retrieved from IPFS: ${metadataCID}`);

      // 2. Run CAT validation
      const catResult = await this.cat.validate(proofId, evidenceBundle);
      console.log(`🧪 CAT Result:`, catResult);

      // 3. Submit attestation
      const approve = catResult.overallScore >= 75;
      console.log(`${approve ? '✅' : '❌'} Submitting attestation: ${approve ? 'APPROVE' : 'REJECT'}`);

      const tx = await this.ledger.attestProof(proofId, approve);
      const receipt = await tx.wait();

      console.log(`✅ Attestation submitted. Tx: ${receipt.transactionHash}`);
      
      if (!approve) {
        console.log(`📋 Rejection reasons: Score ${catResult.overallScore}/100`);
      }

    } catch (error: any) {
      console.error(`❌ Error processing proof ${proofId}:`, error.message);
    }
  }

  /**
   * Fetch evidence bundle from IPFS
   */
  private async fetchEvidence(metadataCID: string): Promise<EvidenceBundle> {
    const url = `${this.ipfsGateway}/ipfs/${metadataCID}`;
    const response = await axios.get(url);
    return response.data;
  }

  /**
   * Stop the daemon
   */
  async stop() {
    console.log('🛑 Stopping Validator Daemon...');
    this.ledger.removeAllListeners();
  }
}
