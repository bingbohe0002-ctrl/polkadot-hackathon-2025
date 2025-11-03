// ============================================================================
// src/ahin-indexer/server.ts - AHIN Indexer Main Service
// ============================================================================
/**
 * AHIN (AI Human Interaction Network) Indexer Server
 * 
 * This is the main backend service for the Life++ PoC system. It provides:
 * - REST API endpoints for the frontend dashboard
 * - Blockchain interaction (Ethereum/Polkadot REVM)
 * - IPFS integration for evidence storage
 * - Cognitive proof processing and submission
 * - Agent registration and management
 * - Dashboard statistics and analytics
 * 
 * Architecture:
 * - Express.js REST API server
 * - Ethers.js for blockchain interaction
 * - Caching layer for performance optimization
 * - Hybrid data solution (real blockchain data + mock data for UI completeness)
 * 
 * Environment Variables Required:
 * - RPC_URL: Blockchain RPC endpoint
 * - LEDGER_ADDRESS: PoCLedger contract address
 * - REGISTRY_ADDRESS: PoCRegistry contract address
 * - IPFS_URL: IPFS gateway URL
 * - PORT: Server port (default: 3000)
 * - PRIVATE_KEY: EVM private key for signing transactions
 */

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

// Initialize Express application
const app = express();
app.use(express.json()); // Parse JSON request bodies

// CORS middleware for frontend access
// Allows cross-origin requests from frontend (running on different port)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // In production, restrict to specific domain
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // Handle preflight requests
  }
  next();
});

// Configuration loaded from environment variables
// Falls back to defaults for local development
// Contract addresses are loaded from deployment file or environment variables
const DEPLOYMENT_FILE = './deployments/passetHub-deployment.json';
let deploymentData: any = {};
try {
  const fs = require('fs');
  if (fs.existsSync(DEPLOYMENT_FILE)) {
    deploymentData = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf8'));
    console.log('📦 Loaded deployment data from:', DEPLOYMENT_FILE);
  }
} catch (e: any) {
  console.log('⚠️  Could not load deployment file:', e.message);
}

const CONFIG: AHINConfig & { CATK_ADDRESS?: string; ANFT_ADDRESS?: string } = {
  RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
  LEDGER_ADDRESS: process.env.LEDGER_ADDRESS || deploymentData.contracts?.Ledger || '',
  REGISTRY_ADDRESS: process.env.REGISTRY_ADDRESS || deploymentData.contracts?.Registry || '',
  CATK_ADDRESS: process.env.CATK_ADDRESS || deploymentData.contracts?.CATK || '',
  ANFT_ADDRESS: process.env.ANFT_ADDRESS || deploymentData.contracts?.aNFT || '',
  IPFS_URL: process.env.IPFS_URL || 'http://localhost:5001',
  PORT: parseInt(process.env.PORT || '3000')
};

// Initialize blockchain provider (connection to blockchain network)
const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
// const ipfs = ipfsHttpClient({ url: CONFIG.IPFS_URL }); // IPFS client (currently using HTTP API instead)

// Load contract ABIs (Application Binary Interfaces)
// These define the functions and events available in the smart contracts
// LEDGER_ABI: PoCLedger contract interface for proof submission and verification
const LEDGER_ABI = [
  "function submitProof(bytes32 cid, bytes32 inputHash, bytes32 reasoningHash, bytes32 outputHash, string metadataCID) returns (bytes32)",
  "function getProof(bytes32 proofId) view returns (tuple(bytes32 cid, bytes32 inputHash, bytes32 reasoningHash, bytes32 outputHash, string metadataCID, uint256 timestamp, uint8 status, address[] attestedBy, uint256 chainRank))",
  "event ProofSubmitted(bytes32 indexed proofId, bytes32 indexed cid, string metadataCID)",
  "event ProofAttested(bytes32 indexed proofId, address indexed validator)",
  "event ProofVerified(bytes32 indexed proofId, uint256 nftTokenId)",
  "event ProofRejected(bytes32 indexed proofId)",
  "function requiredAttestations() view returns (uint256)"
];

// CATK_ABI: CognitiveAssetToken (ERC20) contract interface for token economics
const CATK_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

