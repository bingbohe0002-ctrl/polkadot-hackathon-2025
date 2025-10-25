// RedPackageCreat.js (浏览器兼容版本)
import { ethers } from 'ethers';

// 导出函数，接受 signer 和其他配置作为参数
export const createRedPacket = async (signer, contractAddress, packetType, totalShares, totalEther) => {
  if (!signer) throw new Error('Signer 未提供');
  if (!contractAddress) throw new Error('合约地址未提供');

  // 合约 ABI（不变）
  const ABI = [
    "function createRedPacket(uint8 packetType, uint256 totalShares) payable returns (uint256)",
    "event PacketCreated(uint256 indexed packetId, address indexed creator, uint8 packetType, uint256 amount)"
  ];

  const contract = new ethers.Contract(contractAddress, ABI, signer);

  console.log('准备发送 createRedPacket tx...');
  try {
    const value = ethers.utils.parseEther(totalEther.toString());

    const tx = await contract.createRedPacket(packetType, totalShares, { value });
    console.log('✅ tx hash:', tx.hash);
    console.log('等待交易上链...');

    const receipt = await tx.wait();
    console.log('✅ 交易已上链，区块:', receipt.blockNumber);

    // 解析事件（不变）
    let packetId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'PacketCreated') {
          packetId = parsed.args.packetId.toString();
          console.log('--- PacketCreated 事件 ---');
          console.log('packetId:', packetId);
          console.log('creator :', parsed.args.creator);
          console.log('packetType:', parsed.args.packetType.toString());
          console.log('amount (eth):', ethers.utils.formatEther(parsed.args.amount));
          console.log('-------------------------');
        }
      } catch (e) {}
    }

    if (!packetId) {
      console.warn('未找到 PacketCreated 事件');
    }

    return { receipt, packetId };
  } catch (err) {
    console.error('❌ 发红包失败:', err);
    throw err;
  }
};
