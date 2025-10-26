const { ethers, deployments, network } = require("hardhat");

async function main() {
  const chainId = (network.config.chainId || 31337).toString();
  const userAddr = process.argv[2] || process.env.USER_ADDR;
  if (!userAddr || !/^0x[0-9a-fA-F]{40}$/.test(userAddr)) {
    throw new Error("请提供有效的钱包地址，例如：npx hardhat run scripts/check-usdc-balance.js --network localhost 0xabc...");
  }

  console.log(`[USDC Balance] Network chainId: ${chainId}`);
  console.log(`[USDC Balance] User: ${userAddr}`);

  const usdcDep = await deployments.get("MockERC20");
  const usdc = await ethers.getContractAt("MockERC20", usdcDep.address);
  console.log(`[USDC] Address: ${usdcDep.address}`);

  const bal = await usdc.balanceOf(userAddr);
  const decimals = await usdc.decimals();
  const fmt = (v) => ethers.formatUnits(v, decimals);
  console.log(`[USDC] Raw = ${bal}`);
  console.log(`[USDC] Formatted = ${fmt(bal)} USDC`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});