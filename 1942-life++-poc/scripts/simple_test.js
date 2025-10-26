const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🧪 Simple Contract Test\n");

  // Load deployment addresses
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));

  const [deployer, agent] = await hre.ethers.getSigners();

  // Get contract instances
  const catk = await hre.ethers.getContractAt("CognitiveAssetToken", deployment.contracts.CATK);
  const registry = await hre.ethers.getContractAt("PoCRegistry", deployment.contracts.Registry);

  console.log("1️⃣ Testing basic contract calls...");
  
  // Test CATK balance
  const deployerBalance = await catk.balanceOf(deployer.address);
  console.log("Deployer CATK balance:", hre.ethers.formatEther(deployerBalance));
  
  // Test transfer
  const stakeAmount = hre.ethers.parseEther("100");
  const transferTx = await catk.transfer(agent.address, stakeAmount);
  await transferTx.wait();
  console.log("✅ CATK transferred to agent");
  
  const agentBalance = await catk.balanceOf(agent.address);
  console.log("Agent CATK balance:", hre.ethers.formatEther(agentBalance));
  
  // Test approval
  const approveTx = await catk.connect(agent).approve(await registry.getAddress(), stakeAmount);
  await approveTx.wait();
  console.log("✅ Agent approved registry");
  
  // Test allowance
  const allowance = await catk.allowance(agent.address, await registry.getAddress());
  console.log("Allowance:", hre.ethers.formatEther(allowance));
  
  console.log("\n✅ Basic tests passed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
