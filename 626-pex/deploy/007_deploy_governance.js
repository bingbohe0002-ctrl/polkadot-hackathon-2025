const { ethers, network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, execute, get } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  const chainId = (network.config.chainId || 31337).toString();

  log("----------------------------------------------------");
  log(`[Governance] Deploying PEXToken & TokenListingGovernor on chain ${chainId}`);
  log("----------------------------------------------------");

  // Resolve SpotMarket
  const spotMarket = await get("SpotMarket");

  // Deploy PEX governance token
  const initialSupply = (10n ** 9n) * (10n ** 18n); // 1,000,000,000 PEX
  const pexToken = await deploy("PEXToken", {
    from: deployer,
    args: [initialSupply.toString()],
    log: true,
    waitConfirmations: 1,
  });
  log(`[Governance] PEXToken deployed at ${pexToken.address}`);

  // Mint extra PEX to admin & a couple of default signers for demo voting
  try {
    const signers = await ethers.getSigners();
    const voter1 = admin;
    const voter2 = signers[1]?.address || admin;
    const voter3 = signers[2]?.address || admin;
    const mintAmount = (10n ** 6n) * (10n ** 18n); // 1,000,000 PEX each
    await execute("PEXToken", { from: deployer, log: true }, "mint", voter1, mintAmount.toString());
    await execute("PEXToken", { from: deployer, log: true }, "mint", voter2, mintAmount.toString());
    await execute("PEXToken", { from: deployer, log: true }, "mint", voter3, mintAmount.toString());
    log(`[Governance] Minted PEX to voters: ${voter1}, ${voter2}, ${voter3}`);
  } catch (e) {
    log(`[Governance] Warning: mint to voters failed: ${e.message}`);
  }

  // Deploy TokenListingGovernor
  const votingPeriodBlocks = 20; // quick demo window
  const approvalThresholdBps = 8000; // 80%
  const governor = await deploy("TokenListingGovernor", {
    from: deployer,
    args: [pexToken.address, spotMarket.address, votingPeriodBlocks, approvalThresholdBps],
    log: true,
    waitConfirmations: 1,
  });
  log(`[Governance] TokenListingGovernor deployed at ${governor.address}`);

  // Wire SpotMarket GOVERNOR_ROLE to TokenListingGovernor
  try {
    const GOVERNOR_ROLE = ethers.id("GOVERNOR_ROLE");
    await execute(
      "SpotMarket",
      { from: deployer, log: true },
      "grantRole",
      GOVERNOR_ROLE,
      governor.address
    );
    log(`[Governance] Granted GOVERNOR_ROLE on SpotMarket to TokenListingGovernor`);
  } catch (e) {
    log(`[Governance] grantRole failed: ${e.message}`);
  }

  // Write env & deployed.json for frontend
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
    upsert("NEXT_PUBLIC_PEX_ADDRESS", pexToken.address);
    upsert("NEXT_PUBLIC_TOKENLISTING_GOVERNOR_ADDRESS", governor.address);
    if (!env.includes("NEXT_PUBLIC_CHAIN_ID")) upsert("NEXT_PUBLIC_CHAIN_ID", chainId);
    if (!env.includes("NEXT_PUBLIC_RPC_URL")) upsert("NEXT_PUBLIC_RPC_URL", (network.config.url || "http://127.0.0.1:8545"));
    fs.writeFileSync(frontendEnvPath, env);
    log(`[Governance] Updated frontend .env.local with PEX & Governor addresses`);
  } catch (e) {
    log(`[Governance] Warning: could not update frontend env: ${e.message}`);
  }

  try {
    const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
    let json = {};
    try { json = JSON.parse(fs.readFileSync(deployedPath, "utf8")); } catch (_) {}
    json.chainId = chainId;
    json.contracts = Object.assign({}, json.contracts || {}, {
      spotMarket: spotMarket.address,
      tokenListingGovernor: governor.address,
    });
    json.tokens = Object.assign({}, json.tokens || {}, {
      pex: pexToken.address,
    });
    json.timestamp = new Date().toISOString();
    fs.writeFileSync(deployedPath, JSON.stringify(json, null, 2));
    log(`[Governance] Updated deployed.json with PEX & Governor addresses`);
  } catch (e) {
    log(`[Governance] Warning: could not update deployed.json: ${e.message}`);
  }
};

module.exports.tags = ["Governance"];
module.exports.dependencies = ["Spot", "USDC"];