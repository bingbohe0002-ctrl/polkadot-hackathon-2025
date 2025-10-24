const axios = require('axios');

async function debugAPI() {
  console.log('🔍 Debugging AHIN Indexer API\n');

  try {
    // 1. 健康检查
    console.log('1️⃣ Health check...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health status:', healthResponse.data);

    // 2. 测试最简单的请求
    console.log('\n2️⃣ Testing minimal request...');
    const minimalEvent = {
      agentId: 'test-agent',
      input: { test: 'data' },
      reasoning: {
        traceId: 'test-trace',
        modelVersion: '1.0.0',
        steps: []
      },
      output: { result: 'success' },
      modelMeta: {
        modelName: 'test-model',
        version: '1.0.0',
        provider: 'test-provider'
      }
    };

    console.log('📤 Sending request...');
    const response = await axios.post('http://localhost:3000/ahin/submit', minimalEvent);
    console.log('📥 Response:', response.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Status:', error.response.status);
    }
  }
}

debugAPI()
  .then(() => {
    console.log('\n✨ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
