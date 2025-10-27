const { ethers } = require("hardhat");

module.exports = async ({ deployments }) => {
  const { log } = deployments;
  log("[verify] Reading PerpMarket state...");
  const pmDep = await deployments.get("PerpMarket");
  const pm = await ethers.getContractAt("PerpMarket", pmDep.address);
  const markets = await pm.getAllMarkets();
  log(`[verify] PerpMarket at ${pmDep.address}`);
  log(`[verify] Market count: ${markets.length}`);
};

module.exports.tags = ["verify_state"];
module.exports.dependencies = ["core_step2"];