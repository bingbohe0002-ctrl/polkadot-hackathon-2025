module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, execute } = deployments;
  const { deployer, admin, treasury } = await getNamedAccounts();
  log("[core_step2] Deploying RiskEngine, FeeCollector, OrderBook and wiring...");

  const riskEngine = await deploy("RiskEngine", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`[core_step2] RiskEngine at ${riskEngine.address}`);

  const feeCollector = await deploy("FeeCollector", {
    from: deployer,
    args: [admin, treasury],
    log: true,
    waitConfirmations: 1,
  });
  log(`[core_step2] FeeCollector at ${feeCollector.address}`);

  const perpMarketDeployment = await deployments.get("PerpMarket");
  const marginVaultDeployment = await deployments.get("MarginVault");
  const oracleAdapterDeployment = await deployments.get("OracleAdapter");

  const orderBook = await deploy("OrderBook", {
    from: deployer,
    args: [perpMarketDeployment.address, marginVaultDeployment.address],
    log: true,
    waitConfirmations: 1,
  });
  log(`[core_step2] OrderBook at ${orderBook.address}`);

  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setMarginVault",
      marginVaultDeployment.address
    );
    log("[core_step2] setMarginVault wired");
  } catch (e) {
    log(`[core_step2] Error setMarginVault: ${e.message}`);
    throw e;
  }

  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setOracleAdapter",
      oracleAdapterDeployment.address
    );
    log("[core_step2] setOracleAdapter wired");
  } catch (e) {
    log(`[core_step2] Error setOracleAdapter: ${e.message}`);
    throw e;
  }

  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setRiskEngine",
      riskEngine.address
    );
    log("[core_step2] setRiskEngine wired");
  } catch (e) {
    log(`[core_step2] Error setRiskEngine: ${e.message}`);
    throw e;
  }

  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setFeeCollector",
      feeCollector.address
    );
    log("[core_step2] setFeeCollector wired");
  } catch (e) {
    log(`[core_step2] Error setFeeCollector: ${e.message}`);
    throw e;
  }

  // Wire match engine (OrderBook) into PerpMarket
  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setMatchEngine",
      orderBook.address
    );
    log("[core_step2] setMatchEngine wired");
  } catch (e) {
    log(`[core_step2] Error setMatchEngine: ${e.message}`);
    throw e;
  }
};

module.exports.tags = ["core_step2"];
module.exports.dependencies = ["core_min"];