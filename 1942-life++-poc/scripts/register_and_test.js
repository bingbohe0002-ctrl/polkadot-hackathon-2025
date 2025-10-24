const { ethers } = require('hardhat');
const fs = require('fs');
const axios = require('axios');

async function registerAndTest() {
  console.log('🔧 Registering agent and testing API\n');

  try {
    // 1. 注册代理
    console.log('1️⃣ Registering agent...');
    const deployment = JSON.parse(fs.readFileSync('./deployments/localhost-deployment.json'));
    const [deployer] = await ethers.getSigners();
    
    const catk = await ethers.getContractAt('CognitiveAssetToken', deployment.contracts.CATK);
    const registry = await ethers.getContractAt('PoCRegistry', deployment.contracts.Registry);
    
    // 注册代理
    const stakeAmount = ethers.parseEther('100');
    const agentMetaHash = ethers.id('test-agent');
    const tx = await registry.registerAgent(deployer.address, agentMetaHash, stakeAmount);
    const receipt = await tx.wait();
    console.log('✅ Agent registered');

    // 2. 测试 API
    console.log('\n2️⃣ Testing API...');
    const cognitiveEvent = {
      agentId: 'test-agent',
      input: { command: 'test' },
      reasoning: {
        traceId: 'test-trace',
        modelVersion: '1.0.0',
        steps: []
      },
      output: { status: 'completed' },
      modelMeta: {
        modelName: 'test-model',
        version: '1.0.0',
        provider: 'test-provider'
      }
    };

    const response = await axios.post('http://localhost:3000/ahin/submit', cognitiveEvent);
    console.log('✅ API Response:', response.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
  }
}

registerAndTest()
  .then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
