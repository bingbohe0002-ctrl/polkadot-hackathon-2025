module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("[Smoke] Deploying MockERC20 for smoke test...");
  try {
    const token = await deploy("SmokeToken", {
      contract: "MockERC20",
      from: deployer,
      args: ["Smoke", "SMK", 18],
      log: true,
      waitConfirmations: 1,
    });
    log(`[Smoke] Deployed at ${token.address}`);
  } catch (e) {
    log(`[Smoke] Deploy failed: ${e.message}`);
    throw e;
  }
};

module.exports.tags = ["SmokeTest"];
module.exports.dependencies = [];