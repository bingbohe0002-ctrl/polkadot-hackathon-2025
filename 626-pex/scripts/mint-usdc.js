const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const chainId = (network.config.chainId || 31337).toString();
  const to = process.env.TO;
  const amtStr = process.env.AMOUNT || "3000000"; // whole USDC units default
  if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
    throw new Error("请提供有效的收款地址，示例：TO=0xabc...");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`[Mint USDC] chainId=${chainId}`);
  console.log(`[From(owner)] ${deployer.address}`);
  console.log(`[To] ${to}`);
  console.log(`[Amount] ${amtStr} USDC`);

  // Read USDC address from frontend deployed.json
  const depPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
  const json = JSON.parse(fs.readFileSync(depPath, "utf8"));
  const usdcAddr = json.tokens?.usdc;
  if (!usdcAddr || !/^0x[0-9a-fA-F]{40}$/.test(usdcAddr)) {
    throw new Error("未找到有效的 USDC 地址，请检查 frontend/src/lib/contracts/deployed.json");
  }

  const usdc = await ethers.getContractAt("MockERC20", usdcAddr, deployer);
  const decimals = await usdc.decimals();
  const amount = ethers.parseUnits(amtStr, decimals);

  const balBefore = await usdc.balanceOf(to);
  console.log(`[Before] To balance=${ethers.formatUnits(balBefore, decimals)} USDC`);

  const tx = await usdc.mint(to, amount);
  console.log(`Mint tx: ${tx.hash}`);
  await tx.wait();

  const balAfter = await usdc.balanceOf(to);
  console.log(`[After] To balance=${ethers.formatUnits(balAfter, decimals)} USDC`);
}

main().catch((e) => { console.error(e); process.exit(1); });