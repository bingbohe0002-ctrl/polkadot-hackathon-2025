const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

module.exports = buildModule('JuryTokenModule', (m) => {
  // JuryToken 不需要构造函数参数
  const juryToken = m.contract('JuryToken');

  return { juryToken };
});