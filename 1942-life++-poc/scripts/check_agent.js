const hre = require("hardhat");

async function main() {
  const deployment = require("../deployments/hardhat-deployment.json");
  const registry = await hre.ethers.getContractAt("PoCRegistry", deployment.contracts.Registry);
  
  const agentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("Checking agent:", agentAddress);
  
  try {
    const cid = await registry.addressToCid(agentAddress);
    console.log("CID:", cid);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

main();
