// ============================================================================
// scripts/submit_demo_proof.js - Demo script for submitting a proof
// ============================================================================
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🧪 Running Demo: Submit Proof\n");

  // Load deployment addresses
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));

  const [deployer, agent] = await hre.ethers.getSigners();

  // Get contract instances
  const catk = await hre.ethers.getContractAt("CognitiveAssetToken", deployment.contracts.CATK);
  const registry = await hre.ethers.getContractAt("PoCRegistry", deployment.contracts.Registry);
  const ledger = await hre.ethers.getContractAt("PoCLedger", deployment.contracts.Ledger);

  // Step 1: Register agent
  console.log("1️⃣ Registering agent...");
  const stakeAmount = hre.ethers.parseEther("100");
  
  // Transfer CATK to agent
  await catk.transfer(agent.address, stakeAmount);
  console.log("✅ CATK transferred to agent");
  
  // Agent approves registry
  await catk.connect(agent).approve(await registry.getAddress(), stakeAmount);
  console.log("✅ Agent approved registry to spend CATK");
  
  const agentMetaHash = hre.ethers.id("robot-model-v1.0");
  const tx = await registry.connect(agent).registerAgent(agent.address, agentMetaHash, stakeAmount);
  const receipt = await tx.wait();
  
  console.log("Transaction status:", receipt.status);
  console.log("Receipt logs:", receipt.logs.length);
  console.log("First log:", receipt.logs[0]);
  
  const registerEvent = receipt.logs.find(log => {
    try {
      const parsed = registry.interface.parseLog(log);
      return parsed && parsed.name === "AgentRegistered";
    } catch (e) {
      console.log("Parse error:", e.message);
      return false;
    }
  });
  
  let cid;
  if (!registerEvent) {
    console.log("Available logs:", receipt.logs.map(log => log.topics[0]));
    console.log("Trying to get CID directly from contract...");
    
    // Try to get the CID directly by checking the mapping
    cid = await registry.addressToCid(agent.address);
    if (cid === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      throw new Error("Agent not registered - CID is zero");
    }
    console.log("✅ Agent registered with CID (direct):", cid, "\n");
  } else {
    const parsedEvent = registry.interface.parseLog(registerEvent);
    cid = parsedEvent.args.cid;
    console.log("✅ Agent registered with CID:", cid, "\n");
  }

  // Step 2: Submit proof
  console.log("2️⃣ Submitting proof...");
  const inputHash = hre.ethers.id("input: move forward 10 meters");
  const reasoningHash = hre.ethers.id("reasoning: [step1, step2, step3]");
  const outputHash = hre.ethers.id("output: action completed successfully");
  const metadataCID = "QmExampleIPFSHash123456789";

  const submitTx = await ledger.connect(agent).submitProof(
    cid,
    inputHash,
    reasoningHash,
    outputHash,
    metadataCID
  );
  const submitReceipt = await submitTx.wait();
  
  const submitEvent = submitReceipt.logs.find(log => {
    try {
      const parsed = ledger.interface.parseLog(log);
      return parsed && parsed.name === "ProofSubmitted";
    } catch {
      return false;
    }
  });
  
  if (!submitEvent) {
    throw new Error("ProofSubmitted event not found");
  }
  
  const parsedSubmitEvent = ledger.interface.parseLog(submitEvent);
  const proofId = parsedSubmitEvent.args.proofId;
  console.log("✅ Proof submitted with ID:", proofId, "\n");

  // Step 3: Attest proof (validator)
  console.log("3️⃣ Attesting proof as validator...");
  await ledger.connect(deployer).attestProof(proofId, true);
  console.log("✅ Proof attested (1/3)\n");

  // Check proof status
  const proof = await ledger.getProof(proofId);
  console.log("📊 Proof Status:");
  console.log("  - CID:", proof.cid);
  console.log("  - Status:", ["PENDING", "VERIFIED", "REJECTED"][proof.status]);
  console.log("  - Attestations:", proof.attestedBy.length);
  console.log("  - Metadata CID:", proof.metadataCID);

  console.log("\n✨ Demo completed successfully!");
  console.log("💡 Note: Need 3 validators to attest for VERIFIED status");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
