require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');

// === 配置 ===
const RPC_URL = process.env.RPC_URL;
// NFT 合约地址
const CONTRACT_ADDRESS = '0x9E8e3572363469eA1bEdd9a9a674C723CAD7b002';
// 要查询的钱包地址
const TARGET_ADDRESS = '0x07872604428e5a634f012a56f34d0965b9e12388'; // ← 改成要查询的钱包地址

// === 合约 ABI（只需 balanceOf） ===
const ABI = [
  'function balanceOf(address owner) view returns (uint256)'
];

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const balance = await contract.balanceOf(TARGET_ADDRESS);
    console.log(`🎯 钱包地址: ${TARGET_ADDRESS}`);
    console.log(`💎 拥有的 NFT 数量: ${balance.toString()}`);
  } catch (err) {
    console.error('❌ 查询失败:', err);
  }
}

main();
