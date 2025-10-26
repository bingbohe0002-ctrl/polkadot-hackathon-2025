const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

function isHexAddress(addr) {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/.test(addr) && addr !== ethers.ZeroAddress;
}

function loadFallbackSnapshot() {
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

function resolveTokenAddr(name, snap) {
  const upper = name.toUpperCase();
  const envCandidates = [
    process.env[`${upper}_ADDRESS`],
    process.env[`NEXT_PUBLIC_${upper}_ADDRESS`],
  ];
  for (const c of envCandidates) {
    if (isHexAddress((c || "").trim())) return (c || "").trim();
  }
  const snapVal = snap?.tokens?.[upper] || snap?.tokens?.[name] || snap?.tokens?.[upper.toLowerCase()];
  if (isHexAddress((snapVal || "").trim())) return (snapVal || "").trim();
  return "";
}

async function main() {
  console.log("\n🚀 Deploying ALL PEX contracts (Core + Spot + Governance) to AssetHub...\n");
  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;
  const net = await provider.getNetwork();
  console.log("Deployer:", deployer.address);
  console.log("ChainId:", net.chainId.toString());
  console.log("Balance:", ethers.formatEther(await provider.getBalance(deployer.address)), "ETH\n");

  // Resolve required token addresses (USDC, BTC, USDT optional)
  const snap = loadFallbackSnapshot();
  let USDC = resolveTokenAddr("USDC", snap);
  let BTC = resolveTokenAddr("BTC", snap);
  let USDT = resolveTokenAddr("USDT", snap);
  if (!USDC || !BTC) {
    throw new Error("缺少 USDC 或 BTC 地址。请通过环境变量 USDC_ADDRESS/BTC_ADDRESS 或前端快照/部署快照提供。");
  }
  console.log("USDC:", USDC);
  console.log("BTC:", BTC);
  if (USDT) {
    console.log("USDT:", USDT);
  } else {
    console.log("USDT: (未提供，跳过)");
  }

  // === 1) Core: OracleAdapter, MarginVault, PerpMarket, OrderBook ===
  console.log("\n📄 Deploying OracleAdapter...");
  const OracleAdapter = await ethers.getContractFactory("OracleAdapter");
  const oracleAdapter = await OracleAdapter.deploy(deployer.address);
  await oracleAdapter.waitForDeployment();
  console.log("OracleAdapter:", await oracleAdapter.getAddress());

  console.log("Deploying MarginVault...");
  const MarginVault = await ethers.getContractFactory("MarginVault");
  const marginVault = await MarginVault.deploy(deployer.address);
  await marginVault.waitForDeployment();
  console.log("MarginVault:", await marginVault.getAddress());

  console.log("Deploying PerpMarket...");
  const PerpMarket = await ethers.getContractFactory("PerpMarket");
  const perpMarket = await PerpMarket.deploy(deployer.address);
  await perpMarket.waitForDeployment();
  console.log("PerpMarket:", await perpMarket.getAddress());

  // NEW: Deploy RiskEngine and FeeCollector
  console.log("Deploying RiskEngine...");
  const RiskEngine = await ethers.getContractFactory("RiskEngine");
  const riskEngine = await RiskEngine.deploy(deployer.address);
  await riskEngine.waitForDeployment();
  console.log("RiskEngine:", await riskEngine.getAddress());

  console.log("Deploying FeeCollector...");
  const FeeCollector = await ethers.getContractFactory("FeeCollector");
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  const feeCollector = await FeeCollector.deploy(deployer.address, treasury);
  await feeCollector.waitForDeployment();
  console.log("FeeCollector:", await feeCollector.getAddress(), "Treasury:", treasury);

  console.log("Deploying OrderBook...");
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy(
    await perpMarket.getAddress(),
    await marginVault.getAddress()
  );
  await orderBook.waitForDeployment();
  console.log("OrderBook:", await orderBook.getAddress());

  console.log("\n⚙️  Wiring core relationships...");
  await (await perpMarket.setMarginVault(await marginVault.getAddress())).wait();
  await (await perpMarket.setOracleAdapter(await oracleAdapter.getAddress())).wait();
  await (await perpMarket.setMatchEngine(await orderBook.getAddress())).wait();
  await (await perpMarket.setUsdcToken(USDC)).wait();
  // NEW: Wire RiskEngine and FeeCollector
  await (await perpMarket.setRiskEngine(await riskEngine.getAddress())).wait();
  await (await perpMarket.setFeeCollector(await feeCollector.getAddress())).wait();
  console.log("PerpMarket wired.");

  console.log("\n🏦 Adding collaterals (USDC/BTC + USDT if provided) to MarginVault...");
  await (await marginVault.addCollateral(USDC, 9000)).wait();
  await (await marginVault.addCollateral(BTC, 8000)).wait();
  if (USDT) {
    await (await marginVault.addCollateral(USDT, 9000)).wait();
    console.log("USDT added as collateral.");
  }
  console.log("USDC/BTC" + (USDT ? "/USDT" : "") + " added as collaterals.");

  console.log("\n🧮 Adding BTC-USD market...");
  const minOrderSize = ethers.parseEther("0.01"); // 0.01 BTC
  const tickSize = 100000000n; // to match PRICE_PRECISION
  await (await perpMarket.addMarket("BTC-USD", "BTC", "USD", 50, minOrderSize, tickSize)).wait();
  console.log("Market BTC-USD created.");

  console.log("\n📈 Setting oracle prices...");
  const symUSDC = ethers.encodeBytes32String("USDC-USD");
  const symBTC = ethers.encodeBytes32String("BTC-USD");
  await (await oracleAdapter.setPrice(symUSDC, ethers.parseEther("1"))).wait();
  await (await oracleAdapter.setPrice(symBTC, ethers.parseEther("45000"))).wait();
  if (USDT) {
    const symUSDT = ethers.encodeBytes32String("USDT-USD");
    await (await oracleAdapter.setPrice(symUSDT, ethers.parseEther("1"))).wait();
  }
  console.log("Prices set.");

  // === 2) Spot: SpotMarket, SpotOrderBook ===
  console.log("\n📄 Deploying SpotMarket...");
  const SpotMarket = await ethers.getContractFactory("SpotMarket");
  const spotMarket = await SpotMarket.deploy(deployer.address);
  await spotMarket.waitForDeployment();
  console.log("SpotMarket:", await spotMarket.getAddress());

  console.log("Deploying SpotOrderBook...");
  const SpotOrderBook = await ethers.getContractFactory("SpotOrderBook");
  const spotOrderBook = await SpotOrderBook.deploy(await spotMarket.getAddress());
  await spotOrderBook.waitForDeployment();
  console.log("SpotOrderBook:", await spotOrderBook.getAddress());

  // === 2.1) Add & activate native PAS spot markets ===
  console.log("\n🪙 Adding and activating PAS/USDC + USDC/PAS spot markets...");
  const Zero = ethers.ZeroAddress;
  const smGovRole = await spotMarket.GOVERNOR_ROLE();
  const hasGov = await spotMarket.hasRole(smGovRole, deployer.address).catch(() => false);
  if (!hasGov) {
    const adm = await spotMarket.DEFAULT_ADMIN_ROLE();
    const isAdmin = await spotMarket.hasRole(adm, deployer.address).catch(() => false);
    if (!isAdmin) {
      throw new Error("Deployer lacks SpotMarket roles to add markets");
    }
  }
  const existingMarkets = await spotMarket.getAllMarkets();
  const existingSymbols = new Set(existingMarkets.map((m) => m.symbol));
  const targets = [
    { base: Zero, quote: USDC, symbol: "PAS/USDC", baseIsNative: true, quoteIsNative: false },
    { base: USDC, quote: Zero, symbol: "USDC/PAS", baseIsNative: false, quoteIsNative: true },
  ];
  for (const t of targets) {
    if (!existingSymbols.has(t.symbol)) {
      const txAdd = await spotMarket.addMarket(t.base, t.quote, t.symbol, t.baseIsNative, t.quoteIsNative);
      const rec = await txAdd.wait();
      console.log(`Added spot market ${t.symbol}. tx=${rec.hash}`);
    } else {
      console.log(`Spot market already exists: ${t.symbol}`);
    }
  }
  const marketsNow = await spotMarket.getAllMarkets();
  for (const m of marketsNow) {
    if (!m.isActive && (m.symbol === "PAS/USDC" || m.symbol === "USDC/PAS")) {
      const txAct = await spotMarket.activateMarket(m.id);
      const rec2 = await txAct.wait();
      console.log(`Activated spot market ${m.symbol} (id=${m.id}). tx=${rec2.hash}`);
    }
  }

  // === 3) Governance: TokenListingGovernor (native PAS) ===
  const votingBlocks = Number(process.env.VOTING_BLOCKS || 40);
  const approvalBps = Number(process.env.APPROVAL_BPS || 8000);
  console.log("\n🗳️  Deploying TokenListingGovernor (native PAS)");
  const Governor = await ethers.getContractFactory("TokenListingGovernor");
  const governor = await Governor.deploy(
    ethers.ZeroAddress,
    await spotMarket.getAddress(),
    votingBlocks,
    approvalBps
  );
  await governor.waitForDeployment();
  console.log("TokenListingGovernor:", await governor.getAddress());

  console.log("Granting SpotMarket.GOVERNOR_ROLE to governor...");
  const GOV = await spotMarket.GOVERNOR_ROLE();
  const smAsAdmin = spotMarket.connect(deployer);
  const txGrant = await smAsAdmin.grantRole(GOV, await governor.getAddress());
  await txGrant.wait();
  console.log("Granted SpotMarket.GOVERNOR_ROLE.");

  // === Save snapshot (merge with fallback) ===
  const deploymentInfo = {
    network: "assethub-testnet",
    chainId: Number(net.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      ...(snap.contracts || {}),
      OracleAdapter: await oracleAdapter.getAddress(),
      MarginVault: await marginVault.getAddress(),
      OrderBook: await orderBook.getAddress(),
      PerpMarket: await perpMarket.getAddress(),
      RiskEngine: await riskEngine.getAddress(),
      FeeCollector: await feeCollector.getAddress(),
      SpotMarket: await spotMarket.getAddress(),
      SpotOrderBook: await spotOrderBook.getAddress(),
      TokenListingGovernor: await governor.getAddress(),
    },
    tokens: {
      ...(snap.tokens || {}),
      USDC,
      BTC,
      ...(USDT ? { USDT } : {}),
    },
    markets: Array.from(new Set([...(Array.isArray(snap.markets) ? snap.markets : ["BTC-USD"]), "PAS/USDC", "USDC/PAS"])),
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

  console.log("\n✅ AssetHub unified deployment completed.");
  console.log("\nNext steps:");
  console.log("- 检查 USDC 元数据：npx hardhat run scripts/check-assethub-usdc.js --network assethub");
  console.log("- 授权其他管理员：TARGET_ADDR=0x... npx hardhat run scripts/grant-admins-assethub.js --network assethub");
  console.log("- 创建治理提案：npx hardhat run scripts/demo-listing-governance.js --network assethub");
}

main().catch((e) => {
  console.error("❌ Unified deployment failed:", e);
  process.exit(1);
});