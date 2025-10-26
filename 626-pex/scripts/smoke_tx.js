const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("From:", await signer.getAddress());
  const tx = await signer.sendTransaction({
    to: await signer.getAddress(),
    value: 1,
    gasLimit: 21000,
    gasPrice: hre.ethers.parseUnits ? hre.ethers.parseUnits("1", "gwei") : 1000000000,
  });
  console.log("Sent tx:", tx.hash);
  const rc = await tx.wait();
  console.log("Receipt status:", rc.status);
}

main().catch((e) => {
  console.error("Smoke tx failed:", e);
  process.exit(1);
});