// ANFT_ABI: ActionProofNFT (ERC721) contract interface for NFT statistics
const ANFT_ABI = [
  "function totalSupply() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// REGISTRY_ABI: PoCRegistry contract interface for agent registration and management
const REGISTRY_ABI = [
  "function addressToCid(address) view returns (bytes32)",
  "function getAgent(bytes32 cid) view returns (tuple(address agentAddr, bytes32 agentMetaHash, uint256 registeredAt, bool active, uint256 stakeAmount))",
  "function isAgentActive(bytes32 cid) view returns (bool)",
  "event AgentRegistered(bytes32 indexed cid, address indexed agentAddr, bytes32 agentMetaHash)",
  "event AgentRevoked(bytes32 indexed cid)",
  "event AgentStaked(bytes32 indexed cid, uint256 amount)"
];

// ============================================================================
// Cache for Performance Optimization
// ============================================================================
/**
 * Cache entry structure storing data and timestamp for expiration checking
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number; // Unix timestamp in milliseconds when entry was created
}

/**
 * Simple in-memory cache implementation with TTL (Time To Live) support
 * 
 * This cache is used to reduce redundant blockchain queries and improve API response times.
 * Entries automatically expire after the TTL period.
 * 
 * @template T - Type of data stored in cache
 */
class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttl: number; // Time to live in milliseconds

  /**
   * Create a new cache instance
   * @param ttl - Time to live in milliseconds (default: 30000 = 30 seconds)
   */
  constructor(ttl: number = 30000) {
    this.ttl = ttl;
  }

  /**
   * Get cached data if it exists and hasn't expired
   * @param key - Cache key to retrieve
   * @returns Cached data or null if not found or expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    // Check if entry has expired
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key); // Remove expired entry
      return null;
    }
    
    return entry.data;
  }

  /**
   * Store data in cache with current timestamp
   * @param key - Cache key
   * @param data - Data to cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global cache instances for different data types
// These caches reduce blockchain queries by storing results for 30 seconds
const proofsCache = new SimpleCache<any[]>(30000); // Cache for proof lists (30 seconds TTL)
const agentsCache = new SimpleCache<any[]>(30000); // Cache for agent lists (30 seconds TTL)
const statsCache = new SimpleCache<any>(30000);    // Cache for dashboard statistics (30 seconds TTL)

// Track last queried block numbers for incremental querying
// This avoids querying from block 0 every time, improving performance significantly
// Note: Set to 0 to force full historical query from block 0
let lastQueriedBlockProofs = 0;  // Last block number queried for proofs (0 = query all history)
let lastQueriedBlockAgents = 0;  // Last block number queried for agents (0 = query all history)

// Number of blocks to query for initial scan
// Querying last 50,000 blocks covers approximately 7 days on PassetHub testnet
// This is a balance between completeness and performance
const BLOCKS_TO_QUERY = 50000;

// ============================================================================
// AHIN Service - Core Business Logic
// ============================================================================
/**
 * AHIN Service Class
 * 
 * Core service class that handles all blockchain interactions and business logic.
 * 
 * Responsibilities:
 * - Submit cognitive proofs to blockchain
 * - Query proof and agent data from blockchain
 * - Process blockchain events and convert to API-friendly format
 * - Manage caching and performance optimization
 * - Provide dashboard statistics
 * 
 * Architecture:
 * - Uses ethers.js Contract instances for blockchain interaction
 * - Implements caching layer to reduce redundant queries
 * - Uses parallel processing for improved performance
 * - Implements hybrid data solution (real + mock data)
 */
class AHINService {
  private ledger: ethers.Contract;   // PoCLedger contract instance for proof operations
  private registry: ethers.Contract; // PoCRegistry contract instance for agent management
  private catk: ethers.Contract | null; // CognitiveAssetToken contract instance for token economics
  private anft: ethers.Contract | null; // ActionProofNFT contract instance for NFT statistics
  private wallet: ethers.Wallet;      // Wallet instance for signing transactions

  /**
   * Initialize AHIN Service
   * 
   * Creates contract instances and wallet from environment configuration.
   * Requires PRIVATE_KEY environment variable for transaction signing.
   * 
   * @throws Error if PRIVATE_KEY is not configured
   */
  constructor() {
    // Load private key from environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }
    
    // Create wallet instance for signing transactions
    this.wallet = new ethers.Wallet(privateKey, provider);
    
    // Initialize contract instances with ABI and addresses
    this.ledger = new ethers.Contract(CONFIG.LEDGER_ADDRESS, LEDGER_ABI, this.wallet);
    this.registry = new ethers.Contract(CONFIG.REGISTRY_ADDRESS, REGISTRY_ABI, this.wallet);
    
    // Initialize CATK and ANFT contracts if addresses are configured
    if (CONFIG.CATK_ADDRESS) {
      this.catk = new ethers.Contract(CONFIG.CATK_ADDRESS, CATK_ABI, provider);
      console.log(`✅ CATK contract initialized at: ${CONFIG.CATK_ADDRESS}`);
    } else {
      this.catk = null;
      console.log('⚠️  CATK_ADDRESS not configured, token economics will use mock data');
    }
    
    if (CONFIG.ANFT_ADDRESS) {
      this.anft = new ethers.Contract(CONFIG.ANFT_ADDRESS, ANFT_ABI, provider);
      console.log(`✅ ANFT contract initialized at: ${CONFIG.ANFT_ADDRESS}`);
    } else {
      this.anft = null;
      console.log('⚠️  ANFT_ADDRESS not configured, NFT statistics will use mock data');
    }
  }
  
  /**
   * Get Token Economics Data (Real Data from Contracts)
   * 
   * Fetches real token economics data from CATK and ANFT contracts including:
   * - Total supply and circulating supply of CATK
   * - Total minted ANFTs
   * - Staked amounts (if available)
   * 
   * @returns Object with token economics metrics
   */
  async getTokenEconomics(): Promise<any> {
    try {
      let catkData: any = null;
      let anftData: any = null;
      
      // Fetch CATK data
      if (this.catk) {
        try {
          const [totalSupply, decimals, name, symbol] = await Promise.all([
            this.catk.totalSupply().catch(() => null),
            this.catk.decimals().catch(() => 18),
            this.catk.name().catch(() => 'CATK'),
            this.catk.symbol().catch(() => 'CATK')
          ]);
          
          if (totalSupply) {
            const decimalsNum = Number(decimals);
            const totalSupplyFormatted = ethers.formatUnits(totalSupply, decimalsNum);
            const totalSupplyNum = parseFloat(totalSupplyFormatted);
            
            catkData = {
              totalSupply: totalSupplyNum,
              totalSupplyFormatted: this.formatLargeNumber(totalSupplyNum),
              decimals: decimalsNum,
              name,
              symbol
            };
            
            console.log(`📊 CATK: Total supply = ${catkData.totalSupplyFormatted} ${symbol}`);
          }
        } catch (e: any) {
          console.log(`⚠️  Error fetching CATK data: ${e.message}`);
        }
      }
      
      // Fetch ANFT data (count total minted NFTs)
      if (this.anft) {
        try {
          // Try to get totalSupply if available
          let totalMinted = null;
          try {
            totalMinted = await this.anft.totalSupply();
            totalMinted = Number(totalMinted);
          } catch {
            // If totalSupply not available, try to query Transfer events to count
            // This is a fallback method
            console.log('📊 ANFT: totalSupply() not available, using Transfer event counting');
            
            // Query Transfer events from block 0 to estimate minted NFTs
            // Note: This counts all transfers, but we can estimate by counting mints (from address(0))
            // Transfer event signature: Transfer(address,address,uint256)
            const transferTopic = ethers.id('Transfer(address,address,uint256)');
            const zeroAddressTopic = ethers.zeroPadValue(ethers.ZeroAddress, 32); // from address = 0 (mint)
            
            const events = await provider.getLogs({
              address: CONFIG.ANFT_ADDRESS,
              topics: [transferTopic, zeroAddressTopic], // Filter by Transfer event with from = address(0)
              fromBlock: 0
            });
            totalMinted = events.length;
          }
          
          if (totalMinted !== null) {
            anftData = {
              totalMinted: totalMinted,
              totalMintedFormatted: this.formatLargeNumber(totalMinted)
            };
            console.log(`📊 ANFT: Total minted = ${anftData.totalMintedFormatted}`);
          }
        } catch (e: any) {
          console.log(`⚠️  Error fetching ANFT data: ${e.message}`);
        }
      }
      
      // Calculate additional metrics
      const result: any = {
        catkPrice: '$2.45', // Price not available on-chain, use mock
        totalStaked: '125K', // Staking data not directly available, use mock for now
        anftsMinted: anftData ? `${anftData.totalMintedFormatted}` : '45.2K',
        volume24h: '$156K', // Volume not available on-chain, use mock
        metrics: {
          totalSupply: catkData ? catkData.totalSupplyFormatted : '1,000,000',
          circulating: catkData ? this.formatLargeNumber(catkData.totalSupply * 0.75) : '750,000', // Estimate 75% circulating
          staked: '125,000', // Not directly queryable, use mock
          burned: '5,000', // Not directly queryable, use mock
          marketCap: catkData ? this.formatLargeNumber(catkData.totalSupply * 2.45 * 0.75) : '$1.84M' // Estimate
        },
        dataSource: {
          catk: catkData ? 'real' : 'mock',
          anft: anftData ? 'real' : 'mock',
          price: 'mock', // Price always mock (not on-chain)
          volume: 'mock', // Volume always mock (not on-chain)
          staked: 'mock' // Staking always mock (requires additional contract queries)
        }
      };
      
      return result;
    } catch (error: any) {
      console.error('Error getting token economics:', error);
      // Return mock data on error
      return {
        catkPrice: '$2.45',
        totalStaked: '125K',
        anftsMinted: '45.2K',
        volume24h: '$156K',
        metrics: {
          totalSupply: '1,000,000',
          circulating: '750,000',
          staked: '125,000',
          burned: '5,000',
          marketCap: '$1.84M'
        },
        dataSource: {
          catk: 'mock',
          anft: 'mock',
          price: 'mock',
          volume: 'mock',
          staked: 'mock'
        }
      };
    }
  }
  
  /**
   * Format Large Numbers for Display
   * 
   * Converts large numbers to human-readable format (e.g., 1000000 -> "1M").
   * 
   * @param num - Number to format
   * @returns Formatted string
   */
  private formatLargeNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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
        console.log(`⚠️  Could not parse log: ${e?.message || e}`);
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
    } catch (error: any) {
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

  /**
   * Get all proofs (paginated) - Optimized version: fast staged querying strategy
   * 
   * This method retrieves proof submissions from the blockchain with performance optimizations:
   * - Uses caching to avoid redundant blockchain queries (30-second TTL)
   * - Fast staged querying: queries from block 0 to get all historical data
   * - Uses timeout mechanism (60 seconds) to prevent blocking
   * - Processes events in parallel batches for improved performance
   * - Supports time range filtering for efficient data retrieval
   * 
   * @param limit - Maximum number of proofs to return (default: 50)
   * @param offset - Number of proofs to skip for pagination (default: 0)
   * @param startTime - Optional start timestamp (Unix timestamp in seconds) for filtering
   * @param endTime - Optional end timestamp (Unix timestamp in seconds) for filtering
   * @returns Array of proof objects with metadata, status, and timestamps
   */
  async getAllProofs(
    limit: number = 50, 
    offset: number = 0,
    startTime?: number,  // Unix timestamp in seconds
    endTime?: number     // Unix timestamp in seconds
  ): Promise<any[]> {
    try {
      // Check cache first to avoid redundant blockchain queries
      // Include time range in cache key to ensure different time ranges get different cached data
      const cacheKey = `proofs_${limit}_${offset}_${startTime || 'all'}_${endTime || 'all'}`;
      const cached = proofsCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Returning cached proofs (${cached.length} items)`);
        return cached;
      }

      const currentBlock = await provider.getBlockNumber();
      
      // Query from block 0 to get all historical data
      // This ensures we retrieve all proofs that were ever submitted
      const fromBlock = 0;
      
      console.log(`🔍 Querying proofs from block ${fromBlock} to ${currentBlock} (total ${currentBlock} blocks)`);
      
      // Query with timeout to prevent blocking
      const queryPromise = this.ledger.queryFilter(
        this.ledger.filters.ProofSubmitted(), 
        fromBlock, 
        'latest'
      );
      
      // 60 second timeout for querying
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 60000)
      );
      
      let events: any[] = [];
      try {
        events = await Promise.race([queryPromise, timeoutPromise]) as any[];
        console.log(`📊 Stage 1: Found ${events.length} ProofSubmitted events in recent blocks`);
        
        // If found events in recent blocks, use them (fast path)
        if (events.length > 0) {
          // Process and return recent events
        } else {
          // Stage 2: No events in recent blocks, query full history (but limit to avoid too slow)
          // Only expand if explicitly needed (e.g., user searches for old data)
          console.log(`⚠️  No events in recent blocks, but skipping full history query for performance`);
          // For now, return empty and let frontend show mock data
        }
      } catch (error: any) {
        if (error.message === 'Query timeout') {
          console.log(`⏱️  Query timeout, returning empty array (will use mock data)`);
          return [];
        }
        throw error;
      }
      
      // If no events found, return empty (frontend will show mock data)
      if (events.length === 0) {
        console.log('⚠️  No events in recent blocks, returning empty array (frontend will show mock data)');
        return [];
      }
      
      // Update last queried block number
      lastQueriedBlockProofs = currentBlock;
      
      // Process events in parallel batches (limit concurrency to avoid overload)
      const proofs: any[] = [];
      const BATCH_SIZE = 10; // Process 10 events per batch
      const eventsToProcess = events.slice(offset, offset + limit);
      
      // Process events with timeout protection
      const processStartTime = Date.now();
      const PROCESS_TIMEOUT = 60000; // 60 seconds total for processing
      
      for (let i = 0; i < eventsToProcess.length; i += BATCH_SIZE) {
        // Check timeout
        if (Date.now() - processStartTime > PROCESS_TIMEOUT) {
          console.log(`⏱️  Processing timeout, returning ${proofs.length} proofs found so far`);
          break;
        }
        
        const batch = eventsToProcess.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (event) => {
          const eventLog = event as any;
          const proofId = eventLog.args?.proofId;
          
          try {
            if (!proofId) return null;
            
            // Parallel fetch proof and agent info with timeout
            const fetchPromise = Promise.allSettled([
              this.getProof(proofId),
              this.registry.getAgent(eventLog.args?.cid || '0x0').catch(() => null)
            ]);
            const fetchTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Fetch timeout')), 60000)
            );
            
            const [proof, agentResult] = await Promise.race([fetchPromise, fetchTimeout]) as any[];
            
            if (proof.status !== 'fulfilled') return null;
            const proofData = proof.value;
            
            // Get agent name
            let agentName = `Agent-${proofData.cid.slice(0, 8)}`;
            if (agentResult && agentResult.status === 'fulfilled' && agentResult.value?.agentAddr) {
              const addr = agentResult.value.agentAddr;
              agentName = `Agent-${addr.slice(0, 6)}...${addr.slice(-4)}`;
            }
            
            // Calculate time ago
            const timestamp = Number(proofData.timestamp) * 1000;
            const now = Date.now();
            const diffMs = now - timestamp;
            const diffMins = Math.floor(diffMs / 60000);
            const timeAgo = diffMins < 1 ? 'just now' : 
                           diffMins < 60 ? `${diffMins}m ago` :
                           Math.floor(diffMins / 60) < 24 ? `${Math.floor(diffMins / 60)}h ago` :
                           `${Math.floor(diffMins / 1440)}d ago`;
            
            const statusMap = ['pending', 'verified', 'rejected'];
            return {
              id: proofId,
              agent: agentName,
              status: statusMap[proofData.status] || 'pending',
              value: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}K`,
              time: timeAgo,
              validators: proofData.attestedBy.length,
              cid: proofData.cid,
              metadataCID: proofData.metadataCID,
              timestamp: proofData.timestamp.toString(),
              isReal: true
            };
          } catch (e: any) {
            if (e.message === 'Fetch timeout') {
              console.log(`⏱️  Fetch timeout for proof ${proofId || 'unknown'}, skipping`);
            } else {
              console.log(`Error processing proof event: ${e?.message || e}`);
            }
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        proofs.push(...batchResults.filter(p => p !== null) as any[]);
      }
      
          // Apply time range filter if provided
          let filteredProofs = proofs;
          if (startTime !== undefined || endTime !== undefined) {
            const startMs = startTime ? startTime * 1000 : 0;
            const endMs = endTime ? endTime * 1000 : Date.now();
            
            filteredProofs = proofs.filter((proof: any) => {
              // Parse timestamp (stored as string in seconds, convert to milliseconds)
              const proofTimestamp = parseInt(proof.timestamp) * 1000;
              return proofTimestamp >= startMs && proofTimestamp <= endMs;
            });
            
            console.log(`⏰ Time filter applied: ${filteredProofs.length} proofs within time range (from ${proofs.length} total)`);
            
            // If no proofs in time range, fall back to all proofs (ignore time filter)
            if (filteredProofs.length === 0 && proofs.length > 0) {
              console.log(`⚠️  No proofs in specified time range, returning all ${proofs.length} proofs`);
              filteredProofs = proofs;
            }
          }
          
          // Cache and return real data if found
          if (filteredProofs.length > 0) {
            console.log(`✅ Found ${filteredProofs.length} real proofs from chain`);
            proofsCache.set(cacheKey, filteredProofs);
            return filteredProofs;
          }
      
      // Return empty array (frontend will show mock data)
      console.log('⚠️  No real proofs processed, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Error querying proofs from chain:', error);
      return [];
    }
  }

  /**
   * Get agent information
   */
  async getAgent(cid: string): Promise<any> {
    const agent = await this.registry.getAgent(cid);
    return {
      cid,
      agentAddr: agent.agentAddr,
      agentMetaHash: agent.agentMetaHash,
      registeredAt: agent.registeredAt.toString(),
      active: agent.active,
      stakeAmount: agent.stakeAmount.toString()
    };
  }

  /**
   * Get all agents - Optimized version: fast staged querying strategy
   * 
   * This method retrieves registered agents from the blockchain with performance optimizations:
   * - Uses caching to avoid redundant blockchain queries (30-second TTL)
   * - Fast staged querying: first queries recent blocks (50000), with timeout protection
   * - Uses timeout mechanism (60 seconds) to prevent blocking
   * - Calculates ChainRank and proof counts for each agent
   * 
   * @returns Array of agent objects with metadata, status, ChainRank, and proof counts
   */
  async getAllAgents(): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = 'agents_all';
      const cached = agentsCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Returning cached agents (${cached.length} items)`);
        return cached;
      }

      const currentBlock = await provider.getBlockNumber();
      
      // Query from block 0 to get all historical data
      // This ensures we retrieve all agents that were ever registered
      const fromBlock = 0;
      
      console.log(`🔍 Querying agents from block ${fromBlock} to ${currentBlock} (total ${currentBlock} blocks)`);
      
      // Query with timeout
      const queryPromise = this.registry.queryFilter(
        this.registry.filters.AgentRegistered(),
        fromBlock,
        'latest'
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 60000)
      );
      
      let events: any[] = [];
      try {
        events = await Promise.race([queryPromise, timeoutPromise]) as any[];
        console.log(`📊 Stage 1: Found ${events.length} AgentRegistered events in recent blocks`);
        
        if (events.length === 0) {
          console.log('⚠️  No events in recent blocks, returning empty array (frontend will show mock data)');
          return [];
        }
      } catch (error: any) {
        if (error.message === 'Query timeout') {
          console.log(`⏱️  Query timeout, returning empty array (will use mock data)`);
          return [];
        }
        throw error;
      }
      
      lastQueriedBlockAgents = currentBlock;

      // Query proof events for counting (with timeout)
      let allProofEvents: any[] = [];
      try {
        const proofFilter = this.ledger.filters.ProofSubmitted();
        const proofQueryPromise = this.ledger.queryFilter(proofFilter, fromBlock, 'latest');
        const proofTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Proof query timeout')), 60000)
        );
        allProofEvents = await Promise.race([proofQueryPromise, proofTimeout]) as any[];
        console.log(`📊 Found ${allProofEvents.length} ProofSubmitted events for counting`);
      } catch (e: any) {
        console.log(`⚠️  Error querying proofs for counting: ${e?.message || e}`);
        // Continue without proof counts
      }
      
      // Process agent events in parallel with timeout protection
      const agents: any[] = [];
      const BATCH_SIZE = 10;
      const processStartTime = Date.now();
      const PROCESS_TIMEOUT = 60000; // 60 seconds for processing
      
      for (let i = 0; i < events.length; i += BATCH_SIZE) {
        // Check timeout
        if (Date.now() - processStartTime > PROCESS_TIMEOUT) {
          console.log(`⏱️  Processing timeout, returning ${agents.length} agents found so far`);
          break;
        }
        
        const batch = events.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (event: any) => {
          const eventLog = event as any;
          const cid = eventLog.args?.cid;
          const agentAddr = eventLog.args?.agentAddr;
          
          try {
            if (!cid || !agentAddr) return null;
            
            // Fetch agent with timeout
            const fetchPromise = this.registry.getAgent(cid);
            const fetchTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Fetch timeout')), 60000)
            );
            const agent = await Promise.race([fetchPromise, fetchTimeout]) as any;
            
            // Generate agent name
            const agentName = `agent-${agentAddr.slice(2, 6).toLowerCase()}-${cid.slice(2, 6).toLowerCase()}`;
            
            // Count proofs for this agent
            const proofsCount = allProofEvents.filter((e: any) => 
              e.args && e.args.cid && e.args.cid.toLowerCase() === cid.toLowerCase()
            ).length;

            // Calculate ChainRank
            let chainRank = 50;
            if (proofsCount > 0) {
              chainRank = Math.min(99, 50 + Math.floor(proofsCount / 10) + (agent.active ? 20 : 0));
            }
            
            return {
              cid: cid,
              name: agentName,
              type: agent.active ? 'Active Agent' : 'Inactive Agent',
              status: agent.active ? 'active' : 'inactive',
              chainrank: chainRank,
              proofs: proofsCount,
              agentAddr: agentAddr,
              registeredAt: agent.registeredAt.toString(),
              stakeAmount: agent.stakeAmount.toString(),
              isReal: true
            };
          } catch (e: any) {
            if (e.message === 'Fetch timeout') {
              console.log(`⏱️  Fetch timeout for agent ${cid || 'unknown'}, skipping`);
            } else {
              console.log(`Error processing agent event: ${e?.message || e}`);
            }
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        agents.push(...batchResults.filter(a => a !== null) as any[]);
      }
      
      // Cache and return
      if (agents.length > 0) {
        console.log(`✅ Found ${agents.length} real agents from chain`);
        agentsCache.set(cacheKey, agents);
        return agents;
      }
      
      console.log('⚠️  No real agents processed, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Error querying agents from chain:', error);
      return [];
    }
  }

  /**
   * Get dashboard statistics - Optimized version: fast staged querying with mock data fallback
   * 
   * This method provides comprehensive dashboard statistics with performance optimizations:
   * - Uses caching to avoid redundant blockchain queries (30-second TTL)
   * - Fast staged querying: queries from block 0 to get all historical data, with 60 second timeout protection
   * - Returns mock data immediately if query is slow or fails
   * - Combines real blockchain data with mock data for UI completeness
   * - Supports time range filtering for recentActivity and topAgents
   * 
   * @param startTime - Optional start timestamp (Unix timestamp in seconds) for filtering recentActivity and topAgents
   * @param endTime - Optional end timestamp (Unix timestamp in seconds) for filtering
   * @returns Dashboard statistics object with real and mock data
   */
  async getDashboardStats(
    startTime?: number,  // Unix timestamp in seconds
    endTime?: number     // Unix timestamp in seconds
  ): Promise<any> {
    try {
      // Check cache first, but include time range in cache key to avoid stale data
      const cacheKey = `dashboard_stats_${startTime || 'all'}_${endTime || 'all'}`;
      const cached = statsCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Returning cached dashboard stats for time range`);
        return cached;
      }

      // Return mock data immediately for fast response
      // Real data will be loaded asynchronously and merged
      const mockStats = {
        totalProofsToday: 1247,
        activeAgents: 892,
        validatorsOnline: '5/5',
        avgVerificationTime: '2.3s',
        proofVolume24h: [45, 52, 48, 65, 59, 67, 72, 68, 75, 82, 78, 85, 90, 88, 95, 92, 98, 94, 87, 89, 85, 83, 78, 76],
        systemHealth: {
          blockchain: 99,
          ipfs: 97,
          validatorNetwork: 100,
          apiServices: 98
        },
        recentActivity: [],
        topAgents: [],
        dataSource: {
          proofs: 'mock',
          agents: 'mock',
          other: 'mock'
        }
      };

      let totalProofs = 0;
      let activeAgentsCount = 0;
      const recentActivity: any[] = [];
      
      try {
        // Query from block 0 to get all historical data
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = 0;
        console.log(`🔍 Dashboard: Querying from block ${fromBlock} to ${currentBlock} (total ${currentBlock} blocks)`);
        
        // Query with timeout (60 seconds)
        const queryPromise = Promise.all([
          this.ledger.queryFilter(this.ledger.filters.ProofSubmitted(), fromBlock, 'latest'),
          this.registry.queryFilter(this.registry.filters.AgentRegistered(), fromBlock, 'latest')
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 60000)
        );
        
        const [proofEvents, agentEvents] = await Promise.race([queryPromise, timeoutPromise]) as any[];
        
        console.log(`📊 Dashboard: Found ${proofEvents.length} ProofSubmitted events, ${agentEvents.length} AgentRegistered events`);
        
        const now = Date.now();
        const todayStart = Math.floor(now / 86400000) * 86400000;
        
        // Process recent events to build recentActivity（优化：区块时间初筛 + 限量并发 getProof）
        const MAX_CANDIDATES = 120; // 只看最新 120 条事件
        const MAX_RESULTS = 20;     // 最多取 20 条进入下一步
        const CONCURRENCY = 6;      // getProof 并发上限

        const recentEvents = proofEvents.slice(-MAX_CANDIDATES).reverse();

        // 并发获取区块时间，作为初筛依据
        const blockTimeResults: { proofId: string; ts: number }[] = [];
        const blockBatchSize = 12;
        for (let i = 0; i < recentEvents.length; i += blockBatchSize) {
          const batch = recentEvents.slice(i, i + blockBatchSize);
          const part = await Promise.all(batch.map(async (e: any) => {
            try {
              const eventLog = e as any;
              const proofId = eventLog.args?.proofId as string;
              if (!proofId) return null;
              const b = await provider.getBlock(e.blockNumber);
              if (!b || b.timestamp == null) return null;
              return { proofId, ts: Number(b.timestamp) * 1000 };
            } catch { return null; }
          }));
          blockTimeResults.push(...(part.filter(Boolean) as any[]));
        }

        // 时间过滤（若提供 start/end），再按时间倒序截取前 N 条
        const startMs = startTime ? startTime * 1000 : 0;
        const endMs = endTime ? endTime * 1000 : now;
        const filtered = (startTime !== undefined || endTime !== undefined)
          ? blockTimeResults.filter(r => r.ts >= startMs && r.ts <= endMs)
          : blockTimeResults;

        const top = filtered.sort((a, b) => b.ts - a.ts).slice(0, MAX_RESULTS);

        // 对最终入选的少量项并发 getProof（限流）
        const detailChunks: { proofId: string; ts: number }[][] = [];
        for (let i = 0; i < top.length; i += CONCURRENCY) detailChunks.push(top.slice(i, i + CONCURRENCY));

        for (const chunk of detailChunks) {
          const details = await Promise.all(chunk.map(async (item) => {
            try {
              const proof = await this.getProof(item.proofId);
              return { proofId: item.proofId, ts: item.ts, proof };
            } catch { return null; }
          }));

          for (const d of details) {
            if (!d) continue;
            // 统计今日 proof
            if (d.ts >= todayStart) {
              if (!startTime || d.ts >= startMs) totalProofs++;
            }
            if (recentActivity.length < 10) {
              const timeAgo = Math.floor((now - d.ts) / 60000);
              recentActivity.push({
                type: 'proof',
                msg: `Proof ${d.proofId.slice(0, 10)}... verified`,
                time: timeAgo < 1 ? 'just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`,
                timestamp: d.ts,
                isReal: true
              });
            }
          }
        }
        
        // Count proofs today (use block timestamps, limit queries for speed)
        const uniqueProofsToday = new Set<string>();
        const proofEventsToCheck = proofEvents.slice(-100); // Only check last 100 events for speed
        for (const event of proofEventsToCheck) {
          try {
            const block = await provider.getBlock(event.blockNumber).catch(() => null);
            if (block && block.timestamp) {
              const eventTime = Number(block.timestamp) * 1000;
              if (eventTime >= todayStart) {
                const eventLog = event as any;
                const proofId = eventLog.args?.proofId;
                if (proofId) {
                  uniqueProofsToday.add(proofId);
                }
              }
            }
          } catch (e: any) {
            // Ignore errors
          }
        }
        totalProofs = uniqueProofsToday.size;
        
        // Query agent status in parallel (limit to first 20 for speed)
        const agentPromises = agentEvents.slice(0, 20).map(async (event: any) => {
          try {
            const eventLog = event as any;
            const cid = eventLog.args?.cid;
            if (!cid) return 0;
            const agent = await this.registry.getAgent(cid);
            return agent.active ? 1 : 0;
          } catch (e: any) {
            return 0;
          }
        });
        
        const agentResults = await Promise.all(agentPromises);
        activeAgentsCount = agentResults.reduce((sum: number, val: number | null) => sum + (val || 0), 0);
        
      } catch (error: any) {
        if (error.message === 'Query timeout') {
          console.log('⏱️  Dashboard query timeout, returning mock data for fast response');
        } else {
          console.log('⚠️  Error querying real stats, using mock data:', error?.message || error);
        }
      }
      
      // Get top agents from real data if available
      // Note: For accurate time-based filtering of agent proofs, we would need to filter
      // proofs by time range and then count them per agent. For now, we use all agents
      // and their total proof counts, applying time filter to proofs if needed in future.
      let topAgents: any[] = [];
      try {
        const agents = await this.getAllAgents();
        if (agents.length > 0 && agents.some((a: any) => a.isReal)) {
          // Use real agents data for top agents
          let realAgents = agents
            .filter((a: any) => a.isReal && a.chainrank !== undefined);
          
          // If time range is provided, we should count proofs within that range per agent
          // For now, we'll use total proof counts and filter the list
          // Future enhancement: Query proofs within time range and group by agent
          
          realAgents = realAgents
            .sort((a: any, b: any) => (b.chainrank || 0) - (a.chainrank || 0))
            .slice(0, 10)
            .map((agent: any, index: number) => ({
              rank: index + 1,
              name: agent.name,
              chainrank: agent.chainrank || 0,
              proofs: agent.proofs || 0,
              isReal: true
            }));
          topAgents = realAgents;
        }
      } catch (e: any) {
        console.log('Error getting top agents:', e?.message || e);
        // topAgents remains empty if error
      }

      // Merge real data with mock data - NEVER modify real data, only use mock as fallback
      const stats = {
        // Use real data if available, otherwise use mock (real data is NEVER modified)
        totalProofsToday: totalProofs > 0 ? totalProofs : mockStats.totalProofsToday,
        activeAgents: activeAgentsCount > 0 ? activeAgentsCount : mockStats.activeAgents,
        // System metrics always use mock (no real data source)
        validatorsOnline: mockStats.validatorsOnline,
        avgVerificationTime: mockStats.avgVerificationTime,
        proofVolume24h: mockStats.proofVolume24h,
        systemHealth: mockStats.systemHealth,
        // Use real activity if available (already filtered by time range during processing)
        recentActivity: recentActivity.slice(0, 10), // Limit to 10 most recent (already filtered)
        // Use real top agents if available, otherwise empty array (don't use mock top agents)
        topAgents: topAgents.length > 0 ? topAgents : [],
        dataSource: {
          proofs: totalProofs > 0 ? 'real' : 'mock',
          agents: activeAgentsCount > 0 ? 'real' : 'mock',
          recentActivity: recentActivity.length > 0 ? 'real' : 'none',
          topAgents: topAgents.length > 0 ? 'real' : 'none',
          other: 'mock'
        }
      };
      
      // Cache result with time range in key (already set in cacheKey above)
      statsCache.set(cacheKey, stats);
      console.log(`💾 Cached dashboard stats for time range: ${startTime ? new Date(startTime * 1000).toISOString().split('T')[0] : 'all'} to ${endTime ? new Date(endTime * 1000).toISOString().split('T')[0] : 'all'}`);
      
      return stats;
    } catch (error: any) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
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

