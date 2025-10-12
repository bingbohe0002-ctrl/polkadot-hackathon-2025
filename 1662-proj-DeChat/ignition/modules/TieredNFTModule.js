// ignition/modules/TieredNFTModule.js
const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

module.exports = buildModule('TieredNFTModule', (m) => {
  // 部署 TieredNFT 合约，构造参数: name 和 symbol
  const pvm = m.contract('TieredNFT', ['PVM Collection', 'PVM'], {
    // 用合法 id（不能包含 #），方便在 journal/调试时识别
    id: 'TieredNFT_Main',
    // 可显式指定 gas: 6000000
    // 你也可以指定部署账户，例如：
    // from: m.getAccount(0)
  });
  // 注意：mint 由 onlyOwner 控制，Ignition 会使用部署 tx 的发送者（部署者）去调用
  m.call(pvm, 'mint', [m.getAccount(0), 1, "https://example.com/metadata/1.json"]);
  return { pvm };
});
