const { ethers, network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, execute } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  const chainId = (network.config.chainId || 31337).toString();

  log("----------------------------------------------------");
  log(`[Spot] Deploying SpotMarket & SpotOrderBook on chain ${chainId}`);
  log("----------------------------------------------------");

  // Deploy SpotMarket
  const spotMarket = await deploy("SpotMarket", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });
  log(`[Spot] SpotMarket deployed at ${spotMarket.address}`);

  // Deploy SpotOrderBook
  const spotOrderBook = await deploy("SpotOrderBook", {
    from: deployer,
    args: [spotMarket.address],
    log: true,
    waitConfirmations: 1,
  });
  log(`[Spot] SpotOrderBook deployed at ${spotOrderBook.address}`);

  // Ensure USDC exists
  let usdcAddr;
  try {
    const usdc = await deployments.get("MockERC20");
    usdcAddr = usdc.address;
    log(`[Spot] Using USDC at ${usdcAddr}`);
  } catch (e) {
    log(`[Spot] USDC not found in deployments, skipping market creation`);
  }

  // Deploy WETH mock under distinct name to avoid collisions
  let wethAddr;
  try {
    const weth = await deploy("WETH", {
      contract: "MockERC20",
      from: deployer,
      args: ["Wrapped Ether", "WETH", 18],
      log: true,
      waitConfirmations: 1,
    });
    wethAddr = weth.address;
    log(`[Spot] WETH deployed at ${wethAddr}`);

    // Mint WETH to faucet/admin
    const faucetAddress = process.env.FAUCET_ADDRESS || admin;
    const amount = (BigInt(1000000) * (10n ** 18n)).toString(); // 1,000,000 WETH for testing
    await execute("WETH", { from: deployer, log: true }, "mint", faucetAddress, amount);
    log(`[Spot] Minted 1,000,000 WETH to faucet: ${faucetAddress}`);
  } catch (e) {
    log(`[Spot] WETH deploy/mint failed: ${e.message}`);
  }

  // Create and activate markets
  const ZERO = ethers.ZeroAddress;
  if (usdcAddr && wethAddr) {
    // WETH/USDC (ERC20/ERC20)
    try {
      await execute(
        "SpotMarket",
        { from: admin, log: true },
        "addMarket",
        wethAddr,
        usdcAddr,
        "WETH/USDC",
        false,
        false
      );
      log("[Spot] Market WETH/USDC added");
      const sm = await ethers.getContractAt("SpotMarket", spotMarket.address);
      const markets = await sm.getAllMarkets();
      const found = markets.find(
        (m) =>
          m.baseToken.toLowerCase() === wethAddr.toLowerCase() &&
          m.quoteToken.toLowerCase() === usdcAddr.toLowerCase()
      );
      if (found && found.id) {
        const marketId = Number(found.id);
        await execute("SpotMarket", { from: admin, log: true }, "activateMarket", marketId);
        log(`[Spot] Market WETH/USDC activated with id ${marketId}`);
      } else {
        log("[Spot] Warning: could not determine marketId for WETH/USDC");
      }
    } catch (e) {
      log(`[Spot] WETH/USDC creation/activation failed: ${e.message}`);
    }

    // PEX(native)/USDC (Native/ERC20)
    try {
      await execute(
        "SpotMarket",
        { from: admin, log: true },
        "addMarket",
        ZERO,
        usdcAddr,
        "PAS/USDC",
        true,
        false
      );
      log("[Spot] Market PAS/USDC added");
      const sm = await ethers.getContractAt("SpotMarket", spotMarket.address);
      const markets = await sm.getAllMarkets();
      const found = markets.find(
        (m) =>
          m.baseIsNative === true &&
          m.quoteToken.toLowerCase() === usdcAddr.toLowerCase()
      );
      if (found && found.id) {
        const marketId = Number(found.id);
        await execute("SpotMarket", { from: admin, log: true }, "activateMarket", marketId);
        log(`[Spot] Market PAS/USDC activated with id ${marketId}`);
      } else {
        log("[Spot] Warning: could not determine marketId for PAS/USDC");
      }
    } catch (e) {
      log(`[Spot] PAS/USDC creation/activation failed: ${e.message}`);
    }

    // WETH/PEX(native) (ERC20/Native)
    try {
      await execute(
        "SpotMarket",
        { from: admin, log: true },
        "addMarket",
        wethAddr,
        ZERO,
        "WETH/PEX",
        false,
        true
      );
      log("[Spot] Market WETH/PEX added");
      const sm = await ethers.getContractAt("SpotMarket", spotMarket.address);
      const markets = await sm.getAllMarkets();
      const found = markets.find(
        (m) =>
          m.baseToken.toLowerCase() === wethAddr.toLowerCase() &&
          m.quoteIsNative === true
      );
      if (found && found.id) {
        const marketId = Number(found.id);
        await execute("SpotMarket", { from: admin, log: true }, "activateMarket", marketId);
        log(`[Spot] Market WETH/PEX activated with id ${marketId}`);
      } else {
        log("[Spot] Warning: could not determine marketId for WETH/PEX");
      }
    } catch (e) {
      log(`[Spot] WETH/PEX creation/activation failed: ${e.message}`);
    }
  }

  // Write to frontend env and deployed.json
  const fs = require("fs");
  const path = require("path");
  try {
    const frontendEnvPath = path.join(__dirname, "../frontend/.env.local");
    let env = "";
    try { env = fs.readFileSync(frontendEnvPath, "utf8"); } catch (_) {}
    function upsert(key, value) {
      if (env.includes(key)) {
        const re = new RegExp(`${key}=.*`, "g");
        env = env.replace(re, `${key}=${value}`);
      } else {
        env += `\n${key}=${value}`;
      }
    }
    upsert("NEXT_PUBLIC_SPOTMARKET_ADDRESS", spotMarket.address);
    upsert("NEXT_PUBLIC_SPOTORDERBOOK_ADDRESS", spotOrderBook.address);
    if (wethAddr) upsert("NEXT_PUBLIC_WETH_ADDRESS", wethAddr);
    if (!env.includes("NEXT_PUBLIC_CHAIN_ID")) upsert("NEXT_PUBLIC_CHAIN_ID", chainId);
    if (!env.includes("NEXT_PUBLIC_RPC_URL")) upsert("NEXT_PUBLIC_RPC_URL", (network.config.url || "http://127.0.0.1:8545"));
    fs.writeFileSync(frontendEnvPath, env);
    log(`[Spot] Updated frontend .env.local with Spot addresses`);
  } catch (e) {
    log(`[Spot] Warning: could not update frontend env: ${e.message}`);
  }

  try {
    const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
    let json = {};
    try { json = JSON.parse(fs.readFileSync(deployedPath, "utf8")); } catch (_) {}
    json.chainId = chainId;
    json.contracts = Object.assign({}, json.contracts || {}, {
      spotMarket: spotMarket.address,
      spotOrderBook: spotOrderBook.address,
    });
    json.tokens = Object.assign({}, json.tokens || {}, {
      usdc: usdcAddr || (json.tokens && json.tokens.usdc) || undefined,
      weth: wethAddr || undefined,
    });
    json.timestamp = new Date().toISOString();
    fs.writeFileSync(deployedPath, JSON.stringify(json, null, 2));
    log(`[Spot] Updated deployed.json with Spot addresses`);
  } catch (e) {
    log(`[Spot] Warning: could not update deployed.json: ${e.message}`);
  }
};

module.exports.tags = ["Spot"];
module.exports.dependencies = ["Core", "USDC"];