// ============================================================================
// Frontend API Endpoints
// ============================================================================

/**
 * GET /api/dashboard/stats/quick - Get quick dashboard statistics (mock data only)
 * Returns instant mock data for fast initial page load without waiting for blockchain queries.
 * This endpoint provides all non-activity stats that don't require real-time blockchain data.
 * 
 * @returns {Object} Quick mock dashboard stats for instant UI rendering
 */
app.get('/api/dashboard/stats/quick', async (req, res) => {
  try {
    // Return instant mock data for fast response
    const mockStats = {
      totalProofsToday: 1247,
      activeAgents: 342,
      validatorsOnline: 89,
      avgVerificationTime: '2.3s',
      proofVolume24h: [42, 38, 35, 41, 45, 52, 58, 67, 78, 85, 92, 88, 95, 102, 98, 105, 110, 108, 115, 112, 98, 87, 76, 65],
      systemHealth: [
        { name: 'Blockchain Node', status: 'Healthy', value: 98 },
        { name: 'IPFS Storage', status: 'Healthy', value: 95 },
        { name: 'Validator Network', status: 'Healthy', value: 96 },
        { name: 'API Services', status: 'Healthy', value: 99 }
      ],
      recentActivity: [],
      topAgents: [
        { name: 'agent-f39f-8ce5', proofs: 11, chainrank: 71 },
        { name: 'agent-05ea-3ad5', proofs: 19, chainrank: 71 },
        { name: 'agent-6a86-0fdc', proofs: 1, chainrank: 70 }
      ],
      dataSource: {
        proofs: 'mock',
        agents: 'mock',
        recentActivity: 'loading',
        topAgents: 'mock',
        other: 'mock'
      }
    };
    
    res.json(mockStats);
  } catch (error: any) {
    console.error('Error getting quick dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get quick dashboard stats' });
  }
});

