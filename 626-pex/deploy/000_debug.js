module.exports = async ({ getNamedAccounts, deployments, ethers, network }) => {
  const { log } = deployments;
  try {
    const chainId = (network.config.chainId || 31337).toString();
    log("[Debug] chainId=" + chainId + ", rpc=" + (network.config.url || "(none)"));
    const { deployer, admin, treasury } = await getNamedAccounts();
    log("[Debug] namedAccounts deployer=" + deployer + ", admin=" + admin + ", treasury=" + treasury);
    try {
      const signers = await ethers.getSigners();
      log("[Debug] signers count=" + signers.length);
      signers.slice(0, 5).forEach((s, i) => log(`[Debug] signer[${i}]="${s.address}"`));
    } catch (e) {
      log("[Debug] ethers.getSigners error: " + e.message);
    }
  } catch (err) {
    console.error("[Debug] script error:", err);
  }
};

module.exports.tags = ["Debug"];
module.exports.dependencies = [];