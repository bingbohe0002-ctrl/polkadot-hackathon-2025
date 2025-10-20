// CreateRedPacket.js
require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');

(async () => {
  // ========== 配置 ==========
  const RPC_URL = process.env.RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS_RED;

  if (!RPC_URL) throw new Error('请通过环境变量 RPC_URL 提供 RPC URL');
  if (!PRIVATE_KEY) throw new Error('请通过环境变量 PRIVATE_KEY 提供私钥');
  if (!CONTRACT_ADDRESS) throw new Error('请通过环境变量 CONTRACT_ADDRESS 提供合约地址');
  // ==========================

  // provider & wallet (ethers v6 风格)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // 合约 ABI（只包含需要的方法和事件）
  const ABI = [
    // createRedPacket(PacketType packetType, uint256 totalShares) payable returns (uint256)
    "function createRedPacket(uint8 packetType, uint256 totalShares) payable returns (uint256)",
    "event PacketCreated(uint256 indexed packetId, address indexed creator, uint8 packetType, uint256 amount)"
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // ========== 发红包参数 ==========
  // packetType: 0 = Normal, 1 = Advanced, 2 = Super
  const packetType = 0;            // 示例：Normal
  const totalShares = 5;           // 分成 5 份
  const totalEther = "10";       // 发 0.05 ETH（字符串）
  // ============================

  console.log('准备发送 createRedPacket tx...');
  try {
    const value = ethers.parseEther(totalEther); // 将 ETH 字符串转为 wei (BigInt)

    const tx = await contract.createRedPacket(packetType, totalShares, {
      value: value,
      // 可选 gasLimit:
      // gasLimit: 400000
    });

    console.log('✅ tx hash:', tx.hash);
    console.log('等待交易上链...');

    const receipt = await tx.wait();
    console.log('✅ 交易已上链，区块:', receipt.blockNumber);

    // 解析 PacketCreated 事件（从 receipt.logs）
    let found = false;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'PacketCreated') {
          found = true;
          const packetId = parsed.args.packetId.toString();
          const creator = parsed.args.creator;
          const evPacketType = parsed.args.packetType; // number-like
          const amountWei = parsed.args.amount.toString();
          console.log('--- PacketCreated 事件 ---');
          console.log('packetId:', packetId);
          console.log('creator :', creator);
          console.log('packetType:', evPacketType.toString());
          console.log('amount (wei):', amountWei);
          console.log('amount (eth):', ethers.formatEther(amountWei));
          console.log('-------------------------');
        }
      } catch (e) {
        // 非合约事件，忽略
      }
    }

    if (!found) {
      console.warn('未在 receipt 中找到 PacketCreated 事件 — 请确认合约是否正确发出事件或 ABI 是否完整。');
    }

  } catch (err) {
    console.error('❌ 发红包失败:', err);
  }
})();
