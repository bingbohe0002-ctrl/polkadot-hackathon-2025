const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying PEX core to AssetHub...\n");

  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;
  const net = await provider.getNetwork();

  console.log("Deploying with:", deployer.address);
  console.log("ChainId:", net.chainId.toString());
  console.log("Balance:", ethers.formatEther(await provider.getBalance(deployer.address)), "ETH\n");

  const USDC_ADDR = process.env.USDC_ADDRESS || "";
  const BTC_ADDR = process.env.BTC_ADDRESS || "";
  if (!USDC_ADDR || !BTC_ADDR) {
    throw new Error("缺少 USDC_ADDRESS 或 BTC_ADDRESS 环境变量。请设置后重试。");
  }

  // 1) Deploy OracleAdapter (admin = deployer)
  console.log("📄 Deploying OracleAdapter...");
  const OracleAdapter = await ethers.getContractFactory("OracleAdapter");
  const oracleAdapter = await OracleAdapter.deploy(deployer.address);
  await oracleAdapter.waitForDeployment();
  console.log("OracleAdapter:", await oracleAdapter.getAddress());

  // 2) Deploy MarginVault (admin = deployer)
  console.log("Deploying MarginVault...");
  const MarginVault = await ethers.getContractFactory("MarginVault");
  const marginVault = await MarginVault.deploy(deployer.address);
  await marginVault.waitForDeployment();
  console.log("MarginVault:", await marginVault.getAddress());

  // 3) Deploy PerpMarket (admin = deployer)
  console.log("Deploying PerpMarket...");
  const PerpMarket = await ethers.getContractFactory("PerpMarket");
  const perpMarket = await PerpMarket.deploy(deployer.address);
  await perpMarket.waitForDeployment();
  console.log("PerpMarket:", await perpMarket.getAddress());

  // 4) Deploy OrderBook with wiring
  console.log("Deploying OrderBook...");
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy(
    await perpMarket.getAddress(),
    await marginVault.getAddress()
  );
  await orderBook.waitForDeployment();
  console.log("OrderBook:", await orderBook.getAddress());

  // 5) Wire relationships into PerpMarket
  console.log("\n⚙️  Wiring relationships...");
  await (await perpMarket.setMarginVault(await marginVault.getAddress())).wait();
  await (await perpMarket.setOracleAdapter(await oracleAdapter.getAddress())).wait();
  await (await perpMarket.setMatchEngine(await orderBook.getAddress())).wait();
  await (await perpMarket.setUsdcToken(USDC_ADDR)).wait();
  console.log("PerpMarket wired.");

  // 6) Add collaterals in MarginVault
  console.log("\n🏦 Adding collaterals...");
  await (await marginVault.addCollateral(USDC_ADDR, 9000)).wait();
  await (await marginVault.addCollateral(BTC_ADDR, 8000)).wait();
  console.log("USDC/BTC added as collaterals.");

  // 7) Add BTC-USD market
  console.log("\n🧮 Adding BTC-USD market...");
  const minOrderSize = ethers.parseEther("0.01"); // 0.01 BTC
  const tickSize = 100000000n; // 1e8 to match PRICE_PRECISION
  await (await perpMarket.addMarket("BTC-USD", "BTC", "USD", 50, minOrderSize, tickSize)).wait();
  console.log("Market BTC-USD created.");

  // 8) Set oracle prices (bytes32 symbols, 18-decimal prices)
  console.log("\n📈 Setting oracle prices...");
  const symUSDC = ethers.encodeBytes32String("USDC-USD");
  const symBTC = ethers.encodeBytes32String("BTC-USD");
  await (await oracleAdapter.setPrice(symUSDC, ethers.parseEther("1"))).wait();
  await (await oracleAdapter.setPrice(symBTC, ethers.parseEther("45000"))).wait();
  console.log("Prices set.");

  // 9) Save deployment info
  const deploymentInfo = {
    network: "assethub-testnet",
    chainId: Number(net.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      OracleAdapter: await oracleAdapter.getAddress(),
      MarginVault: await marginVault.getAddress(),
      OrderBook: await orderBook.getAddress(),
      PerpMarket: await perpMarket.getAddress(),
    },
    tokens: {
      USDC: USDC_ADDR,
      BTC: BTC_ADDR,
    },
    markets: ["BTC-USD"],
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

  console.log("\n✅ AssetHub deployment completed.");
}

main().catch((e) => { console.error("❌ Deployment failed:", e); process.exit(1); });