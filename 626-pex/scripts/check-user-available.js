const { ethers, deployments, network } = require("hardhat");

async function main() {
  const chainId = (network.config.chainId || 31337).toString();
  const userAddr = process.argv[2] || process.env.USER_ADDR;
  if (!userAddr || !/^0x[0-9a-fA-F]{40}$/.test(userAddr)) {
    throw new Error("请提供有效的钱包地址，例如：npx hardhat run scripts/check-user-available.js --network localhost 0xabc...");
  }

  console.log(`[Check] Network chainId: ${chainId}`);
  console.log(`[Check] User: ${userAddr}`);

  const vaultDep = await deployments.get("MarginVault");
  const usdcDep = await deployments.get("MockERC20");
  const vault = await ethers.getContractAt("MarginVault", vaultDep.address);

  console.log(`[Check] MarginVault: ${vaultDep.address}`);
  console.log(`[Check] USDC: ${usdcDep.address}`);

  // Query account info and available balance
  const accountInfo = await vault.getAccountInfo(userAddr);
  const availableCalc = await vault.calculateAvailableBalance(userAddr);
  const [mode, totalCollateral, totalMargin, availableBalance, unrealizedPnl] = accountInfo;

  console.log(`[Result] getAccountInfo.availableBalance = ${availableBalance}`);
  console.log(`[Result] calculateAvailableBalance     = ${availableCalc}`);
  // Format in USDC (6 decimals)
  const fmt = (v) => ethers.formatUnits(v, 6);
  console.log(`[Result] Available (USDC) formatted     = ${fmt(availableBalance)} USDC`);
  console.log(`[Detail] totalCollateral=${totalCollateral} totalMargin=${totalMargin} unrealizedPnl=${unrealizedPnl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});