/**
 * GET /api/dashboard/stats/activity - Get recent activity (real data only)
 * Returns only the recent activity feed based on real blockchain events.
 * This endpoint is queried separately to avoid blocking the initial page load.
 * 
 * @query {string} timeRange - Optional time range (1d, 7d, 30d, 90d, all)
 * @query {number} startTime - Optional custom start timestamp (Unix seconds)
 * @query {number} endTime - Optional custom end timestamp (Unix seconds)
 * @returns {Object} Recent activity array with real blockchain data
 */
app.get('/api/dashboard/stats/activity', async (req, res) => {
  try {
    // Parse time range parameters
    let startTime: number | undefined;
    let endTime: number | undefined;
    const timeRange = req.query.timeRange as string || '7d';
    const startTimeParam = req.query.startTime as string;
    const endTimeParam = req.query.endTime as string;
    
    // Handle predefined time ranges or custom date range
    if (startTimeParam && endTimeParam) {
      startTime = parseInt(startTimeParam);
      endTime = parseInt(endTimeParam);
    } else if (timeRange !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      switch (timeRange) {
        case '1d':
          startTime = now - 1 * 24 * 60 * 60;
          endTime = now;
          break;
        case '7d':
          startTime = now - 7 * 24 * 60 * 60;
          endTime = now;
          break;
        case '30d':
          startTime = now - 30 * 24 * 60 * 60;
          endTime = now;
          break;
        case '90d':
          startTime = now - 90 * 24 * 60 * 60;
          endTime = now;
          break;
      }
    }
    
    // Get only recent activity from blockchain
    const stats = await ahinService.getDashboardStats(startTime, endTime);
    
    res.json({
      recentActivity: stats.recentActivity || [],
      topAgents: stats.topAgents || []
    });
  } catch (error: any) {
    console.error('Error getting dashboard activity:', error);
    res.status(500).json({ error: 'Failed to get dashboard activity' });
  }
});

