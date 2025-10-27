const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  log("[debug] Starting minimal deploy test...");
  log(`[debug] deployer=${deployer} admin=${admin}`);

  const pm = await deploy("PerpMarket", {
    from: deployer,
    args: [admin],
    log: true,
    waitConfirmations: 1,
  });

  log(`[debug] PerpMarket deployed at ${pm.address}`);
};

module.exports.tags = ["debug"];