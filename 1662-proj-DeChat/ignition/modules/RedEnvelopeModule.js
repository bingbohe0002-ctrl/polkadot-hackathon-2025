// ignition/modules/TieredRedPacketModule.js
const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

// 部署 TieredRedPacket 合约，使用已部署好的 NFT 合约地址
module.exports = buildModule('TieredRedPacketModule', (m) => {
  // ====== NFT 合约地址 ======
  // ⚠️ 建议用环境变量配置，以便不同网络复用
  const nftAddress ='0x5b9f2eC8801C4E2Cbf4da95Fc3Ea8b2733dBB49F';

  // ====== 部署 TieredRedPacket ======
  const redPacket = m.contract('TieredRedPacket', [nftAddress], {
    id: 'TieredRedPacket_Main',
    // from: m.getAccount(0),     // 可选，默认用部署账户
    // gas: 6_000_000,           // 可选，手动指定 gas 限制
  });

  // ====== 返回对象（可供测试或其他模块引用）======
  return { redPacket };
});
