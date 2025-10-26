module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  log("[core_min] Begin minimal core deploy...");

  const oracleAdapter = await deploy("OracleAdapter", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`[core_min] OracleAdapter at ${oracleAdapter.address}`);

  const marginVault = await deploy("MarginVault", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`[core_min] MarginVault at ${marginVault.address}`);

  const perpMarket = await deploy("PerpMarket", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`[core_min] PerpMarket at ${perpMarket.address}`);
};

module.exports.tags = ["core_min"];