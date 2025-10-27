const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const signers = await ethers.getSigners();
  console.log("Accounts:");
  signers.slice(0, 5).forEach((s, i) => console.log(`${i}: ${s.address}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});