/**
 * GET /api/dashboard/stats - Dashboard statistics
 * 
 * Returns dashboard statistics with optional time range filtering.
 * Always returns data (real or mock) for fast response.
 * Real data is merged with mock data if query is slow or fails.
 * 
 * @param req.query.timeRange - Predefined time range ('1d', '7d', '30d', '90d', 'all') for recentActivity and topAgents (default: '7d')
 * @param req.query.startTime - Custom start timestamp (Unix timestamp in seconds)
 * @param req.query.endTime - Custom end timestamp (Unix timestamp in seconds)
 */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Parse time range parameters
    let startTime: number | undefined;
    let endTime: number | undefined;
    const timeRange = req.query.timeRange as string || '7d'; // Default to 7 days
    const startTimeParam = req.query.startTime as string;
    const endTimeParam = req.query.endTime as string;
    
    // Handle predefined time ranges or custom date range
    if (startTimeParam && endTimeParam) {
      // Custom date range from date picker
      startTime = parseInt(startTimeParam);
      endTime = parseInt(endTimeParam);
    } else if (timeRange !== 'all') {
      // Predefined time ranges
      const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      switch (timeRange) {
        case '7d':
          startTime = now - 7 * 24 * 60 * 60;
          endTime = now;
          break;
        case '30d':
          startTime = now - 30 * 24 * 60 * 60;
          endTime = now;
          break;
        case '90d':
          startTime = now - 90 * 24 * 60 * 60;
          endTime = now;
          break;
      }
    }
    
    const stats = await ahinService.getDashboardStats(startTime, endTime);
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting dashboard stats:', error);
    // Return mock data on error to prevent page from being stuck in loading
    res.json({
      totalProofsToday: 1247,
      activeAgents: 892,
      validatorsOnline: '5/5',
      avgVerificationTime: '2.3s',
      proofVolume24h: [45, 52, 48, 65, 59, 67, 72, 68, 75, 82, 78, 85, 90, 88, 95, 92, 98, 94, 87, 89, 85, 83, 78, 76],
      systemHealth: {
        blockchain: 99,
        ipfs: 97,
        validatorNetwork: 100,
        apiServices: 98
      },
      recentActivity: [],
      topAgents: [],
      dataSource: {
        proofs: 'mock',
        agents: 'mock',
        other: 'mock'
      }
    });
  }
});

