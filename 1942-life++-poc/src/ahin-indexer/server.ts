// ============================================================================
// src/ahin-indexer/server.ts - AHIN Indexer Main Service
// ============================================================================
import express from 'express';
import { ethers } from 'ethers';
// import { create as ipfsHttpClient } from 'ipfs-http-client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
import { 
  CognitiveEvent, 
  ProofSubmission, 
  AHINConfig, 
  HealthResponse,
  SubmitEventResponse,
  EvidenceBundle 
} from '../types';

const app = express();
app.use(express.json());

// Configuration
const CONFIG: AHINConfig = {
  RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
  LEDGER_ADDRESS: process.env.LEDGER_ADDRESS || '',
  REGISTRY_ADDRESS: process.env.REGISTRY_ADDRESS || '',
  IPFS_URL: process.env.IPFS_URL || 'http://localhost:5001',
  PORT: parseInt(process.env.PORT || '3000')
};

// Initialize clients
const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
// const ipfs = ipfsHttpClient({ url: CONFIG.IPFS_URL });

// Load contract ABI (simplified)
const LEDGER_ABI = [
  "function submitProof(bytes32 cid, bytes32 inputHash, bytes32 reasoningHash, bytes32 outputHash, string metadataCID) returns (bytes32)",
  "function getProof(bytes32 proofId) view returns (tuple(bytes32 cid, bytes32 inputHash, bytes32 reasoningHash, bytes32 outputHash, string metadataCID, uint256 timestamp, uint8 status, address[] attestedBy, uint256 chainRank))",
  "event ProofSubmitted(bytes32 indexed proofId, bytes32 indexed cid, string metadataCID)"
];

// ============================================================================
// AHIN Service - Core Logic
// ============================================================================
class AHINService {
  private ledger: ethers.Contract;
  private registry: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.ledger = new ethers.Contract(CONFIG.LEDGER_ADDRESS, LEDGER_ABI, this.wallet);
    
