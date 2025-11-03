/**
 * API Service Layer
 * 
 * This module provides a centralized API client and TypeScript interfaces
 * for all backend API endpoints. It uses axios for HTTP requests and provides
 * type-safe interfaces for request/response data.
 * 
 * @module api
 * @description Frontend API service for communicating with the AHIN Indexer backend
 */

import axios from 'axios';

/**
 * API Base URL Configuration
 * 
 * Reads from environment variable VITE_API_URL if available,
 * otherwise defaults to localhost:3000 for local development.
 * 
 * This allows different API endpoints for development, staging, and production.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Dashboard Statistics Interface
 * 
 * Represents the complete dashboard statistics data structure returned
 * from the /api/dashboard/stats endpoint.
 */
export interface DashboardStats {
  /** Total number of proofs submitted today (UTC calendar day) */
  totalProofsToday: number;
  /** Count of currently active AI agents */
  activeAgents: number;
  /** String representation of validators online (e.g., "5/5") */
  validatorsOnline: string;
  /** Average proof verification time (e.g., "2.3s") */
  avgVerificationTime: string;
  /** Array of 24 hourly proof submission volumes (percentage values) */
  proofVolume24h: number[];
  /** System health metrics (percentage values 0-100) */
  systemHealth: {
    blockchain: number;      // Blockchain node health
    ipfs: number;            // IPFS storage health
    validatorNetwork: number;// Validator network health
    apiServices: number;     // API services health
  };
  /** Recent system activity feed */
  recentActivity: Array<{
    type: string;            // Activity type: 'proof', 'agent', 'regulatory', etc.
    msg: string;             // Human-readable activity message
    time: string;            // Time ago string (e.g., "2h ago", "13d ago")
    isReal?: boolean;        // Flag indicating if this is real blockchain data
  }>;
  /** Top performing agents by ChainRank */
  topAgents: Array<{
    name: string;            // Agent name/identifier
    proofs: number;          // Total proofs submitted by this agent
    chainrank: number;       // ChainRank reputation score
  }>;
  /** Data source indicators for transparency (real vs mock data) */
  dataSource?: {
    proofs: 'real' | 'mock';   // Source of proof data
    agents: 'real' | 'mock';   // Source of agent data
    other: 'real' | 'mock';    // Source of other metrics
  };
}

/**
 * Proof Interface
 * 
 * Represents a cognitive proof entry in the system.
 */
export interface Proof {
  /** Unique proof identifier (bytes32 hash, typically 0x-prefixed hex string) */
  id: string;
  /** Agent name/identifier that submitted this proof */
  agent: string;
  /** Current verification status */
  status: 'verified' | 'pending' | 'rejected';
  /** Estimated value of the proof (e.g., "5.7K USDC") */
  value: string;
  /** Human-readable time ago string (e.g., "2h ago", "13d ago") */
  time: string;
  /** Number of validators that have attested to this proof (out of 5) */
  validators: number;
}

/**
 * Agent Interface
 * 
 * Represents a registered AI agent in the system.
 */
export interface Agent {
  /** Content Identifier (CID) - unique agent identifier */
  cid: string;
  /** Human-readable agent name */
  name: string;
  /** Agent type classification (e.g., "Active Agent", "Inactive Agent") */
  type: string;
  /** Current operational status */
  status: 'active' | 'inactive';
  /** ChainRank reputation score (0-99) */
  chainrank: number;
  /** Total number of proofs submitted by this agent */
  proofs: number;
}

/**
 * Validator Interface
 * 
 * Represents a validator node in the network.
 */
export interface Validator {
  /** Unique validator identifier */
  id: string;
  /** Validator wallet address */
  address: string;
  /** Current online/offline status */
  status: 'online' | 'offline';
  /** Total number of attestations performed */
  attestations: number;
  /** Uptime percentage (0-100) */
  uptime: number;
}

/**
 * Regulatory Proof Interface
 * 
 * Represents a proof pending regulatory review.
 */
