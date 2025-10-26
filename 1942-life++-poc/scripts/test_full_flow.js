const axios = require('axios');
const { ethers } = require('hardhat');
const fs = require('fs');

async function testFullFlow() {
  console.log('🧪 Testing Full Cognitive Proof Flow\n');

  try {
    // 0. 先注册代理到链上
    console.log('0️⃣ Registering agent on blockchain...');
    const deployment = JSON.parse(fs.readFileSync('./deployments/localhost-deployment.json'));
    const [deployer, agent] = await ethers.getSigners();
    
    const catk = await ethers.getContractAt('CognitiveAssetToken', deployment.contracts.CATK);
    const registry = await ethers.getContractAt('PoCRegistry', deployment.contracts.Registry);
    
    // 使用 deployer 注册代理（因为 AHIN Indexer 使用 deployer 的私钥）
    const stakeAmount = ethers.parseEther('100');
    const agentMetaHash = ethers.id('robot-arm-002');
    const tx = await registry.registerAgent(deployer.address, agentMetaHash, stakeAmount);
    const receipt = await tx.wait();
    console.log('✅ Agent registered on blockchain');

    // 1. 检查 AHIN Indexer 健康状态
    console.log('\n1️⃣ Checking AHIN Indexer health...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ AHIN Indexer status:', healthResponse.data.status);

    // 2. 准备认知事件数据
    console.log('\n2️⃣ Preparing cognitive event...');
    const cognitiveEvent = {
      agentId: 'robot-arm-002',
      input: {
        command: 'move_to',
        target: { x: 150, y: 250, z: 150 },
        speed: 'normal'
      },
      reasoning: {
        traceId: 'trace-' + Date.now(),
        modelVersion: '1.0.0',
        steps: [
          {
            stepId: 'step-0',
            timestamp: Date.now(),
            operation: 'path_planning',
            evidenceHash: '0x1234567890abcdef'
          },
          {
            stepId: 'step-1',
            timestamp: Date.now() + 100,
            operation: 'collision_check',
            evidenceHash: '0xabcdef1234567890'
          },
          {
            stepId: 'step-2',
            timestamp: Date.now() + 200,
            operation: 'motion_execution',
            evidenceHash: '0x567890abcdef1234'
          }
        ]
      },
      output: {
        status: 'completed',
        finalPosition: { x: 150, y: 250, z: 150 },
        executionTime: 2.5
      },
      modelMeta: {
        modelName: 'RobotCognitive-V1',
        version: '1.0.0',
        provider: 'LifePlusPlus'
      },
      sensorData: {
        deviceId: 'robot-arm-001',
        timestamp: Date.now(),
        readings: {
          temperature: 23.5,
          position: { x: 100, y: 200, z: 150 },
          battery: 85,
          velocity: 0.5
        },
        signature: 'sensor_signature_hash'
      }
    };

    console.log('✅ Cognitive event prepared');

    // 3. 提交认知事件到 AHIN Indexer
    console.log('\n3️⃣ Submitting cognitive event to AHIN Indexer...');
    const submitResponse = await axios.post('http://localhost:3000/ahin/submit', cognitiveEvent);
    
    if (submitResponse.data.success) {
      console.log('✅ Event submitted successfully!');
      console.log('   - Proof ID:', submitResponse.data.data.proofId);
      console.log('   - Metadata CID:', submitResponse.data.data.metadataCID);
      console.log('   - Transaction Hash:', submitResponse.data.data.txHash);
      
      const proofId = submitResponse.data.data.proofId;
      
      // 4. 查询证明状态
      console.log('\n4️⃣ Querying proof status...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待验证
      
      const proofResponse = await axios.get(`http://localhost:3000/ahin/proof/${proofId}`);
      console.log('✅ Proof status retrieved:');
      console.log('   - Status:', ['PENDING', 'VERIFIED', 'REJECTED'][proofResponse.data.data.status]);
      console.log('   - Attestations:', proofResponse.data.data.attestedBy.length);
      console.log('   - Chain Rank:', proofResponse.data.data.chainRank);
      
    } else {
      console.log('❌ Event submission failed:', submitResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Error during full flow test:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testFullFlow()
  .then(() => {
    console.log('\n✨ Full flow test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
