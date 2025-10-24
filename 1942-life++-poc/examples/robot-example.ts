// ============================================================================
// examples/robot-example.ts - Robot SDK Usage Example
// ============================================================================
import { RobotSDK } from '../src/robot-sdk/RobotSDK';

async function main() {
  // Initialize SDK
  const robot = new RobotSDK({
    agentId: 'robot-arm-001',
    ahinEndpoint: 'http://localhost:3000',
    privateKey: process.env.ROBOT_PRIVATE_KEY || ''
  });

  // Capture sensor data
  const sensorData = await robot.captureSensor({
    temperature: 23.5,
    position: { x: 100, y: 200, z: 150 },
    battery: 85,
    velocity: 0.5
  });

  console.log('📊 Sensor data captured:', sensorData);

  // Execute cognitive action with proof
  const result = await robot.executeWithProof({
    input: {
      command: 'move_to',
      target: { x: 150, y: 250, z: 150 },
      speed: 'normal'
    },
    cognitiveFunction: async (input) => {
      // Simulated cognitive decision-making
      const steps = [
        { operation: 'path_planning', evidence: { algorithm: 'A*', waypoints: 5 } },
        { operation: 'collision_check', evidence: { obstacles: 0, safe: true } },
        { operation: 'motion_execution', evidence: { duration: 2.5, success: true } }
      ];

      const output = {
        status: 'completed',
        finalPosition: input.target,
        executionTime: 2.5
      };

      return { steps, output };
    },
    modelMeta: {
      modelName: 'RobotCognitive-V1',
      version: '1.0.0',
      provider: 'LifePlusPlus'
    },
    sensorData
  });

  console.log('✅ Action completed with proof:');
  console.log('  - Output:', result.output);
  console.log('  - Proof ID:', result.proofId);
  console.log('  - Metadata CID:', result.metadataCID);
}

// Run example
if (require.main === module) {
  main().catch(console.error);
}
