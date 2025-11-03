#!/usr/bin/env node

/**
 * 前端功能测试脚本
 * 测试所有API调用和组件功能
 */

import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';

const tests = [
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'GET'
  },
  {
    name: 'Dashboard Stats',
    endpoint: '/api/dashboard/stats',
    method: 'GET'
  },
  {
    name: 'Get Proofs',
    endpoint: '/api/proofs',
    method: 'GET'
  },
  {
    name: 'Get Agents',
    endpoint: '/api/agents',
    method: 'GET'
  },
  {
    name: 'Get Validators',
    endpoint: '/api/validators',
    method: 'GET'
  },
  {
    name: 'Get Pending Reviews',
    endpoint: '/api/regulatory/pending',
    method: 'GET'
  },
  {
    name: 'ChainRank Stats',
    endpoint: '/api/chainrank/stats',
    method: 'GET'
  },
  {
    name: 'Top Ranked Agents',
    endpoint: '/api/chainrank/top',
    method: 'GET'
  },
  {
    name: 'Compliance Status',
    endpoint: '/api/compliance/status',
    method: 'GET'
  },
  {
    name: 'Token Economics',
    endpoint: '/api/economics',
    method: 'GET'
  }
];

async function runTests() {
  console.log('🧪 开始测试前端API端点...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    try {
      const url = `${API_BASE_URL}${test.endpoint}`;
      console.log(`Testing: ${test.name} (${test.method} ${test.endpoint})...`);
      
      const response = await axios({
        method: test.method,
        url: url,
        timeout: 5000
      });

      if (response.status === 200 && response.data) {
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data keys: ${Object.keys(response.data).join(', ')}\n`);
        passed++;
        results.push({ test: test.name, status: 'PASS', data: response.data });
      } else {
        console.log(`⚠️  WARNING: ${test.name} - Unexpected response`);
        console.log(`   Status: ${response.status}\n`);
        failed++;
        results.push({ test: test.name, status: 'WARNING', error: 'Unexpected response' });
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ FAIL: ${test.name} - Connection refused (后端服务未启动)`);
      } else if (error.response) {
        console.log(`❌ FAIL: ${test.name} - Status ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || error.message}\n`);
      } else {
        console.log(`❌ FAIL: ${test.name} - ${error.message}\n`);
      }
      failed++;
      results.push({ test: test.name, status: 'FAIL', error: error.message });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`测试总结: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(50) + '\n');

  if (failed === 0) {
    console.log('✅ 所有测试通过！前端功能正常。\n');
    return 0;
  } else if (failed === tests.length) {
    console.log('⚠️  所有测试失败 - 请确保后端服务正在运行\n');
    console.log('启动后端服务:');
    console.log('  source .env.passetHub');
    console.log('  npm run indexer:start\n');
    return 1;
  } else {
    console.log('⚠️  部分测试失败，请检查失败的端点\n');
    return 1;
  }
}

runTests().catch(err => {
  console.error('测试脚本执行错误:', err);
  process.exit(1);
});
