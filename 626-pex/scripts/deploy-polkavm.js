const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying PEX DEX to PolkaVM Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy contracts in order
  console.log("📄 Deploying contracts...");

  // 1. Deploy MockPriceOracle
  console.log("Deploying MockPriceOracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const priceOracle = await MockPriceOracle.deploy();
  await priceOracle.waitForDeployment();
  console.log("MockPriceOracle deployed to:", await priceOracle.getAddress());

  // 2. Deploy MarginVault
  console.log("Deploying MarginVault...");
  const MarginVault = await ethers.getContractFactory("MarginVault");
  const marginVault = await MarginVault.deploy();
  await marginVault.waitForDeployment();
  console.log("MarginVault deployed to:", await marginVault.getAddress());

  // 3. Deploy OrderBook
  console.log("Deploying OrderBook...");
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy(
    await marginVault.getAddress(),
    await priceOracle.getAddress()
  );
  await orderBook.waitForDeployment();
  console.log("OrderBook deployed to:", await orderBook.getAddress());

  // 4. Deploy PerpMarket
  console.log("Deploying PerpMarket...");
  const PerpMarket = await ethers.getContractFactory("PerpMarket");
  const perpMarket = await PerpMarket.deploy(
    await marginVault.getAddress(),
    await orderBook.getAddress(),
    await priceOracle.getAddress()
  );
  await perpMarket.waitForDeployment();
  console.log("PerpMarket deployed to:", await perpMarket.getAddress());

  // 5. Deploy LiquidationEngine
  console.log("Deploying LiquidationEngine...");
  const LiquidationEngine = await ethers.getContractFactory("LiquidationEngine");
  const liquidationEngine = await LiquidationEngine.deploy(
    await marginVault.getAddress(),
    await perpMarket.getAddress(),
    await priceOracle.getAddress()
  );
  await liquidationEngine.waitForDeployment();
  console.log("LiquidationEngine deployed to:", await liquidationEngine.getAddress());

  // Set up contract relationships
  console.log("\n⚙️  Setting up contract relationships...");
  
  await marginVault.setOrderBook(await orderBook.getAddress());
  await marginVault.setPerpMarket(await perpMarket.getAddress());
  await marginVault.setLiquidationEngine(await liquidationEngine.getAddress());
  
  await orderBook.setPerpMarket(await perpMarket.getAddress());
  
  console.log("Contract relationships configured");

  // Deploy test tokens (for testnet only)
  console.log("\n💰 Deploying test tokens...");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  console.log("USDC deployed to:", await usdc.getAddress());
  
  const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
  await weth.waitForDeployment();
  console.log("WETH deployed to:", await weth.getAddress());
  
  const wbtc = await MockERC20.deploy("Wrapped Bitcoin", "WBTC", 8);
  await wbtc.waitForDeployment();
  console.log("WBTC deployed to:", await wbtc.getAddress());

  // Configure supported collateral
  console.log("\n🏦 Configuring supported collateral...");
  
  const collaterals = [
    { token: usdc, symbol: "USDC", ltv: 9000, liquidationThreshold: 8500 },
    { token: weth, symbol: "WETH", ltv: 8000, liquidationThreshold: 7500 },
    { token: wbtc, symbol: "WBTC", ltv: 8000, liquidationThreshold: 7500 }
  ];
  
  for (const collateral of collaterals) {
    await marginVault.addSupportedCollateral(
      await collateral.token.getAddress(),
      collateral.ltv,
      collateral.liquidationThreshold
    );
    
    // Set price feeds
    await priceOracle.setPrice(
      collateral.symbol + "-USD",
      collateral.symbol === "USDC" ? ethers.parseEther("1") :
      collateral.symbol === "WETH" ? ethers.parseEther("3000") :
      ethers.parseEther("45000")
    );
    
    console.log(`Added ${collateral.symbol} as supported collateral`);
  }

  // Add trading markets
  console.log("\n📊 Adding trading markets...");
  
  const markets = [
    { symbol: "BTC-USD", price: "45000" },
    { symbol: "ETH-USD", price: "3000" },
    { symbol: "SOL-USD", price: "100" }
  ];
  
  for (const market of markets) {
    await perpMarket.addMarket(
      ethers.encodeBytes32String(market.symbol),
      ethers.parseEther("0.001"), // minSize: 0.001
      ethers.parseEther("1000"),  // maxSize: 1000
      100,  // maxLeverage: 100x
      50,   // maintenanceMargin: 0.5%
      10    // takerFee: 0.1%
    );
    
    await priceOracle.setPrice(market.symbol, ethers.parseEther(market.price));
    console.log(`Added ${market.symbol} market`);
  }

  // Save deployment information
  console.log("\n💾 Saving deployment information...");
  
  const deploymentInfo = {
    network: "polkavm-testnet",
    chainId: 9999, // PolkaVM testnet chain ID
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockPriceOracle: await priceOracle.getAddress(),
      MarginVault: await marginVault.getAddress(),
      OrderBook: await orderBook.getAddress(),
      PerpMarket: await perpMarket.getAddress(),
      LiquidationEngine: await liquidationEngine.getAddress()
    },
    tokens: {
      USDC: await usdc.getAddress(),
      WETH: await weth.getAddress(),
      WBTC: await wbtc.getAddress()
    },
    markets: markets.map(m => m.symbol),
    gasUsed: {
      // Will be filled by actual deployment
      total: "TBD"
    }
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments/polkavm-testnet");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentPath = path.join(deploymentsDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  // Save to frontend
  const frontendPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed-polkavm.json");
  try {
    fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to frontend: ${frontendPath}`);
  } catch (error) {
    console.log(`Warning: Could not save to frontend: ${error.message}`);
  }

  console.log(`Deployment info saved: ${deploymentPath}`);

  // Verification instructions
  console.log("\n🔍 Contract Verification:");
  console.log("Run the following commands to verify contracts:");
  console.log(`npx hardhat verify --network polkavm-testnet ${await priceOracle.getAddress()}`);
  console.log(`npx hardhat verify --network polkavm-testnet ${await marginVault.getAddress()}`);
  console.log(`npx hardhat verify --network polkavm-testnet ${await orderBook.getAddress()} ${await marginVault.getAddress()} ${await priceOracle.getAddress()}`);
  console.log(`npx hardhat verify --network polkavm-testnet ${await perpMarket.getAddress()} ${await marginVault.getAddress()} ${await orderBook.getAddress()} ${await priceOracle.getAddress()}`);
  console.log(`npx hardhat verify --network polkavm-testnet ${await liquidationEngine.getAddress()} ${await marginVault.getAddress()} ${await perpMarket.getAddress()} ${await priceOracle.getAddress()}`);

  console.log("\n✅ Deployment to PolkaVM Testnet completed successfully!");
  console.log("\n📋 Summary:");
  console.log("Contract Addresses:");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  console.log("\nToken Addresses:");
  Object.entries(deploymentInfo.tokens).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  
  console.log("\n🌐 Frontend Configuration:");
  console.log("Add these to your frontend environment variables:");
  console.log(`NEXT_PUBLIC_POLKAVM_CHAIN_ID=9999`);
  console.log(`NEXT_PUBLIC_POLKAVM_RPC_URL=https://polkavm-testnet-rpc.example.com`);
  console.log(`NEXT_PUBLIC_POLKAVM_ORDERBOOK_ADDRESS=${await orderBook.getAddress()}`);
  console.log(`NEXT_PUBLIC_POLKAVM_PERPMARKET_ADDRESS=${await perpMarket.getAddress()}`);
  console.log(`NEXT_PUBLIC_POLKAVM_MARGINVAULT_ADDRESS=${await marginVault.getAddress()}`);
  console.log(`NEXT_PUBLIC_POLKAVM_USDC_ADDRESS=${await usdc.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });