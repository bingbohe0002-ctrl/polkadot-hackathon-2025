const hre = require("hardhat");

async function main() {
  const { ethers, deployments } = hre;
  const addr = process.env.USER_ADDR;
  const amtText = process.env.MINT_AMOUNT || "1000000"; // default 1,000,000 PEX

  if (!addr) {
    throw new Error("USER_ADDR env var is required, e.g. USER_ADDR=0x... ");
  }

  const amount = ethers.parseUnits(amtText, 18);
  const pex = await deployments.get("PEXToken");
  console.log("PEXToken:", pex.address);

  const [signer] = await ethers.getSigners();
  const token = await ethers.getContractAt("PEXToken", pex.address, signer);

  const tx = await token.mint(addr, amount);
  console.log("Mint tx:", tx.hash);
  await tx.wait();
  console.log(`Minted ${amtText} PEX to ${addr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});