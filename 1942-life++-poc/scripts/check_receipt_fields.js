const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  const REGISTRY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const LEDGER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  
  const Registry = await hre.ethers.getContractAt("PoCRegistry", REGISTRY_ADDRESS);
  const Ledger = await hre.ethers.getContractAt("PoCLedger", LEDGER_ADDRESS);
  
  const cid = await Registry.addressToCid(deployer.address);
  
  const tx = await Ledger.submitProof(
    cid,
    hre.ethers.id("test"),
    hre.ethers.id("test"),
    hre.ethers.id("test"),
    "QmTest"
  );
  
  const receipt = await tx.wait();
  
  console.log("Receipt fields:");
  console.log("  hash:", receipt.hash);
  console.log("  transactionHash:", receipt.transactionHash);
  console.log("  logs length:", receipt.logs.length);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