export interface RegulatoryProof {
  /** Proof identifier */
  id: string;
  /** Agent that submitted the proof */
  agent: string;
  /** Proof value triggering regulatory review */
  value: string;
  /** Reason for regulatory flagging */
  reason: string;
  /** Review priority level */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Axios Instance Configuration
 * 
 * Pre-configured axios instance with:
 * - Base URL from environment/config
 * - 30 second timeout for all requests
 * - Shared configuration for all API calls
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
});

/**
 * API Service Object
 * 
 * Centralized service object providing typed methods for all backend API endpoints.
 * All methods are async and return Promise-wrapped responses.
 * 
 * @namespace apiService
 */
export const apiService = {
  /**
   * Dashboard API Methods
   * 
   * Get comprehensive dashboard statistics including proof counts,
   * agent counts, system health, and recent activity.
   */

  /**
   * Get Dashboard Statistics (Quick)
   * 
   * Fetches instant mock dashboard statistics for fast initial page load.
   * This endpoint returns immediately with simulated data while real data
   * can be loaded separately via getDashboardActivity().
   * 
   * @returns Promise resolving to DashboardStats object with mock data
   */
  async getDashboardStatsQuick(): Promise<DashboardStats> {
    const response = await api.get('/api/dashboard/stats/quick');
    return response.data;
  },

  /**
   * Get Dashboard Activity (Real Data)
   * 
   * Fetches only the recent activity feed and top agents from blockchain.
   * This is queried separately to avoid blocking the initial page load.
   * 
   * @param params - Optional query parameters for time range filtering
   * @param params.timeRange - Predefined time range ('7d', '30d', '90d', 'all')
   * @param params.startTime - Custom start timestamp (Unix timestamp in seconds)
   * @param params.endTime - Custom end timestamp (Unix timestamp in seconds)
   * @returns Promise resolving to object with recentActivity and topAgents
   */
  async getDashboardActivity(params?: {
    timeRange?: '7d' | '30d' | '90d' | 'all';
    startTime?: number;
    endTime?: number;
  }): Promise<{
    recentActivity: Array<{
      type: string;
      msg: string;
      time: string;
      isReal?: boolean;
    }>;
    topAgents: Array<{
      name: string;
      proofs: number;
      chainrank: number;
    }>;
  }> {
    const response = await api.get('/api/dashboard/stats/activity', { params });
    return response.data;
  },

  /**
   * Get Dashboard Statistics (Full)
   * 
   * Fetches complete dashboard statistics including both mock and real data.
   * This is the legacy endpoint that combines all stats in one request.
   * 
   * @param params - Optional query parameters for time range filtering
   * @param params.timeRange - Predefined time range ('7d', '30d', '90d', 'all')
   * @param params.startTime - Custom start timestamp (Unix timestamp in seconds)
   * @param params.endTime - Custom end timestamp (Unix timestamp in seconds)
   * @returns Promise resolving to DashboardStats object
   */
  async getDashboardStats(params?: {
    timeRange?: '7d' | '30d' | '90d' | 'all';
    startTime?: number;
    endTime?: number;
  }): Promise<DashboardStats> {
    const response = await api.get('/api/dashboard/stats', { params });
    return response.data;
  },

  /**
   * Proof API Methods
   * 
   * Methods for querying and retrieving cognitive proofs from the blockchain.
   */

  /**
   * Get All Proofs with Optional Filters
   * 
   * Retrieves a list of all proofs from the blockchain, optionally filtered by:
   * - search: Search term to match against proof ID or agent name
   * - status: Filter by verification status (verified, pending, rejected)
   * - timeRange: Predefined time range ('7d', '30d', '90d', 'all')
   * - startTime: Custom start timestamp (Unix timestamp in seconds)
   * - endTime: Custom end timestamp (Unix timestamp in seconds)
   * 
   * @param params - Optional query parameters for filtering
   * @param params.search - Search term for proof ID or agent name
   * @param params.status - Filter by proof status
   * @param params.timeRange - Predefined time range
   * @param params.startTime - Custom start timestamp
   * @param params.endTime - Custom end timestamp
   * @returns Promise resolving to array of Proof objects
   */
  async getProofs(params?: { 
    search?: string; 
    status?: string;
    timeRange?: '7d' | '30d' | '90d' | 'all';
    startTime?: number;
    endTime?: number;
  }): Promise<Proof[]> {
    const response = await api.get('/api/proofs', { params });
    return response.data;
  },

  /**
   * Get Proof Details by ID
   * 
   * Fetches detailed information for a specific proof including:
   * - Chain data (CID, hashes, metadata)
   * - Verification status and attestations
   * - Timestamp and ChainRank
   * 
   * @param proofId - Unique proof identifier (bytes32 hash)
   * @returns Promise resolving to detailed proof object
   */
  async getProof(proofId: string) {
    const response = await api.get(`/api/proofs/${proofId}`);
    return response.data;
  },

  /**
   * Agent API Methods
   * 
   * Methods for querying registered AI agents and their information.
   */

  /**
   * Get All Registered Agents
   * 
   * Retrieves a list of all AI agents registered in the system,
   * including their ChainRank scores and proof counts.
   * 
   * @returns Promise resolving to array of Agent objects
   */
  async getAgents(): Promise<Agent[]> {
    const response = await api.get('/api/agents');
    return response.data;
  },

  /**
   * Get Agent Details by CID
   * 
   * Fetches detailed information for a specific agent including:
   * - Agent address and metadata hash
   * - Registration timestamp
   * - Active status and stake amount
   * 
   * @param cid - Content Identifier (unique agent identifier)
   * @returns Promise resolving to detailed agent object
   */
  async getAgent(cid: string): Promise<Agent> {
    const response = await api.get(`/api/agents/${cid}`);
    return response.data;
  },

  /**
   * Validator API Methods
   * 
   * Methods for querying validator network status.
   */

  /**
   * Get Validator Network Status
   * 
   * Retrieves status information for all validators in the network
   * including online/offline status, attestation counts, and uptime.
   * 
   * @returns Promise resolving to array of Validator objects
   */
  async getValidators(): Promise<Validator[]> {
    const response = await api.get('/api/validators');
    return response.data;
  },

  /**
   * Regulatory API Methods
   * 
   * Methods for regulatory oversight and proof review workflows.
   */

  /**
   * Get Pending Regulatory Reviews
   * 
   * Retrieves proofs that require regulatory review, typically flagged
   * due to high value, cross-border transactions, or other compliance triggers.
   * 
   * @returns Promise resolving to array of RegulatoryProof objects
   */
  async getPendingReviews(): Promise<RegulatoryProof[]> {
    const response = await api.get('/api/regulatory/pending');
    return response.data;
  },

  /**
   * Approve Proof (Regulatory Action)
   * 
   * Approves a proof for regulatory compliance. In production, this
   * would trigger smart contract interactions.
   * 
   * @param proofId - Proof identifier to approve
   * @param notes - Optional approval notes for audit trail
   * @returns Promise resolving to approval confirmation
   */
  async approveProof(proofId: string, notes?: string) {
    const response = await api.post(`/api/regulatory/approve`, { proofId, notes });
    return response.data;
  },

  /**
   * Reject Proof (Regulatory Action)
   * 
   * Rejects a proof for regulatory non-compliance. Requires a reason
   * for audit and compliance purposes.
   * 
   * @param proofId - Proof identifier to reject
   * @param reason - Required rejection reason
   * @returns Promise resolving to rejection confirmation
   */
  async rejectProof(proofId: string, reason: string) {
    const response = await api.post(`/api/regulatory/reject`, { proofId, reason });
    return response.data;
  },

  /**
   * ChainRank API Methods
   * 
   * Methods for querying ChainRank reputation scores and analytics.
   */

  /**
   * Get ChainRank Statistics
   * 
   * Retrieves aggregated ChainRank metrics including:
   * - Network average ChainRank
   * - Top performer score
   * - Count of agents above threshold (e.g., 90)
   * - Total agents scored
   * 
   * @returns Promise resolving to ChainRank statistics object
   */
  async getChainRankStats() {
    const response = await api.get('/api/chainrank/stats');
    return response.data;
  },

  /**
   * Get Top Ranked Agents
   * 
   * Retrieves the top-performing agents ranked by ChainRank score,
   * including consistency, density, and outcome metrics.
   * 
   * @returns Promise resolving to array of top-ranked agent objects
   */
  async getTopRankedAgents() {
    const response = await api.get('/api/chainrank/top');
    return response.data;
  },

  /**
   * Compliance API Methods
   * 
   * Methods for KYC/AML compliance monitoring and reporting.
   */

  /**
   * Get Compliance Status
   * 
   * Retrieves compliance monitoring status including:
   * - KYC verification counts
   * - AML check statistics
   * - Flagged cases count
   * - Integration status with Chainalysis, TRM Labs, etc.
   * 
   * @returns Promise resolving to compliance status object
   */
  async getComplianceStatus() {
    const response = await api.get('/api/compliance/status');
    return response.data;
  },

  /**
   * Token Economics API Methods
   * 
   * Methods for querying CATK token and aNFT marketplace data.
   */

  /**
   * Get Token Economics Data
   * 
   * Retrieves token economics metrics including:
   * - CATK price and market cap
   * - Total staked amount
   * - aNFT minting statistics
   * - 24-hour trading volume
   * - Token supply metrics (total, circulating, burned)
   * 
   * @returns Promise resolving to token economics data object
   */
  async getTokenEconomics() {
    const response = await api.get('/api/economics');
    return response.data;
  },

  /**
   * Health Check API Methods
   * 
   * Methods for monitoring system health and availability.
   */

  /**
   * Get System Health Status
   * 
   * Checks the health status of the backend API service.
   * Useful for monitoring and determining if the backend is operational.
   * 
   * @returns Promise resolving to health status object
   */
  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  /**
   * Mock Data Generators
   * 
   * Utility functions to generate mock data when real data is not available
   * or when API calls are slow. This prevents the UI from being stuck in loading state.
   */

  /**
   * Generate Mock Proofs
   * 
   * Creates mock proof data for demonstration purposes when real data is not available.
   * 
   * @param count - Number of mock proofs to generate (default: 10)
   * @returns Array of mock Proof objects
   */
  generateMockProofs(count: number = 10): Proof[] {
    const mockProofs: Proof[] = [];
    const statuses: ('verified' | 'pending' | 'rejected')[] = ['verified', 'pending', 'rejected'];
    const agents = ['robot-arm-001', 'delivery-bot-015', 'warehouse-ai-007', 'assembly-unit-023'];
    
    for (let i = 0; i < count; i++) {
      const timeAgo = i < 3 ? `${i * 5 + 10}m ago` : i < 6 ? `${i - 2}h ago` : `${i - 5}d ago`;
      mockProofs.push({
        id: `0x${Math.random().toString(16).substr(2, 64)}`,
        agent: agents[i % agents.length],
        status: statuses[i % statuses.length],
        value: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}K`,
        time: timeAgo,
        validators: Math.floor(Math.random() * 6)
      });
    }
    return mockProofs;
  },

  /**
   * Generate Mock Agents
   * 
   * Creates mock agent data for demonstration purposes when real data is not available.
   * 
   * @param count - Number of mock agents to generate (default: 5)
   * @returns Array of mock Agent objects
   */
  generateMockAgents(count: number = 5): Agent[] {
    const mockAgents: Agent[] = [];
    const prefixes = ['f39f', 'a1b2', 'c3d4', 'e5f6', '7890'];
    
    for (let i = 0; i < count; i++) {
      const cid = `0x${prefixes[i % prefixes.length]}${Math.random().toString(16).substr(2, 60)}`;
      mockAgents.push({
        cid: cid,
        name: `agent-${prefixes[i % prefixes.length]}-${cid.slice(2, 6)}`,
        type: i < 3 ? 'Active Agent' : 'Inactive Agent',
        status: i < 3 ? 'active' : 'inactive',
        chainrank: Math.floor(Math.random() * 30) + 70,
        proofs: Math.floor(Math.random() * 50) + 10
      });
    }
    return mockAgents;
  },
};
