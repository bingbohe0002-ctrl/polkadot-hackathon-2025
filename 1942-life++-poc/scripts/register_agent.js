// ============================================================================
// scripts/register_agent.js - Register agent for testing
// ============================================================================
const hre = require("hardhat");

async function main() {
  console.log("🤖 Registering agent for testing...\n");

  const [deployer, agent] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Agent:", agent.address);

  // Get contract addresses from deployment
  const deployment = require("../deployments/hardhat-deployment.json");
  const catkAddress = deployment.contracts.CATK;
  const registryAddress = deployment.contracts.Registry;

  console.log("CATK Address:", catkAddress);
  console.log("Registry Address:", registryAddress);

  // Get contracts
  const catk = await hre.ethers.getContractAt("CognitiveAssetToken", catkAddress);
  const registry = await hre.ethers.getContractAt("PoCRegistry", registryAddress);

  // Transfer CATK to agent
  const stakeAmount = hre.ethers.parseEther("100");
  console.log("\n1️⃣ Transferring CATK to agent...");
  const transferTx = await catk.transfer(agent.address, stakeAmount);
  await transferTx.wait();
  console.log("✅ CATK transferred to agent");

  // Agent approves registry
  console.log("\n2️⃣ Agent approving registry...");
  const approveTx = await catk.connect(agent).approve(registryAddress, stakeAmount);
  await approveTx.wait();
  console.log("✅ Agent approved registry");

  // Register agent
  console.log("\n3️⃣ Registering agent...");
  const agentMetaHash = hre.ethers.id("robot-model-v1.0");
  const registerTx = await registry.connect(agent).registerAgent(agent.address, agentMetaHash, stakeAmount);
  const receipt = await registerTx.wait();
  console.log("✅ Agent registered");

  // Verify registration by parsing events
  console.log("\n4️⃣ Verifying registration...");
  
  // Parse events to get CID
  const event = receipt.logs.find(log => {
    try {
      const parsed = registry.interface.parseLog(log);
      return parsed.name === "AgentRegistered";
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsedEvent = registry.interface.parseLog(event);
    const cid = parsedEvent.args.cid;
    console.log("✅ Agent successfully registered with CID:", cid);
    console.log("Agent Address:", parsedEvent.args.agentAddr);
  } else {
    console.log("❌ Could not find AgentRegistered event");
  }

  console.log("\n🎉 Agent registration completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
