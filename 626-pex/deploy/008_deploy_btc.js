const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, execute } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  const chainId = (network.config.chainId || 31337).toString();

  log("----------------------------------------------------");
  log(`[BTC] Deploying MockERC20 (8 decimals) on chain ${chainId}`);
  log("----------------------------------------------------");

  // Deploy ERC20 BTC
  const btc = await deploy("BTC", {
    contract: "MockERC20",
    from: deployer,
    args: ["Bitcoin", "BTC", 8],
    log: true,
    waitConfirmations: 1,
  });
  log(`[BTC] Deployed at ${btc.address}`);

  // Mint BTC to faucet/admin
  const faucetAddress = process.env.FAUCET_ADDRESS || admin;
  const amount = (BigInt(1_000_000) * (10n ** 8n)).toString(); // 1,000,000 BTC for testing
  try {
    await execute("BTC", { from: deployer, log: true }, "mint", faucetAddress, amount);
    log(`[BTC] Minted 1,000,000 BTC to faucet: ${faucetAddress}`);
  } catch (e) {
    log(`[BTC] Mint failed: ${e.message}`);
  }

  // Update frontend env and deployed.json
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
    upsert("NEXT_PUBLIC_BTC_ADDRESS", btc.address);
    fs.writeFileSync(frontendEnvPath, env);
    log(`[BTC] Updated frontend .env.local with BTC address: ${btc.address}`);
  } catch (e) {
    log(`[BTC] Warning: could not update frontend env: ${e.message}`);
  }

  try {
    const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
    let json = {};
    try { json = JSON.parse(fs.readFileSync(deployedPath, "utf8")); } catch (_) {}
    json.tokens = Object.assign({}, json.tokens || {}, { btc: btc.address });
    fs.writeFileSync(deployedPath, JSON.stringify(json, null, 2));
    log(`[BTC] Updated deployed.json tokens.btc: ${btc.address}`);
  } catch (e) {
    log(`[BTC] Warning: could not update deployed.json: ${e.message}`);
  }
};

module.exports.tags = ["BTC"];
module.exports.dependencies = ["Core"];