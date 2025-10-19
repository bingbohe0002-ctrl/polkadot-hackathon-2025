const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

module.exports = buildModule('TieredNFTPlusModule', (m) => {
  // 部署合约，传入 name 和 symbol
  const tiered = m.contract('TieredNFTPlus', ['TieredNFT', 'TNFT']);

  // 示例：用部署者账号给自己 mint 一个 Bronze（enum 第一个，值为 0）
  // 注意：enum 在 ABI 中是 uint8/uint256，所以这里传入整数 0/1/2
  m.call(tiered, 'mint', [m.getAccount(0), 0, 'ipfs://QmExampleUri1']);

  return { tiered };
});
