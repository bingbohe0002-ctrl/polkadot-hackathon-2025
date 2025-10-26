#!/usr/bin/env node

/**
 * 同步合约地址和ABI的脚本
 * 从智能合约项目中自动获取最新的合约地址和ABI
 */

const fs = require('fs');
const path = require('path');

// 路径配置
const CONTRACTS_DIR = path.join(__dirname, '../../deci_court/artifacts/contracts');
const FRONTEND_CONFIG_PATH = path.join(__dirname, '../config/contracts.js');
const ENV_LOCAL_PATH = path.join(__dirname, '../.env.local');

// 从部署脚本输出或artifacts中获取合约地址
function getContractAddresses() {
  // 这里可以从部署脚本的输出文件或其他地方获取地址
  // 暂时返回环境变量中的地址
  return {
    DECICOURT_ADDRESS: process.env.NEXT_PUBLIC_DECI_COURT_ADDRESS,
    JURY_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_JURY_TOKEN_ADDRESS
  };
}

// 从编译产物中获取ABI
function getContractABI(contractName) {
  try {
    const artifactPath = path.join(CONTRACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      return artifact.abi;
    }
  } catch (error) {
    console.error(`Failed to load ABI for ${contractName}:`, error.message);
  }
  return null;
}

// 更新前端配置文件
function updateContractsConfig() {
  try {
    const addresses = getContractAddresses();
    const deciCourtABI = getContractABI('DeciCourt');
    const juryTokenABI = getContractABI('JuryToken');

    if (!deciCourtABI || !juryTokenABI) {
      console.log('Warning: Could not load all ABIs from artifacts. Using existing ABIs.');
      return;
    }

    const configContent = `// 智能合约配置文件 - 自动生成，请勿手动编辑

// DeciCourt 合约 ABI
export const DECICOURT_ABI = ${JSON.stringify(deciCourtABI, null, 2)};

// JuryToken 合约 ABI  
export const JURY_TOKEN_ABI = ${JSON.stringify(juryTokenABI, null, 2)};

// 合约地址和网络配置
export const CONTRACT_CONFIG = {
  DECICOURT_ADDRESS: process.env.NEXT_PUBLIC_DECI_COURT_ADDRESS || '${addresses.DECICOURT_ADDRESS || ''}',
  JURY_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_JURY_TOKEN_ADDRESS || '${addresses.JURY_TOKEN_ADDRESS || ''}',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545',
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337')
};

// 案件状态枚举
export const CASE_STATUS = {
  CREATED: 0,
  VOTING: 1,
  RESOLVING: 2,
  RESOLVED: 3,
  APPEALING: 4,
  APPEAL_RESOLVED: 5
};

// 投票选项枚举
export const VOTE_OPTION = {
  NONE: 0,
  FOR_PLAINTIFF: 1,
  FOR_DEFENDANT: 2
};
`;

    fs.writeFileSync(FRONTEND_CONFIG_PATH, configContent);
    console.log('✅ Contracts configuration updated successfully');
  } catch (error) {
    console.error('❌ Failed to update contracts configuration:', error.message);
  }
}

// 检查环境变量文件
function checkEnvFile() {
  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    console.log('⚠️  .env.local file not found. Creating template...');
    
    const envTemplate = `# 本地测试网环境变量配置
# 请根据实际部署情况填写以下变量

# 本地测试网RPC端点
NEXT_PUBLIC_RPC_URL=http://localhost:8545

# 链ID (本地测试网通常使用31337)
NEXT_PUBLIC_CHAIN_ID=31337

# DeciCourt智能合约地址 (部署后填写)
NEXT_PUBLIC_DECI_COURT_ADDRESS=

# JuryToken智能合约地址 (从部署输出获取)
NEXT_PUBLIC_JURY_TOKEN_ADDRESS=

# 可选：区块浏览器URL (如果有本地区块浏览器)
NEXT_PUBLIC_BLOCK_EXPLORER_URL=http://localhost:8080

# 可选：IPFS网关 (用于存储案件证据)
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/

# 开发模式标志
NEXT_PUBLIC_DEV_MODE=true
`;
    
    fs.writeFileSync(ENV_LOCAL_PATH, envTemplate);
    console.log('✅ Created .env.local template');
  }
}

// 主函数
function main() {
  console.log('🔄 Syncing contract configuration...');
  
  checkEnvFile();
  updateContractsConfig();
  
  console.log('✨ Contract sync completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy your smart contracts');
  console.log('2. Update .env.local with the deployed contract addresses');
  console.log('3. Run this script again to sync the latest ABIs');
}

if (require.main === module) {
  main();
}

module.exports = {
  updateContractsConfig,
  checkEnvFile
};