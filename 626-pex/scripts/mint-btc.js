const hre = require("hardhat");

async function main() {
  const { ethers, deployments } = hre;
  const to = process.env.TO;
  const amtStr = process.env.AMOUNT || "1000000"; // 默认 1,000,000 BTC（以 8 位小数计的整数）
  if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
    throw new Error("请提供有效的收款地址，示例：TO=0xabc...");
  }

  const btcDep = await deployments.get("BTC");
  console.log(`[Mint BTC] BTC address: ${btcDep.address}`);

  const [deployer] = await ethers.getSigners(); // 代币 owner
  const btc = await ethers.getContractAt("MockERC20", btcDep.address, deployer);
  const decimals = await btc.decimals(); // 8
  const amount = ethers.parseUnits(amtStr, decimals);

  const balBefore = await btc.balanceOf(to);
  console.log(`[Before] To balance=${ethers.formatUnits(balBefore, decimals)} BTC`);

  const tx = await btc.mint(to, amount);
  console.log(`Mint tx: ${tx.hash}`);
  await tx.wait();

  const balAfter = await btc.balanceOf(to);
  console.log(`[After] To balance=${ethers.formatUnits(balAfter, decimals)} BTC`);
}

main().catch((e) => { console.error(e); process.exit(1); });