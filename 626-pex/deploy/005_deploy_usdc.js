const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, execute } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  const chainId = (network.config.chainId || 31337).toString();

  if (chainId === "1") {
    log("[USDC] Skipping on mainnet");
    return;
  }

  log("----------------------------------------------------");
  log(`[USDC] Deploying MockERC20 on chain ${chainId}`);
  log("----------------------------------------------------");

  const usdc = await deploy("MockERC20", {
    from: deployer,
    args: ["USD Coin", "USDC", 6],
    log: true,
    waitConfirmations: 1,
  });
  log(`[USDC] Deployed at ${usdc.address}`);

  const faucetAddress = process.env.FAUCET_ADDRESS || admin;
  const amount = (BigInt(2000000000) * (10n ** 6n)).toString(); // 2,000,000,000 * 1e6

  try {
    await execute("MockERC20", { from: deployer, log: true }, "mint", faucetAddress, amount);
    log(`[USDC] Minted 2,000,000,000 USDC to faucet: ${faucetAddress}`);
  } catch (e) {
    log(`[USDC] Mint failed: ${e.message}`);
    throw e;
  }

  // Wire into PerpMarket for margin token
  try {
    await execute("PerpMarket", { from: admin, log: true }, "setUsdcToken", usdc.address);
    log("[USDC] PerpMarket setUsdcToken wired");
  } catch (e) {
    log(`[USDC] setUsdcToken failed: ${e.message}`);
  }

  // Write to frontend env and deployed.json
  const fs = require("fs");
  const path = require("path");
  try {
    const frontendEnvPath = path.join(__dirname, "../frontend/.env.local");
    let env = fs.readFileSync(frontendEnvPath, "utf8");
    if (env.includes("NEXT_PUBLIC_USDC_ADDRESS")) {
      env = env.replace(/NEXT_PUBLIC_USDC_ADDRESS=.*/g, `NEXT_PUBLIC_USDC_ADDRESS=${usdc.address}`);
    } else {
      env += `\nNEXT_PUBLIC_USDC_ADDRESS=${usdc.address}`;
    }
    fs.writeFileSync(frontendEnvPath, env);
    log(`[USDC] Updated frontend .env.local with USDC address: ${usdc.address}`);
  } catch (e) {
    log(`[USDC] Warning: could not update frontend env: ${e.message}`);
  }

  try {
    const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
    let json = {};
    try {
      json = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    } catch (_) {}
    json.tokens = json.tokens || {};
    json.tokens.usdc = usdc.address;
    fs.writeFileSync(deployedPath, JSON.stringify(json, null, 2));
    log(`[USDC] Updated deployed.json tokens.usdc: ${usdc.address}`);
  } catch (e) {
    log(`[USDC] Warning: could not update deployed.json: ${e.message}`);
  }
};

module.exports.tags = ["USDC"];
module.exports.dependencies = ["Core"];