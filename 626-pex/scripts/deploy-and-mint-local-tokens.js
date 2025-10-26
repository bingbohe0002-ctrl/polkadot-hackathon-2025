const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await ethers.getSigners();
  const defaultFaucet = signers[1]?.address || signers[0].address;
  const faucetAddress = process.env.FAUCET_ADDRESS || defaultFaucet;

  const usdcDecimals = 6n;
  const btcDecimals = 8n;

  const usdcAmountTokens = BigInt(process.env.FAUCET_USDC_AMOUNT || "1000000"); // 1,000,000 USDC
  const btcAmountTokens = BigInt(process.env.FAUCET_BTC_AMOUNT || "1000000");   // 1,000,000 BTC (mock)

  const usdcAmount = usdcAmountTokens * (10n ** usdcDecimals);
  const btcAmount = btcAmountTokens * (10n ** btcDecimals);

  const network = await ethers.provider.getNetwork();
  console.log(`[Deploy] chainId=${network.chainId}`);
  console.log(`[Faucet] ${faucetAddress}`);

  // Deploy Mock USDC
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", Number(usdcDecimals));
  await usdc.waitForDeployment();
  console.log(`[USDC] address=${usdc.target}`);

  // Deploy Mock BTC
  const btc = await MockERC20.deploy("Bitcoin", "BTC", Number(btcDecimals));
  await btc.waitForDeployment();
  console.log(`[BTC] address=${btc.target}`);

  // Mint to faucet
  const tx1 = await usdc.mint(faucetAddress, usdcAmount);
  await tx1.wait();
  console.log(`[Minted] USDC=${usdcAmountTokens} to ${faucetAddress}`);

  const tx2 = await btc.mint(faucetAddress, btcAmount);
  await tx2.wait();
  console.log(`[Minted] BTC=${btcAmountTokens} to ${faucetAddress}`);

  // Update frontend deployed.json
  const deployedPath = path.resolve(__dirname, "../../frontend/src/lib/contracts/deployed.json");
  let deployed = { tokens: {} };
  try {
    if (fs.existsSync(deployedPath)) {
      deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    }
  } catch (e) {
    console.warn(`[Warn] Failed to read deployed.json: ${e.message}`);
  }
  deployed.tokens = deployed.tokens || {};
  deployed.tokens.usdc = usdc.target;
  deployed.tokens.btc = btc.target;

  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log(`[Update] ${deployedPath} updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});