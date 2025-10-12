const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

module.exports = buildModule('StorageModule', (m) => {
  const storage = m.contract('Storage');
// 注意：mint 由 onlyOwner 控制，Ignition 会使用部署 tx 的发送者（部署者）去调用
  m.call(pvm, 'mint', [m.getAccount(0), 1]);
  return { storage };
});