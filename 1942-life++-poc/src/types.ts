// ============================================================================
// src/types.ts - Unified Type Definitions
// ============================================================================

// ============================================================================
// Core Cognitive Event Types
// ============================================================================
export interface CognitiveEvent {
  agentId: string;
  input: any;
  reasoning: ReasoningTrace;
  output: any;
  modelMeta: ModelMetadata;
  sensorData?: SensorTelemetry;
  signature?: string;
}

export interface ReasoningTrace {
  traceId: string;
  modelVersion: string;
  steps: ReasoningStep[];
}

export interface ReasoningStep {
  stepId: string;
  timestamp: number;
  operation: string;
  evidenceHash: string;
}

export interface ModelMetadata {
  modelName: string;
  version: string;
  provider: string;
  parameters?: any;
}

export interface SensorTelemetry {
  deviceId: string;
  timestamp: number;
  readings: Record<string, any>;
  signature: string;
}

// ============================================================================
// Blockchain & Contract Types
// ============================================================================
export interface ProofSubmission {
  proofId: string;
  metadataCID: string;
  txHash: string;
}

export interface AgentRegistration {
  agentAddr: string;
  agentMetaHash: string;
  registeredAt: number;
  active: boolean;
  stakeAmount: string;
}

export interface ProofStatus {
  cid: string;
  inputHash: string;
  reasoningHash: string;
  outputHash: string;
  metadataCID: string;
  timestamp: number;
  status: number; // 0: PENDING, 1: VERIFIED, 2: REJECTED
  attestedBy: string[];
  chainRank: number;
}

// ============================================================================
// Service Configuration Types
// ============================================================================
export interface AHINConfig {
  RPC_URL: string;
  LEDGER_ADDRESS: string;
  REGISTRY_ADDRESS: string;
  IPFS_URL: string;
  PORT: number;
  PRIVATE_KEY?: string;
}

export interface ValidatorConfig {
  RPC_URL: string;
  LEDGER_ADDRESS: string;
  VALIDATOR_PRIVATE_KEY: string;
  IPFS_URL: string;
  CHECK_INTERVAL: number;
}

export interface RobotSDKConfig {
  RPC_URL: string;
  LEDGER_ADDRESS: string;
  IPFS_URL: string;
  PRIVATE_KEY: string;
}

// ============================================================================
// API Response Types
// ============================================================================
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  services: {
    blockchain: boolean;
    ipfs: boolean;
  };
}

export interface SubmitEventResponse {
  success: boolean;
  proofId?: string;
  metadataCID?: string;
  txHash?: string;
  error?: string;
}

// ============================================================================
// Evidence Bundle Types
// ============================================================================
export interface EvidenceBundle {
  version: string;
  timestamp: number;
  agentId: string;
  cognitiveEvent: CognitiveEvent;
  evidence: {
    input: any;
    reasoning: ReasoningTrace;
    output: any;
    modelMeta: ModelMetadata;
    sensorData?: SensorTelemetry;
  };
  metadata: {
    bundleHash: string;
    signature?: string;
  };
}

// ============================================================================
// Validation Types
// ============================================================================
export interface ValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  timestamp: number;
}

export interface CATResult {
  syntaxCheck: boolean;
  causalCoherence: boolean;
  intentMatching: boolean;
  adversarialRobustness: boolean;
  overallScore: number;
  timestamp: number;
}
