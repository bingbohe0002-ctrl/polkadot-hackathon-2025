// ClaimRedPacket.js
require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');

(async () => {
  // ========== 配置 ==========
  const RPC_URL = process.env.RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY; // 抢红包用户的私钥
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS_RED;

  if (!RPC_URL) throw new Error('请通过环境变量 RPC_URL 提供 RPC URL');
  if (!PRIVATE_KEY) throw new Error('请通过环境变量 PRIVATE_KEY 提供 PRIVATE_KEY (抢红包账户私钥)');
  if (!CONTRACT_ADDRESS) throw new Error('请通过环境变量 CONTRACT_ADDRESS 提供合约地址');
  // ==========================

  // 创建 provider & wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // ========== 合约 ABI ==========
  const ABI = [
    "function claim(uint256 packetId, uint256 tokenId) external",
    "event PacketClaimed(uint256 indexed packetId, address indexed claimer, uint256 amount)"
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // ========== 抢红包参数 ==========
  const packetId = 2;  // 红包ID（你要抢的红包编号）
  const tokenId = 1;   // NFT的tokenId，用于资格验证（Normal红包可传任意）
  // ==============================

  console.log(`准备抢红包 (packetId=${packetId}, tokenId=${tokenId})...`);

  try {
    const tx = await contract.claim(packetId, tokenId, {
      // gasLimit 可选
      // gasLimit: 300000
    });

    console.log('✅ tx hash:', tx.hash);
    console.log('等待交易上链...');

    const receipt = await tx.wait();
    console.log('✅ 抢红包成功，区块号:', receipt.blockNumber);

    // 解析 PacketClaimed 事件
    let found = false;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'PacketClaimed') {
          found = true;
          console.log('--- 抢红包成功 ---');
          console.log('packetId:', parsed.args.packetId.toString());
          console.log('claimer  :', parsed.args.claimer);
          console.log('amount(wei):', parsed.args.amount.toString());
          console.log('amount(eth):', ethers.formatEther(parsed.args.amount));
          console.log('-----------------');
        }
      } catch (e) { /* 非目标事件忽略 */ }
    }

    if (!found) {
      console.warn('⚠️ 未检测到 PacketClaimed 事件，请确认合约事件是否发出或 ABI 是否完整。');
    }

  } catch (err) {
    console.error('❌ 抢红包失败:', err);
  }
})();