/**
 * GET /api/proofs - Get all proofs with filters
 * 
 * Retrieves a list of cognitive proofs, with optional search and status filters.
 * 
 * @param req.query.limit - Maximum number of proofs to return (default: 50)
 * @param req.query.offset - Number of proofs to skip for pagination (default: 0)
 * @param req.query.search - Search term for filtering by proof ID or agent name
 * @param req.query.status - Filter by proof status ('pending', 'verified', 'rejected')
 * @returns Array of proof objects matching the search criteria
 */
app.get('/api/proofs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const statusFilter = req.query.status as string;
    
    // Parse time range parameters
    let startTime: number | undefined;
    let endTime: number | undefined;
    const timeRange = req.query.timeRange as string;
    const startTimeParam = req.query.startTime as string;
    const endTimeParam = req.query.endTime as string;
    
    // Handle predefined time ranges or custom date range
    if (startTimeParam && endTimeParam) {
      // Custom date range from date picker (already Unix timestamp in seconds)
      startTime = parseInt(startTimeParam);
      endTime = parseInt(endTimeParam);
    } else if (timeRange && timeRange !== 'all') {
      // Predefined time ranges
      const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      switch (timeRange) {
        case '7d':
          startTime = now - 7 * 24 * 60 * 60;
          endTime = now;
          break;
        case '30d':
          startTime = now - 30 * 24 * 60 * 60;
          endTime = now;
          break;
        case '90d':
          startTime = now - 90 * 24 * 60 * 60;
          endTime = now;
          break;
      }
    }

    // Get proofs from blockchain with time range filtering (with timeout protection)
    let proofs = await ahinService.getAllProofs(limit, offset, startTime, endTime);

    // Apply search filter if provided
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      proofs = proofs.filter(
        (p: any) =>
          p.id.toLowerCase().includes(lowerCaseSearch) ||
          p.agent.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      proofs = proofs.filter((p: any) => p.status === statusFilter);
    }

    // Return empty array if no real data (frontend will show mock data)
    res.json(proofs);
  } catch (error: any) {
    console.error('Error getting proofs:', error);
    // Return empty array on error (frontend will show mock data instead of error)
    res.json([]);
  }
});

