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
  const overrideAddr = process.argv[2] || process.env.FAUCET_ADDRESS || null;

  let faucetAddr = overrideAddr;
  if (!faucetAddr) {
    const pk = getFaucetPrivateKeyFromEnvLocal();
    if (!pk) {
      throw new Error("未找到 FAUCET_ADDRESS 或 frontend/.env.local 中的 FAUCET_PRIVATE_KEY。请传入地址：npx hardhat run scripts/check-faucet-usdc.js --network localhost 0xabc...");
    }
    faucetAddr = new ethers.Wallet(pk).address;
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(faucetAddr)) {
    throw new Error("FAUCET 地址格式不正确");
  }

  console.log(`[Faucet USDC] Network chainId: ${chainId}`);
  console.log(`[Faucet USDC] Faucet: ${faucetAddr}`);

  const usdcDep = await deployments.get("MockERC20");
  const usdc = await ethers.getContractAt("MockERC20", usdcDep.address);
  console.log(`[USDC] Address: ${usdcDep.address}`);

  const bal = await usdc.balanceOf(faucetAddr);
  const decimals = await usdc.decimals();
  const fmt = (v) => ethers.formatUnits(v, decimals);
  console.log(`[USDC] Faucet Raw = ${bal}`);
  console.log(`[USDC] Faucet Formatted = ${fmt(bal)} USDC`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});