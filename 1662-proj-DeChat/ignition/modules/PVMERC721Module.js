// ignition/modules/PVMERC721Module.js
const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

module.exports = buildModule('PVMERC721Module', (m) => {
  // 部署合约并命名 id（只允许字母数字下划线）
  const pvm = m.contract('PVMERC721', ['PVM Collection', 'PVM'], {
    id: 'PVMERC721_Main',
    // 可显式指定部署者（若需要）： from: m.getAccount(0)
    // 可显式指定 gas: 6000000
  });

  // 可选：部署完成后用部署者账户 mint 一个示例 token
  // 注意：mint 由 onlyOwner 控制，Ignition 会使用部署 tx 的发送者（部署者）去调用
  m.call(pvm, 'mint', [m.getAccount(0), 1]);

  return { pvm };
});