/**
 * GET /api/proofs/:proofId - Get specific proof
 */
app.get('/api/proofs/:proofId', async (req, res) => {
  try {
    const { proofId } = req.params;
    console.log(`🔍 Querying proof details for: ${proofId}`);
    
    // 使用原始proofId，不修改格式（从列表获取的proofId应该是正确的格式）
    // 只确保有0x前缀
    let formattedProofId = proofId;
    if (!proofId.startsWith('0x')) {
      formattedProofId = '0x' + proofId;
    }
    
    console.log(`📝 Formatted proofId: ${formattedProofId}`);
    const proof = await ahinService.getProof(formattedProofId);
    
    // Helper function to convert any value to JSON-serializable format
    const toSerializable = (value: any): any => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (Array.isArray(value)) {
        return value.map(toSerializable);
      }
      if (value && typeof value === 'object') {
        const result: any = {};
        for (const key in value) {
          result[key] = toSerializable(value[key]);
        }
        return result;
      }
      return value;
    };
    
    // Convert BigInt and other types to JSON-serializable format
    // 确保所有BigInt都被转换为字符串
    const proofData = {
      proofId: formattedProofId,
      cid: proof.cid ? (typeof proof.cid === 'bigint' ? proof.cid.toString() : proof.cid) : '',
      inputHash: proof.inputHash ? (typeof proof.inputHash === 'bigint' ? proof.inputHash.toString() : proof.inputHash) : '',
      reasoningHash: proof.reasoningHash ? (typeof proof.reasoningHash === 'bigint' ? proof.reasoningHash.toString() : proof.reasoningHash) : '',
      outputHash: proof.outputHash ? (typeof proof.outputHash === 'bigint' ? proof.outputHash.toString() : proof.outputHash) : '',
      metadataCID: proof.metadataCID || '',
      timestamp: proof.timestamp ? (typeof proof.timestamp === 'bigint' ? proof.timestamp.toString() : String(proof.timestamp)) : '0',
      status: proof.status !== undefined ? Number(proof.status) : 0,
      attestedBy: Array.isArray(proof.attestedBy) 
        ? proof.attestedBy.map((addr: any) => {
            if (typeof addr === 'bigint') return addr.toString();
            if (addr && typeof addr === 'object' && 'toString' in addr) return addr.toString();
            return String(addr);
          })
        : [],
      chainRank: proof.chainRank ? (typeof proof.chainRank === 'bigint' ? proof.chainRank.toString() : String(proof.chainRank)) : '0'
    };
    
    console.log(`✅ Proof details retrieved successfully`);
    res.json(proofData);
  } catch (error: any) {
    console.error('❌ Error getting proof:', error);
    const errorMessage = error?.message || error?.toString() || 'Failed to retrieve proof details';
    res.status(500).json({ 
      error: errorMessage,
      proofId: req.params.proofId 
    });
  }
});

/**
 * GET /api/agents - Get all agents
 * 
 * Retrieves all registered agents. Returns empty array if no real data found
 * (frontend will display mock data).
 */
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await ahinService.getAllAgents();
    // Return empty array if no real data (frontend will show mock data)
    res.json(agents);
  } catch (error: any) {
    console.error('Error getting agents:', error);
    // Return empty array on error (frontend will show mock data instead of error)
    res.json([]);
  }
});

/**
 * GET /api/agents/:cid - Get specific agent
 */
