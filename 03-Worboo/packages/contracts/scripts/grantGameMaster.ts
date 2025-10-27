import { ethers } from "hardhat";

const usage = `
Usage:
  npx hardhat run --network <network> scripts/grantGameMaster.ts <tokenAddress> <granteeAddress>

Example:
  npx hardhat run --network moonbase scripts/grantGameMaster.ts 0xToken 0xRelayer
`;

async function main() {
  const [tokenAddress, grantee] = process.argv.slice(2);

  if (!tokenAddress || !grantee) {
    throw new Error(usage);
  }

  const token = await ethers.getContractAt("WorbooToken", tokenAddress);
  const role = await token.GAME_MASTER_ROLE();

  const tx = await token.grantRole(role, grantee);
  console.log(`Submitting grantRole transaction... hash=${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Role granted in block ${receipt?.blockNumber ?? "pending"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