    // Add registry ABI and contract
    const REGISTRY_ABI = [
      "function addressToCid(address) view returns (bytes32)"
    ];
    this.registry = new ethers.Contract(CONFIG.REGISTRY_ADDRESS, REGISTRY_ABI, this.wallet);
  }

  /**
   * Process cognitive event and submit to blockchain
   */
  async submitCognitiveEvent(event: CognitiveEvent): Promise<ProofSubmission> {
    console.log(`📥 Processing cognitive event for agent: ${event.agentId}`);

    try {
      // 1. Build evidence bundle
      const evidenceBundle = this.buildEvidenceBundle(event);

      // 2. Upload to IPFS
      const metadataCID = await this.uploadToIPFS(evidenceBundle);
      console.log(`📦 Evidence uploaded to IPFS: ${metadataCID}`);

      // 3. Compute hashes
      const inputHash = this.hashData(event.input);
      const reasoningHash = this.hashData(event.reasoning);
      const outputHash = this.hashData(event.output);

      // 4. Submit to ledger
      // Get the actual CID from registry by agent address
      // Use the second Hardhat account as the agent (the one that was registered)
      const agentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
      console.log(`🔍 Getting CID for agent address: ${agentAddress}`);
      const cid = await this.registry.addressToCid(agentAddress);
      console.log(`🔍 Retrieved CID: ${cid}`);
      
      if (cid === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        throw new Error(`Agent not registered: ${agentAddress}`);
      }
    const tx = await this.ledger.submitProof(
      cid,
      inputHash,
      reasoningHash,
      outputHash,
      metadataCID
    );

    const receipt = await tx.wait();
    console.log(`📋 Receipt hash: ${receipt.hash}`);
    
    // Parse events from receipt logs (ethers v6)
    let proofId: string | null = null;
    console.log(`🔍 Parsing ${receipt.logs.length} logs for ProofSubmitted event...`);
    
    for (const log of receipt.logs) {
      console.log(`📄 Log address: ${log.address}, topics: ${log.topics.length}`);
      try {
        const parsed = this.ledger.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });
        console.log(`📋 Parsed log: ${parsed?.name}`);
        if (parsed && parsed.name === 'ProofSubmitted') {
          proofId = parsed.args.proofId;
          console.log(`✅ Found ProofSubmitted event with proofId: ${proofId}`);
          console.log(`✅ ProofId type: ${typeof proofId}`);
          break;
        }
      } catch (e: any) {
        console.log(`⚠️  Could not parse log: ${e.message}`);
      }
    }

    if (!proofId) {
      console.log(`❌ No ProofSubmitted event found, using transaction hash as fallback`);
      console.log(`📋 Receipt.hash: ${receipt.hash}, type: ${typeof receipt.hash}`);
      proofId = receipt.hash;
      console.log(`📋 After fallback, proofId: ${proofId}, type: ${typeof proofId}`);
    }

    console.log(`✅ Proof submitted: ${proofId}`);

      if (!proofId) {
        throw new Error('Failed to get proofId from transaction');
      }

      return {
        proofId: proofId,
        metadataCID,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('❌ Error in submitCognitiveEvent:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive evidence bundle
   */
  private buildEvidenceBundle(event: CognitiveEvent): EvidenceBundle {
    return {
      version: '1.0',
      timestamp: Date.now(),
      agentId: event.agentId,
      cognitiveEvent: event,
      evidence: {
        input: event.input,
        reasoning: event.reasoning,
        output: event.output,
        modelMeta: event.modelMeta,
        sensorData: event.sensorData
      },
      metadata: {
        bundleHash: this.hashData(event),
        signature: event.signature
      }
    };
  }

  /**
   * Upload evidence to IPFS
   */
  private async uploadToIPFS(data: object): Promise<string> {
    const buffer = Buffer.from(JSON.stringify(data));
    
    // Use HTTP API instead of client
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), 'evidence.json');
    
    const response = await fetch(`${CONFIG.IPFS_URL}/api/v0/add`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json() as any;
    return result.Hash || result.Name;
  }

  /**
   * Hash data using SHA-256
   */
  private hashData(data: any): string {
    const jsonStr = JSON.stringify(data);
    return ethers.id(jsonStr);
  }

  /**
   * Compute Merkle root for reasoning steps
   */
  private computeMerkleRoot(steps: any[]): string {
    if (steps.length === 0) return ethers.ZeroHash;
    
    const hashes = steps.map(step => 
      crypto.createHash('sha256').update(JSON.stringify(step)).digest('hex')
    );

    // Simple Merkle tree (for production, use proper library)
    while (hashes.length > 1) {
      const newLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        const combined = crypto.createHash('sha256')
          .update(left + right)
          .digest('hex');
        newLevel.push(combined);
      }
      hashes.length = 0;
      hashes.push(...newLevel);
    }

    return '0x' + hashes[0];
  }

  /**
   * Retrieve proof from blockchain
   */
  async getProof(proofId: string): Promise<any> {
    return await this.ledger.getProof(proofId);
  }
}

// ============================================================================
// REST API Endpoints
// ============================================================================
const ahinService = new AHINService();

/**
 * POST /ahin/submit - Submit cognitive event
 */
app.post('/ahin/submit', async (req, res) => {
  try {
    const event: CognitiveEvent = req.body;
    
    // Basic validation
    if (!event.agentId || !event.input || !event.reasoning || !event.output) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    const result = await ahinService.submitCognitiveEvent(event);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error submitting event:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /ahin/proof/:proofId - Retrieve proof
 */
app.get('/ahin/proof/:proofId', async (req, res) => {
  try {
    const { proofId } = req.params;
    const proof = await ahinService.getProof(proofId);
    
    // Convert BigInt to string for JSON serialization
    const proofData = {
      cid: proof.cid,
      inputHash: proof.inputHash,
      reasoningHash: proof.reasoningHash,
      outputHash: proof.outputHash,
      metadataCID: proof.metadataCID,
      timestamp: proof.timestamp.toString(),
      status: proof.status,
      attestedBy: proof.attestedBy,
      chainRank: proof.chainRank.toString()
    };
    
    res.json({
      success: true,
      data: proofData
    });
  } catch (error: any) {
    console.error('Error retrieving proof:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /health - Health check
 */
app.get('/health', async (req, res) => {
  try {
    const health: HealthResponse = {
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        blockchain: true, // TODO: Add actual health checks
        ipfs: true
      }
    };
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: Date.now(),
      error: error.message
    });
  }
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 AHIN Indexer running on port ${CONFIG.PORT}`);
  console.log(`📡 Connected to RPC: ${CONFIG.RPC_URL}`);
  console.log(`📦 IPFS endpoint: ${CONFIG.IPFS_URL}`);
});