app.get('/api/agents/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const agent = await ahinService.getAgent(cid);
    res.json(agent);
  } catch (error: any) {
    console.error('Error getting agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/validators - Get validator network status
 */
app.get('/api/validators', async (req, res) => {
  try {
    // Mock data - in production, query from chain
    res.json([
      { id: 'validator-1', address: '0xAbCd', status: 'online', attestations: 1247, uptime: 99.8 },
      { id: 'validator-2', address: '0xEfGh', status: 'online', attestations: 1189, uptime: 99.5 },
      { id: 'validator-3', address: '0xIjKl', status: 'online', attestations: 1234, uptime: 99.9 },
      { id: 'validator-4', address: '0xMnOp', status: 'online', attestations: 1201, uptime: 99.7 },
      { id: 'validator-5', address: '0xQrSt', status: 'online', attestations: 1223, uptime: 99.6 }
    ]);
  } catch (error: any) {
    console.error('Error getting validators:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/regulatory/pending - Get pending regulatory reviews
 */
app.get('/api/regulatory/pending', async (req, res) => {
  try {
    // Mock data - in production, query from chain/events
    res.json([
      { id: '0x1a2b', agent: 'Industrial Robot', value: '15K USDC', reason: 'Value threshold', priority: 'high' },
      { id: '0x3c4d', agent: 'Delivery Bot', value: '3.5K USDC', reason: 'Cross-border', priority: 'medium' }
    ]);
  } catch (error: any) {
    console.error('Error getting pending reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/regulatory/approve - Approve proof
 */
app.post('/api/regulatory/approve', async (req, res) => {
  try {
    const { proofId, notes } = req.body;
    // In production, call smart contract
    res.json({ success: true, message: `Proof ${proofId} approved` });
  } catch (error: any) {
    console.error('Error approving proof:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/regulatory/reject - Reject proof
 */
app.post('/api/regulatory/reject', async (req, res) => {
  try {
    const { proofId, reason } = req.body;
    // In production, call smart contract
    res.json({ success: true, message: `Proof ${proofId} rejected: ${reason}` });
  } catch (error: any) {
    console.error('Error rejecting proof:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chainrank/stats - ChainRank statistics - 混合方案
 */
app.get('/api/chainrank/stats', async (req, res) => {
  try {
    // 尝试从真实数据计算
    const agents = await ahinService.getAllAgents();
    
    if (agents.length > 0 && agents.some((a: any) => a.isReal)) {
      // 有真实数据，计算真实统计
      const realAgents = agents.filter((a: any) => a.isReal);
      const chainRanks = realAgents.map((a: any) => a.chainrank || 0);
      const networkAvg = chainRanks.length > 0 
        ? chainRanks.reduce((sum, rank) => sum + rank, 0) / chainRanks.length 
        : 0;
      const topPerformer = chainRanks.length > 0 ? Math.max(...chainRanks) : 0;
      const agentsAbove90 = chainRanks.filter(r => r >= 90).length;
      
      res.json({
        networkAvg: Math.round(networkAvg * 10) / 10,
        topPerformer: topPerformer,
        agentsAbove90: agentsAbove90,
        totalScored: realAgents.length,
        dataSource: 'real'
      });
    } else {
      // 使用模拟数据
      res.json({
        networkAvg: 87.5,
        topPerformer: 98,
        agentsAbove90: 342,
        totalScored: 1247,
        dataSource: 'mock'
      });
    }
  } catch (error: any) {
    console.error('Error getting chainrank stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chainrank/top - Top ranked agents - 混合方案
 */
app.get('/api/chainrank/top', async (req, res) => {
  try {
    // 尝试从真实数据获取
    const agents = await ahinService.getAllAgents();
    
    if (agents.length > 0 && agents.some((a: any) => a.isReal)) {
      // 有真实数据，返回真实排名
      const realAgents = agents
        .filter((a: any) => a.isReal && a.chainrank !== undefined)
        .sort((a: any, b: any) => (b.chainrank || 0) - (a.chainrank || 0))
        .slice(0, 10)
        .map((agent: any, index: number) => ({
          rank: index + 1,
          name: agent.name,
          chainrank: agent.chainrank || 0,
          consistency: Math.min(99, agent.chainrank || 0 + Math.floor(Math.random() * 5)), // 模拟一致性
          density: Math.min(5.0, (agent.proofs || 0) / 20 + 4.0), // 基于证明数量计算密度
          outcome: agent.chainrank || 0 - Math.floor(Math.random() * 3), // 模拟结果
          isReal: true
        }));
      
      res.json(realAgents);
    } else {
      // 使用模拟数据
      res.json([
        { rank: 1, name: 'robot-arm-001', chainrank: 98, consistency: 99, density: 5.0, outcome: 97, isReal: false },
        { rank: 2, name: 'delivery-bot-015', chainrank: 95, consistency: 96, density: 4.8, outcome: 94, isReal: false },
        { rank: 3, name: 'warehouse-ai-007', chainrank: 93, consistency: 94, density: 4.9, outcome: 92, isReal: false },
        { rank: 4, name: 'assembly-unit-023', chainrank: 91, consistency: 92, density: 4.7, outcome: 90, isReal: false }
      ]);
    }
  } catch (error: any) {
    console.error('Error getting top ranked agents:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/compliance/status - Compliance status
 */
app.get('/api/compliance/status', async (req, res) => {
  try {
    res.json({
      kycVerified: 1247,
      amlChecks: 15892,
      flaggedCases: 3,
      reportsGenerated: 24,
      monitoring: {
        chainalysis: { status: 'Active', lastCheck: '2 minutes ago', healthy: true },
        trmLabs: { status: 'Active', lastCheck: '5 minutes ago', healthy: true },
        sanctions: { status: 'Active', lastCheck: '1 minute ago', healthy: true },
        pep: { status: 'Active', lastCheck: '3 minutes ago', healthy: true }
      }
    });
  } catch (error: any) {
    console.error('Error getting compliance status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/economics - Token economics data (Real Data from Contracts)
 * 
 * Returns token economics metrics from CATK (ERC20) and ANFT (ERC721) contracts.
 * Includes real data for total supply, circulating supply, and minted NFTs.
 * Price and volume data remain mock as they are not available on-chain.
 * 
 * @returns {Object} Token economics data with real and mock metrics
 */
app.get('/api/economics', async (req, res) => {
  try {
    const economicsData = await ahinService.getTokenEconomics();
    res.json(economicsData);
  } catch (error: any) {
    console.error('Error getting economics data:', error);
    // Return mock data on error to prevent UI from breaking
    res.json({
      catkPrice: '$2.45',
      totalStaked: '125K',
      anftsMinted: '45.2K',
      volume24h: '$156K',
      metrics: {
        totalSupply: '1,000,000',
        circulating: '750,000',
        staked: '125,000',
        burned: '5,000',
        marketCap: '$1.84M'
      },
      dataSource: {
        catk: 'mock',
        anft: 'mock',
        price: 'mock',
        volume: 'mock',
        staked: 'mock'
      }
    });
  }
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 AHIN Indexer running on port ${CONFIG.PORT}`);
  console.log(`📡 Connected to RPC: ${CONFIG.RPC_URL}`);
  console.log(`📦 IPFS endpoint: ${CONFIG.IPFS_URL}`);
  console.log(`🌐 Frontend API available at http://localhost:${CONFIG.PORT}/api`);
});
