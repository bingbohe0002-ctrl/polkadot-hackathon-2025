// ============================================================================
// examples/robot-example.ts - Robot SDK Usage Example
// ============================================================================
/**
 * Robot SDK Usage Example
 * 
 * This file demonstrates how to use the RobotSDK to submit cognitive proofs
 * to the Life++ system. It shows the complete workflow of:
 * 1. Initializing the SDK with agent credentials
 * 2. Capturing sensor data from a robot
 * 3. Executing a cognitive action with full proof chain generation
 * 4. Submitting the proof to the AHIN Indexer for blockchain recording
 * 
 * This example simulates a robot arm executing a movement command, capturing
 * sensor telemetry, and generating a complete reasoning trace that demonstrates
 * the cognitive process behind the action.
 * 
 * Prerequisites:
 * - AHIN Indexer service running on http://localhost:3000
 * - Robot private key configured in ROBOT_PRIVATE_KEY environment variable
 * - Agent registered in the PoCRegistry contract
 * 
 * Usage:
 *   ROBOT_PRIVATE_KEY=0x... ts-node examples/robot-example.ts
 */

import { RobotSDK } from '../src/robot-sdk/RobotSDK';

/**
 * Main example function demonstrating Robot SDK usage
 * 
 * This function demonstrates the complete workflow of using the RobotSDK
 * to capture sensor data and execute cognitive actions with proof generation.
 */
async function main() {
  // Initialize Robot SDK with agent configuration
  // The SDK will use this configuration to sign and submit cognitive events
  const robot = new RobotSDK({
    agentId: 'robot-arm-001',                              // Unique identifier for this robot agent
    ahinEndpoint: 'http://localhost:3000',                // AHIN Indexer API endpoint
    privateKey: process.env.ROBOT_PRIVATE_KEY || ''       // Robot's private key for signing (EVM format)
  });

  // Step 1: Capture sensor data from the robot
  // This simulates capturing telemetry data from physical sensors (temperature, position, battery, velocity)
  // The sensor data will be included in the evidence bundle for the cognitive proof
  const sensorData = await robot.captureSensor({
    temperature: 23.5,                                     // Temperature sensor reading (Celsius)
    position: { x: 100, y: 200, z: 150 },                  // Current 3D position coordinates
    battery: 85,                                          // Battery level (percentage)
    velocity: 0.5                                          // Current velocity (units per second)
  });

  console.log('📊 Sensor data captured:', sensorData);

  // Step 2: Execute cognitive action with full proof chain
  // This demonstrates executing a cognitive function (e.g., path planning, decision-making)
  // and automatically generating a complete proof including reasoning trace and evidence
  const result = await robot.executeWithProof({
    // Input data: the command or task to be executed
    input: {
      command: 'move_to',                                  // Action command: move to target position
      target: { x: 150, y: 250, z: 150 },                  // Target 3D position coordinates
      speed: 'normal'                                      // Movement speed setting
    },
    // Cognitive function: the actual AI/algorithm that performs the cognitive task
    // This function should return both the reasoning steps and the final output
    cognitiveFunction: async (input) => {
      // Simulated cognitive decision-making process
      // In a real scenario, this would call an AI model or complex algorithm
      const steps = [
        // Step 1: Path planning - determining the optimal path to the target
        { 
          operation: 'path_planning', 
          evidence: { algorithm: 'A*', waypoints: 5 }     // Evidence: path planning algorithm used
        },
        // Step 2: Collision check - verifying the path is safe
        { 
          operation: 'collision_check', 
          evidence: { obstacles: 0, safe: true }           // Evidence: no obstacles detected
        },
        // Step 3: Motion execution - actually moving to the target
        { 
          operation: 'motion_execution', 
          evidence: { duration: 2.5, success: true }       // Evidence: execution completed successfully
        }
      ];

      // Final output: the result of the cognitive action
      const output = {
        status: 'completed',                              // Action status
        finalPosition: input.target,                       // Final position reached
        executionTime: 2.5                                  // Time taken to complete (seconds)
      };

      return { steps, output };
    },
    // Model metadata: information about the AI model or algorithm used
    modelMeta: {
      modelName: 'RobotCognitive-V1',                     // Name of the cognitive model
      version: '1.0.0',                                    // Model version
      provider: 'LifePlusPlus'                             // Provider of the model
    },
    sensorData                                             // Include captured sensor data in the proof
  });

  // Step 3: Display results
  // After execution, the proof has been submitted to the blockchain
  // and we receive the proof ID and metadata CID for reference
  console.log('✅ Action completed with proof:');
  console.log('  - Output:', result.output);               // The cognitive action's output
  console.log('  - Proof ID:', result.proofId);            // Unique proof identifier on blockchain
  console.log('  - Metadata CID:', result.metadataCID);    // IPFS CID of the evidence bundle
}

// Run the example if this file is executed directly
// This allows the example to be run standalone: ts-node examples/robot-example.ts
if (require.main === module) {
  main().catch(console.error);
}
