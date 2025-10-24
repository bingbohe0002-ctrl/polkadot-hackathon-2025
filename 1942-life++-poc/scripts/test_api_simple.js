const axios = require('axios');

async function testAPISimple() {
  console.log('🧪 Testing AHIN Indexer API (Simple)\n');

  try {
    // 1. 健康检查
    console.log('1️⃣ Health check...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ AHIN Indexer status:', healthResponse.data.status);

    // 2. 准备简单的认知事件
    console.log('\n2️⃣ Preparing cognitive event...');
    const cognitiveEvent = {
      agentId: 'robot-arm-002',
      input: {
        command: 'move_to',
        target: { x: 150, y: 250, z: 150 }
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
          }
        ]
      },
      output: {
        status: 'completed',
        finalPosition: { x: 150, y: 250, z: 150 }
      },
      modelMeta: {
        modelName: 'RobotCognitive-V1',
        version: '1.0.0',
        provider: 'LifePlusPlus'
      }
    };

    console.log('✅ Cognitive event prepared');

    // 3. 提交认知事件
    console.log('\n3️⃣ Submitting cognitive event...');
    const submitResponse = await axios.post('http://localhost:3000/ahin/submit', cognitiveEvent);
    
    if (submitResponse.data.success) {
      console.log('✅ Event submitted successfully!');
      console.log('   - Proof ID:', submitResponse.data.data.proofId);
      console.log('   - Metadata CID:', submitResponse.data.data.metadataCID);
      console.log('   - Transaction Hash:', submitResponse.data.data.txHash);
      
      const proofId = submitResponse.data.data.proofId;
      
      // 4. 查询证明状态
      console.log('\n4️⃣ Querying proof status...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // 等待验证
      
      const proofResponse = await axios.get(`http://localhost:3000/ahin/proof/${proofId}`);
      console.log('✅ Proof status retrieved:');
      console.log('   - Status:', ['PENDING', 'VERIFIED', 'REJECTED'][proofResponse.data.data.status]);
      console.log('   - Attestations:', proofResponse.data.data.attestedBy.length);
      console.log('   - Chain Rank:', proofResponse.data.data.chainRank);
      
    } else {
      console.log('❌ Event submission failed:', submitResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Error during API test:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testAPISimple()
  .then(() => {
    console.log('\n✨ API test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
