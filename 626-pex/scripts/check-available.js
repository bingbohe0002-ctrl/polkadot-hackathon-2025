const { ethers, deployments, network } = require("hardhat");

async function main() {
  const chainId = (network.config.chainId || 31337).toString();
  console.log(`[Check] Network chainId: ${chainId}`);

  const vaultDep = await deployments.get("MarginVault");
  const usdcDep = await deployments.get("MockERC20");
  const vault = await ethers.getContractAt("MarginVault", vaultDep.address);
  const usdc = await ethers.getContractAt("MockERC20", usdcDep.address);

  console.log(`[Check] MarginVault: ${vaultDep.address}`);
  console.log(`[Check] USDC: ${usdcDep.address}`);

  // 1) Print last Deposit events
  const filter = vault.filters.Deposit();
  const fromBlock = 0;
  const toBlock = "latest";
  const logs = await vault.queryFilter(filter, fromBlock, toBlock);
  console.log(`[Check] Deposit events found: ${logs.length}`);
  for (const log of logs.slice(-5)) {
    const { user, token, amount, timestamp } = log.args;
    console.log(`  - user=${user} token=${token} amount=${amount} ts=${timestamp} tx=${log.transactionHash}`);
  }

  // 2) If a tx hash is provided via env, inspect it
  const txHash = process.env.TX_HASH || "0xfa048b87ed842398ca15b5a2efad43af1edf556258cac8bdebb218b123e06616";
  try {
    const receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (receipt) {
      console.log(`[Check] Tx ${txHash} status: ${receipt.status ? "SUCCESS" : "FAILED"}, block: ${receipt.blockNumber}`);
      console.log(`[Check] To: ${receipt.to}, From: ${receipt.from}, GasUsed: ${receipt.gasUsed}`);
    } else {
      console.log(`[Check] Tx ${txHash} not found on this provider.`);
    }
  } catch (e) {
    console.log(`[Check] Error fetching tx ${txHash}: ${e.message}`);
  }

  // 3) Derive user from last Deposit event and print balances
  let userAddr = null;
  if (logs.length > 0) {
    userAddr = logs[logs.length - 1].args.user;
    console.log(`[Check] Using last deposit user: ${userAddr}`);
  }

  if (userAddr) {
    const tokenBal = await vault.getTokenBalance(userAddr, usdcDep.address);
    const accountInfo = await vault.getAccountInfo(userAddr);
    const available = await vault.calculateAvailableBalance(userAddr);

    const [mode, totalCollateral, totalMargin, availableBalance, unrealizedPnl] = accountInfo;
    console.log(`[Check] getTokenBalance(USDC) = ${tokenBal}`);
    console.log(`[Check] getAccountInfo:`);
    console.log(`  - marginMode=${mode}`);
    console.log(`  - totalCollateral=${totalCollateral}`);
    console.log(`  - totalMargin=${totalMargin}`);
    console.log(`  - availableBalance=${availableBalance}`);
    console.log(`  - unrealizedPnl=${unrealizedPnl}`);
    console.log(`[Check] calculateAvailableBalance = ${available}`);
  } else {
    console.log(`[Check] No deposit events to infer user; please provide TX_HASH or user address.`);
  }

  // 4) Collaterals
  try {
    const collaterals = await vault.getAllCollaterals();
    console.log(`[Check] Collaterals (${collaterals.length}):`);
    for (const c of collaterals) {
      console.log(`  - token=${c.token} weight=${c.weight} active=${c.isActive}`);
    }
  } catch (e) {
    console.log(`[Check] Error reading collaterals: ${e.message}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});