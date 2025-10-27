const { ethers, deployments, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

function getFaucetPrivateKeyFromEnvLocal() {
  try {
    const envPath = path.join(__dirname, "../frontend/.env.local");
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/FAUCET_PRIVATE_KEY\s*=\s*(0x[0-9a-fA-F]{64})/);
    return match ? match[1] : null;
  } catch (_) {
    return null;
  }
}

async function main() {
  const chainId = (network.config.chainId || 31337).toString();
  const to = process.env.TO;
  const amtStr = process.env.AMOUNT || "3000000"; // in whole USDC units
  if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
    throw new Error("请提供有效的收款地址，示例：TO=0xabc...");
  }

  // Resolve faucet signer
  const overridePk = process.env.FAUCET_PRIVATE_KEY || null;
  const envPk = getFaucetPrivateKeyFromEnvLocal();
  const pk = overridePk || envPk;
  if (!pk) {
    throw new Error("未找到水龙头私钥。请在环境变量 FAUCET_PRIVATE_KEY 或 frontend/.env.local 中配置 FAUCET_PRIVATE_KEY");
  }
  const faucet = new ethers.Wallet(pk, ethers.provider);

  console.log(`[Faucet USDC Transfer] chainId=${chainId}`);
  console.log(`[Faucet] ${faucet.address}`);
  console.log(`[To] ${to}`);
  console.log(`[Amount] ${amtStr} USDC`);

  // Get USDC token
  const usdcDep = await deployments.get("MockERC20");
  const usdc = await ethers.getContractAt("MockERC20", usdcDep.address, faucet);
  const decimals = await usdc.decimals();
  const amount = ethers.parseUnits(amtStr, decimals);

  const balBefore = await usdc.balanceOf(to);
  const faucetBalBefore = await usdc.balanceOf(faucet.address);
  console.log(`[Balances] Faucet=${ethers.formatUnits(faucetBalBefore, decimals)} USDC, To=${ethers.formatUnits(balBefore, decimals)} USDC`);

  if (faucetBalBefore < amount) {
    throw new Error(`水龙头余额不足：需要 ${amtStr} USDC，当前 ${ethers.formatUnits(faucetBalBefore, decimals)} USDC`);
  }

  const tx = await usdc.transfer(to, amount);
  console.log(`Sent transfer tx: ${tx.hash}`);
  await tx.wait();

  const balAfter = await usdc.balanceOf(to);
  const faucetBalAfter = await usdc.balanceOf(faucet.address);
  console.log(`[Balances After] Faucet=${ethers.formatUnits(faucetBalAfter, decimals)} USDC, To=${ethers.formatUnits(balAfter, decimals)} USDC`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});