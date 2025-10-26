// ClaimRedPacket.js (浏览器兼容版本)
import { ethers } from 'ethers';

export const claimRedPacket = async (signer, packetId, tokenId) => {
  if (!signer) throw new Error('Signer 未提供');

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS_RED;
  if (!contractAddress) throw new Error('合约地址未配置，请检查 .env 文件');

  // 合约 ABI
  const ABI = [
    "function claim(uint256 packetId, uint256 tokenId) external",
    "event PacketClaimed(uint256 indexed packetId, address indexed claimer, uint256 amount)"
  ];

  const contract = new ethers.Contract(contractAddress, ABI, signer);

  console.log(`准备抢红包 (packetId=${packetId}, tokenId=${tokenId})...`);

  try {
    const tx = await contract.claim(packetId, tokenId);

    console.log('✅ tx hash:', tx.hash);
    console.log('等待交易上链...');

    const receipt = await tx.wait();
    console.log('✅ 抢红包成功，区块号:', receipt.blockNumber);
// --- 新增：查询余额逻辑 ---
    // 1. 获取钱包地址（通过 signer 获得）
    const walletAddress = await signer.getAddress();
    console.log('钱包地址:', walletAddress);

    // 2. 查询钱包的 ETH 余额（单位：wei，需格式化）
    const walletEthBalanceWei = await signer.provider.getBalance(walletAddress);
    const walletEthBalance = ethers.utils.formatEther(walletEthBalanceWei);
    console.log('钱包余额:', walletEthBalance, 'PAS');

    // 3. 查询合约的 ETH 余额
    const contractEthBalanceWei = await signer.provider.getBalance(contractAddress);
    const contractEthBalance = ethers.utils.formatEther(contractEthBalanceWei);
    console.log('合约余额:', contractEthBalance, 'PAS');
    // --- 余额查询结束 ---

    // 解析事件
    let claimedAmount = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        // 新增：打印原始未格式化的金额（合约中存储的最小单位，如 wei）
        console.log('原始amount(最小单位):', parsed.args.amount.toString());
        //格式化金额为以太单位
        if (parsed && parsed.name === 'PacketClaimed') {
          claimedAmount = ethers.utils.formatEther(parsed.args.amount);
          console.log('--- 抢红包成功 ---');
          console.log('packetId:', parsed.args.packetId.toString());
          console.log('claimer  :', parsed.args.claimer);
          console.log('amount(PAS):', claimedAmount);
          console.log('-----------------');
        }
      } catch (e) {}
    }

    if (!claimedAmount) {
      console.warn('⚠️ 未检测到 PacketClaimed 事件');
    }

    return { receipt, claimedAmount };
  } catch (err) {
    console.error('❌ 抢红包失败:', err);
    throw err;
  }
};
