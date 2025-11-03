// ============================================================================
// src/robot-sdk/RobotSDK.ts - Robot/Digital Twin SDK
// ============================================================================
/**
 * Robot SDK for Life++ PoC
 * 
 * This SDK enables robots, digital twins, and AI agents to submit cognitive proofs
 * to the Life++ system. It provides a simplified interface for:
 * - Capturing sensor data
 * - Building reasoning traces
 * - Submitting cognitive events
 * - Executing cognitive actions with full proof chains
 * 
 * Usage Example:
 * ```typescript
 * const sdk = new RobotSDK({
 *   agentId: 'robot-001',
 *   ahinEndpoint: 'http://localhost:3000',
 *   privateKey: '0x...'
 * });
 * 
 * const result = await sdk.executeWithProof({
 *   input: { command: 'navigate', target: [100, 200] },
 *   cognitiveFunction: async (input) => {
 *     // Your cognitive function implementation here
 *     return { steps: [], output: {} };
 *   },
 *   modelMeta: { modelName: 'GPT-4', version: '1.0', provider: 'OpenAI' }
 * });
 * ```
 */

import axios from 'axios';
import { createSign, createHash } from 'crypto';
import { 
  CognitiveEvent, 
  ReasoningTrace, 
  ModelMetadata, 
  SensorTelemetry,
  RobotSDKConfig 
} from '../types';

/**
 * RobotSDK Class
 * 
 * Provides high-level API for robots and digital twins to interact with the Life++ system.
 * Handles proof creation, evidence bundling, and submission to the AHIN Indexer.
 */
export class RobotSDK {
  private agentId: string;        // Unique identifier for this robot/agent
  private ahinEndpoint: string;   // AHIN Indexer API endpoint URL
  private privateKey: string;      // Private key for signing cognitive events

  /**
   * Initialize Robot SDK
   * 
   * @param config - SDK configuration
   * @param config.agentId - Unique identifier for this robot/agent instance
   * @param config.ahinEndpoint - Base URL of the AHIN Indexer API (e.g., 'http://localhost:3000')
   * @param config.privateKey - EVM private key for signing cognitive events (must be 0x + 64 hex chars)
   */
  constructor(config: {
    agentId: string;
    ahinEndpoint: string;
    privateKey: string;
  }) {
    this.agentId = config.agentId;
    this.ahinEndpoint = config.ahinEndpoint;
    this.privateKey = config.privateKey;
  }

  /**
   * Capture sensor data from robot
   */
  async captureSensor(sensorReadings: Record<string, any>): Promise<SensorTelemetry> {
    const telemetry: SensorTelemetry = {
      deviceId: this.agentId,
      timestamp: Date.now(),
      readings: sensorReadings,
      signature: ''
    };

    // Sign telemetry
    telemetry.signature = this.signData(telemetry);

    return telemetry;
  }

  /**
   * Build reasoning trace for cognitive action
   */
  buildReasoningTrace(
    steps: Array<{ operation: string; evidence: any }>,
    modelVersion: string
  ): ReasoningTrace {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      traceId,
      modelVersion,
      steps: steps.map((step, index) => ({
        stepId: `step-${index}`,
        timestamp: Date.now(),
        operation: step.operation,
        evidenceHash: this.hashData(step.evidence)
      }))
    };
  }

  /**
   * Submit cognitive event to AHIN
   */
  async submitEvent(event: {
    input: any;
    reasoning: ReasoningTrace;
    output: any;
    modelMeta: ModelMetadata;
    sensorData?: SensorTelemetry;
  }): Promise<{ proofId: string; metadataCID: string; txHash: string }> {
    const cognitiveEvent: CognitiveEvent = {
      agentId: this.agentId,
      input: event.input,
      reasoning: event.reasoning,
      output: event.output,
      modelMeta: event.modelMeta,
      sensorData: event.sensorData,
      signature: this.signData(event)
    };

    const response = await axios.post(
      `${this.ahinEndpoint}/ahin/submit`,
      cognitiveEvent
    );

    return response.data.data;
  }

  /**
   * Execute cognitive action with full proof chain
   */
  async executeWithProof(params: {
    input: any;
    cognitiveFunction: (input: any) => Promise<{ steps: any[]; output: any }>;
    modelMeta: ModelMetadata;
    sensorData?: SensorTelemetry;
  }): Promise<{
    output: any;
    proofId: string;
    metadataCID: string;
  }> {
    console.log(`🤖 Executing cognitive action...`);

    // Execute cognitive function
    const { steps, output } = await params.cognitiveFunction(params.input);

    // Build reasoning trace
    const reasoning = this.buildReasoningTrace(steps, params.modelMeta.version);

    // Submit to AHIN
    const result = await this.submitEvent({
      input: params.input,
      reasoning,
      output,
      modelMeta: params.modelMeta,
      sensorData: params.sensorData
    });

    console.log(`✅ Proof created: ${result.proofId}`);

    return {
      output,
      proofId: result.proofId,
      metadataCID: result.metadataCID
    };
  }

  /**
   * Sign data with private key
   */
  private signData(data: any): string {
    const sign = createSign('SHA256');
    sign.update(JSON.stringify(data));
    sign.end();
    return sign.sign(this.privateKey, 'hex');
  }

  /**
   * Hash data
   */
  private hashData(data: any): string {
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
