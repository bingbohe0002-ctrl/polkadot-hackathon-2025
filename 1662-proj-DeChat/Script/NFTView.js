require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');

// === 配置 ===
const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = '0x5b9f2eC8801C4E2Cbf4da95Fc3Ea8b2733dBB49F';
const TOKEN_ID = 7;

// 如果你的 Node 版本 < 18，请先安装 node-fetch
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (e) {
    console.warn('⚠️ Node 没有 fetch，请安装 node-fetch');
  }
}

// === 合约 ABI（仅需这两个函数） ===
const ABI = [
  'function name() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)'
];

// === IPFS 工具函数 ===
function ipfsToHttp(url) {
  if (!url) return url;
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  try {
    const name = await contract.name();
    console.log('🧾 合约名称:', name);

    const tokenURI = await contract.tokenURI(TOKEN_ID);
    console.log('🔗 tokenURI:', tokenURI);

    let metadata;
    if (tokenURI.startsWith('data:application/json;base64,')) {
      // base64 编码的 metadata
      const base64Data = tokenURI.split(',')[1];
      metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf8'));
    } else {
      // ipfs/http 链接
      const url = ipfsToHttp(tokenURI);
      const res = await fetchFn(url);
      metadata = await res.json();
    }

    console.log('📦 NFT 元数据:');
    console.log(JSON.stringify(metadata, null, 2));

    if (metadata.image) {
      console.log('🖼️ 图片链接:', ipfsToHttp(metadata.image));
    }

  } catch (err) {
    console.error('❌ 查询失败:', err);
  }
}

main();
