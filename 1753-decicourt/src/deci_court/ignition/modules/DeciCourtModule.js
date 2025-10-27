const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');
const JuryTokenModule = require('./JuryTokenModule');

module.exports = buildModule('DeciCourtModule', (m) => {
  // 依赖 JuryToken
  const { juryToken } = m.useModule(JuryTokenModule);

  // DeciCourt 构造函数参数
  const filingFee = m.getParameter('filingFee', '1000000000000000000'); // 1 token (18 decimals)
  const jurorStake = m.getParameter('jurorStake', '100000000000000000000'); // 100 tokens
  const jurySize = m.getParameter('jurySize', 3);
  const commitDuration = m.getParameter('commitDuration', 86400); // 1 day in seconds
  const revealDuration = m.getParameter('revealDuration', 86400); // 1 day in seconds
  const penaltyRate = m.getParameter('penaltyRate', 10); // 10%
  const appealDepositMultiplier = m.getParameter('appealDepositMultiplier', 2);
  const appealDuration = m.getParameter('appealDuration', 259200); // 3 days in seconds
  const appealJurySize = m.getParameter('appealJurySize', 5);

  const deciCourt = m.contract('DeciCourt', [
    juryToken,
    filingFee,
    jurorStake,
    jurySize,
    commitDuration,
    revealDuration,
    penaltyRate,
    appealDepositMultiplier,
    appealDuration,
    appealJurySize
  ]);

  return { juryToken, deciCourt };
});