// NFTmint.js
require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');

(async () => {
  // ========== 配置 ==========
  const RPC_URL = process.env.RPC_URL;
  const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  if (!RPC_URL) throw new Error('请通过环境变量 RPC_URL 提供 RPC URL');
  if (!OWNER_PRIVATE_KEY) throw new Error('请通过环境变量 OWNER_PRIVATE_KEY 提供 owner 私钥');
  if (!CONTRACT_ADDRESS) throw new Error('请通过环境变量 CONTRACT_ADDRESS 提供合约地址');
  // ==========================

  // 创建 provider 和 wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

  // 合约 ABI，只包含 mint 函数
  const ABI = [
    "function mint(address to, uint8 tier, string uri) external returns (uint256)"
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // ========== 铸造参数 ==========
  const to = '0x313aE8a555d16F2D653440EF19212e9A342Acd0B'; // 接收地址
  const tier = 0; // 0=Bronze, 1=Silver, 2=Gold
  const uri = 'https://harlequin-working-snipe-956.mypinata.cloud/ipfs/bafybeicm34eskwxjkivo4lrtyd2ok4vgroov26fkbqs4wwdnzbjgk7zb24/0.json'; // NFT metadata 地址
  // ============================

  console.log('发送铸造交易...');

  try {
    const tx = await contract.mint(to, tier, uri);
    console.log('✅ txHash:', tx.hash);

    // 等待交易上链
    const receipt = await tx.wait();
    console.log('✅ 铸造成功，区块号:', receipt.blockNumber);
  } catch (err) {
    console.error('❌ 铸造失败:', err);
  }
})();
