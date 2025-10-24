const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing Event Parsing...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  // Get deployed contract addresses from .env or hardcoded
  const REGISTRY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const LEDGER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  
  const Registry = await hre.ethers.getContractAt("PoCRegistry", REGISTRY_ADDRESS);
  const Ledger = await hre.ethers.getContractAt("PoCLedger", LEDGER_ADDRESS);
  
  // Get CID for deployer
  const cid = await Registry.addressToCid(deployer.address);
  console.log(`✅ Agent CID: ${cid}`);
  
  // Submit a proof
  const inputHash = hre.ethers.id("test input");
  const reasoningHash = hre.ethers.id("test reasoning");
  const outputHash = hre.ethers.id("test output");
  const metadataCID = "QmTest123";
  
  console.log(`📤 Submitting proof...`);
  const tx = await Ledger.submitProof(
    cid,
    inputHash,
    reasoningHash,
    outputHash,
    metadataCID
  );
  
  console.log(`⏳ Waiting for transaction...`);
  const receipt = await tx.wait();
  
  console.log(`\n📋 Transaction Receipt:`);
  console.log(`  Hash: ${receipt.hash}`);
  console.log(`  Logs: ${receipt.logs.length}`);
  
  // Try to parse events
  console.log(`\n🔍 Parsing events...`);
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    console.log(`\nLog ${i}:`);
    console.log(`  Address: ${log.address}`);
    console.log(`  Topics: ${log.topics.length}`);
    
    try {
      const parsed = Ledger.interface.parseLog({
        topics: [...log.topics],
        data: log.data
      });
      console.log(`  ✅ Parsed: ${parsed.name}`);
      if (parsed.name === 'ProofSubmitted') {
        console.log(`  📦 ProofId: ${parsed.args.proofId}`);
        console.log(`  📦 CID: ${parsed.args.cid}`);
        console.log(`  📦 MetadataCID: ${parsed.args.metadataCID}`);
      }
    } catch (e) {
      console.log(`  ❌ Could not parse: ${e.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

