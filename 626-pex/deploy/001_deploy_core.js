const { ethers, network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments /*, getChainId*/ }) => {
  console.log("[Core] Starting deploy script...");
  try {
    const { deploy, log, execute } = deployments;
    const { deployer, admin, treasury } = await getNamedAccounts();
    const chainId = (network.config.chainId || 31337).toString();

    log("----------------------------------------------------");
    log(`Deploying PEX DEX contracts on chain ${chainId}`);
    log("Named Accounts: deployer=" + deployer + ", admin=" + admin + ", treasury=" + treasury);
    log("----------------------------------------------------");

  // Deploy OracleAdapter
  log("Deploying OracleAdapter...");
  const oracleAdapter = await deploy("OracleAdapter", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`OracleAdapter deployed at ${oracleAdapter.address}`);

  // Deploy MarginVault
  log("Deploying MarginVault...");
  const marginVault = await deploy("MarginVault", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`MarginVault deployed at ${marginVault.address}`);

  // Deploy PerpMarket
  log("Deploying PerpMarket...");
  const perpMarket = await deploy("PerpMarket", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`PerpMarket deployed at ${perpMarket.address}`);

  // Deploy RiskEngine
  log("Deploying RiskEngine...");
  const riskEngine = await deploy("RiskEngine", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`RiskEngine deployed at ${riskEngine.address}`);

  // Deploy FeeCollector
  log("Deploying FeeCollector...");
  const feeCollector = await deploy("FeeCollector", {
    from: deployer,
    args: [admin, treasury],
    log: true,
    waitConfirmations: 1,
  });
  log(`FeeCollector deployed at ${feeCollector.address}`);

  // Deploy OrderBook
  log("Deploying OrderBook...");
  const orderBook = await deploy("OrderBook", {
    from: deployer,
    args: [perpMarket.address, marginVault.address],
    log: true,
    waitConfirmations: 1,
  });
  log(`OrderBook deployed at ${orderBook.address}`);

  // (Removed) LiquidationEngine deployment — replaced by RiskEngine wiring in PerpMarket

  // Set up contract relationships
  log("Setting up contract relationships...");

  // Wire dependencies in PerpMarket (use admin role)
  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setMarginVault",
      marginVault.address
    );
    log("setMarginVault wired");
  } catch (e) {
    log(`Error wiring setMarginVault: ${e.message}`);
    throw e;
  }

  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setRiskEngine",
      riskEngine.address
    );
    log("setRiskEngine wired");
  } catch (e) {
    log(`Error wiring setRiskEngine: ${e.message}`);
    throw e;
  }

  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setOracleAdapter",
      oracleAdapter.address
    );
    log("setOracleAdapter wired");
  } catch (e) {
    log(`Error wiring setOracleAdapter: ${e.message}`);
    throw e;
  }

  try {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "setFeeCollector",
      feeCollector.address
    );
    log("setFeeCollector wired");
  } catch (e) {
    log(`Error wiring setFeeCollector: ${e.message}`);
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
    log("setMatchEngine wired");
  } catch (e) {
    log(`Error wiring setMatchEngine: ${e.message}`);
    throw e;
  }

  // Skip price setup here; OracleAdapter can be configured post-deploy via scripts/tasks

    // Add trading markets (temporarily disabled for debugging)
    // log("Adding trading markets...");
    // const markets = [
    //   {
    //     symbol: "BTC-USD",
    //     baseAsset: "BTC",
    //     quoteAsset: "USD",
    //     maxLeverage: 100,
    //     minOrderSize: ethers.utils.parseEther("0.001"),
    //     tickSize: ethers.utils.parseEther("1"),
    //   },
    //   {
    //     symbol: "ETH-USD",
    //     baseAsset: "ETH",
    //     quoteAsset: "USD",
    //     maxLeverage: 50,
    //     minOrderSize: ethers.utils.parseEther("0.01"),
    //     tickSize: ethers.utils.parseEther("0.5"),
    //   },
    //   {
    //     symbol: "SOL-USD",
    //     baseAsset: "SOL",
    //     quoteAsset: "USD",
    //     maxLeverage: 25,
    //     minOrderSize: ethers.utils.parseEther("0.1"),
    //     tickSize: ethers.utils.parseEther("0.1"),
    //   },
    // ];
    // for (const market of markets) {
    //   await execute(
    //     "PerpMarket",
    //     { from: admin, log: true },
    //     "addMarket",
    //     market.symbol,
    //     market.baseAsset,
    //     market.quoteAsset,
    //     market.maxLeverage,
    //     market.minOrderSize,
    //     market.tickSize
    //   );
    //   log(`Added market: ${market.symbol}`);
    // }

  // Log deployment addresses
  log("----------------------------------------------------");
  log("Deployment Summary:");
  log("----------------------------------------------------");
  log(`MarginVault: ${marginVault.address}`);
  log(`OrderBook: ${orderBook.address}`);
  log(`PerpMarket: ${perpMarket.address}`);

  if (chainId !== "1") {
    try {
      const usdcDeployment = await deployments.get("MockERC20");
      log(`USDC (Test): ${usdcDeployment.address}`);
    } catch (_) {
      log("USDC (Test): not deployed");
    }
  }

  log("----------------------------------------------------");
  log("Deployment completed successfully!");
  log("----------------------------------------------------");

  // Save deployment info to frontend
  // Optional test token (USDC) address if deployed in non-mainnet environments
  let tokens = {};
  if (chainId !== "1") {
    try {
      const usdcDeployment = await deployments.get("MockERC20");
      tokens.usdc = usdcDeployment.address;
    } catch (_) {
      tokens = {};
    }
  }

  const deploymentInfo = {
    chainId: chainId,
    contracts: {
      marginVault: marginVault.address,
      orderBook: orderBook.address,
      perpMarket: perpMarket.address,
      riskEngine: riskEngine.address,
      feeCollector: feeCollector.address,
      oracleAdapter: oracleAdapter.address,
      governance: "0x0000000000000000000000000000000000000000",
    },
    tokens,
    timestamp: new Date().toISOString(),
  };

    // Write to frontend config
    const fs = require("fs");
    const path = require("path");
    const frontendConfigPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
    try {
      fs.writeFileSync(frontendConfigPath, JSON.stringify(deploymentInfo, null, 2));
      log(`Deployment info saved to: ${frontendConfigPath}`);
    } catch (error) {
      log(`Warning: Could not save deployment info to frontend: ${error.message}`);
    }
  } catch (err) {
    console.error("[Core] Deploy script error:", err.message);
    throw err;
  }
};

module.exports.tags = ["Core", "OrderBook", "PerpMarket", "MarginVault", "RiskEngine", "OracleAdapter", "FeeCollector"];
module.exports.dependencies = [];