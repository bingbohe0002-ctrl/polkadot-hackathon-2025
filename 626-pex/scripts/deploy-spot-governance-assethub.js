const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

function loadAssetHubDeploymentFallback() {
  const fallback = { tokens: {}, contracts: {} };
  try {
    const p = path.join(__dirname, "../deployments/assethub/deployment.json");
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  } catch (e) {
    console.log("[Warn] Unable to read deployments/assethub/deployment.json:", e.message);
  }
  try {
    const f = path.join(__dirname, "../frontend/src/lib/contracts/deployed-assethub.json");
    if (fs.existsSync(f)) {
      return JSON.parse(fs.readFileSync(f, "utf8"));
    }
  } catch (e) {
    console.log("[Warn] Unable to read frontend deployed-assethub.json:", e.message);
  }
  return fallback;
}

async function main() {
  console.log("\n🚀 Deploying Spot & Governance to AssetHub...\n");
  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;
  const net = await provider.getNetwork();
  console.log("Deployer:", deployer.address);
  console.log("ChainId:", net.chainId.toString());
  console.log("Balance:", ethers.formatEther(await provider.getBalance(deployer.address)), "ETH\n");

  // Resolve token addresses
  let USDC = process.env.USDC_ADDRESS || process.env.NEXT_PUBLIC_USDC_ADDRESS || "";
  const fallback = loadAssetHubDeploymentFallback();
  if (!USDC) {
    USDC = fallback.tokens?.USDC || "";
  }
  if (!USDC) {
    throw new Error("缺少 USDC 地址。请设置 USDC_ADDRESS 或在 deployments/assethub/deployment.json 的 tokens.USDC 中提供。");
  }
  console.log("USDC:", USDC);

  // Deploy SpotMarket(admin = deployer)
  console.log("\n📄 Deploying SpotMarket...");
  const SpotMarket = await ethers.getContractFactory("SpotMarket");
  const spotMarket = await SpotMarket.deploy(deployer.address);
  await spotMarket.waitForDeployment();
  console.log("SpotMarket:", await spotMarket.getAddress());

  // Deploy SpotOrderBook(spot = spotMarket)
  console.log("Deploying SpotOrderBook...");
  const SpotOrderBook = await ethers.getContractFactory("SpotOrderBook");
  const spotOrderBook = await SpotOrderBook.deploy(await spotMarket.getAddress());
  await spotOrderBook.waitForDeployment();
  console.log("SpotOrderBook:", await spotOrderBook.getAddress());

  // Deploy TokenListingGovernor with native PEX (zero address)
  const votingBlocks = Number(process.env.VOTING_BLOCKS || 40);
  const approvalBps = Number(process.env.APPROVAL_BPS || 8000);
  console.log("\n🗳️  Deploying TokenListingGovernor (native PAS)");
  const Governor = await ethers.getContractFactory("TokenListingGovernor");
  const governor = await Governor.deploy(ethers.ZeroAddress, await spotMarket.getAddress(), votingBlocks, approvalBps);
  await governor.waitForDeployment();
  console.log("TokenListingGovernor:", await governor.getAddress());

  // Grant SpotMarket.GOVERNOR_ROLE to governor for finalize permission
  const GOV = await spotMarket.GOVERNOR_ROLE();
  const smAsAdmin = spotMarket.connect(deployer);
  const txGrant = await smAsAdmin.grantRole(GOV, await governor.getAddress());
  await txGrant.wait();
  console.log("Granted SpotMarket.GOVERNOR_ROLE to governor.");

  // Save deployment snapshot (merge with existing)
  const deploymentInfo = {
    network: "assethub-testnet",
    chainId: Number(net.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      ...(fallback.contracts || {}),
      SpotMarket: await spotMarket.getAddress(),
      SpotOrderBook: await spotOrderBook.getAddress(),
      TokenListingGovernor: await governor.getAddress(),
    },
    tokens: {
      ...(fallback.tokens || {}),
      USDC,
    },
    markets: Array.isArray(fallback.markets) ? fallback.markets : ["BTC-USD"],
  };

  const deploymentsDir = path.join(__dirname, "../deployments/assethub");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const deploymentPath = path.join(deploymentsDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Saved: ${deploymentPath}`);

  const frontendPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed-assethub.json");
  try {
    fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Saved to frontend: ${frontendPath}`);
  } catch (e) {
    console.log(`Warning: could not save to frontend: ${e.message}`);
  }

  console.log("\n✅ AssetHub Spot & Governance deployment completed.");
  console.log("\nNext steps:");
  console.log("- 创建治理提案：npx hardhat run scripts/demo-listing-governance.js --network assethub");
  console.log("- 或自定义：通过 TokenListingGovernor.createProposal(base, quote, symbol) 发起 PAS/USDC 等市场");
}

main().catch((e) => {
  console.error("❌ Deployment failed:", e);
  process.exit(1);
});