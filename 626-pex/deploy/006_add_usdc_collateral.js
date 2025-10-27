const { ethers, network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, execute, get } = deployments;
  const { admin } = await getNamedAccounts();
  const chainId = (network.config.chainId || 31337).toString();

  log("----------------------------------------------------");
  log(`[Collateral] Adding USDC as collateral on chain ${chainId}`);
  log("----------------------------------------------------");

  // Resolve deployed contracts
  const marginVault = await get("MarginVault");
  let usdc;
  try {
    usdc = await get("MockERC20");
  } catch (e) {
    log(`[Collateral] ERROR: MockERC20 (USDC) not deployed. Run tag USDC first.`);
    throw e;
  }

  // Weight is informational in current implementation; use 1.0 (1e18) for clarity
  const weight = ethers.parseEther("1");

  try {
    await execute(
      "MarginVault",
      { from: admin, log: true },
      "addCollateral",
      usdc.address,
      weight
    );
    log(`[Collateral] USDC added to MarginVault: ${usdc.address}`);
  } catch (e) {
    log(`[Collateral] addCollateral failed: ${e.message}`);
    throw e;
  }
};

module.exports.tags = ["Collateral"];
module.exports.dependencies = ["Core", "USDC"];