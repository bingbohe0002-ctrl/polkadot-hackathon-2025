const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Setting up PEX DEX development environment...\n");

  const [deployer, user1, user2, user3] = await ethers.getSigners();
  // In local deployment, admin is the second named account per deploy scripts
  const adminSigner = user1;
  
  console.log("📋 Account Information:");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`User1: ${user1.address}`);
  console.log(`User2: ${user2.address}`);
  console.log(`User3: ${user3.address}\n`);

  // Get deployed contracts (read individual deployment JSONs)
  const readDeployment = (name) => {
    const p = path.join(__dirname, `../deployments/localhost/${name}.json`);
    const raw = fs.readFileSync(p, "utf-8");
    const json = JSON.parse(raw);
    return json.address || json?.address;
  };

  const orderBookAddr = readDeployment("OrderBook");
  const perpMarketAddr = readDeployment("PerpMarket");
  const marginVaultAddr = readDeployment("MarginVault");
  const oracleAdapterAddr = readDeployment("OracleAdapter");

  const orderBook = await ethers.getContractAt("OrderBook", orderBookAddr);
  const perpMarket = await ethers.getContractAt("PerpMarket", perpMarketAddr);
  const marginVault = await ethers.getContractAt("MarginVault", marginVaultAddr);
  const priceOracle = await ethers.getContractAt("OracleAdapter", oracleAdapterAddr);
  
  console.log("📄 Contract Addresses:");
  console.log(`OrderBook: ${orderBook.target}`);
  console.log(`PerpMarket: ${perpMarket.target}`);
  console.log(`MarginVault: ${marginVault.target}`);
  console.log(`OracleAdapter: ${priceOracle.target}`);
  console.log(`USDC: <none deployed>\n`);

  // Mint test tokens to users (skipped: no MockERC20 deployed)
  console.log("💰 Minting test tokens skipped (no ERC20 deployed)");

  // Set up some initial market data
  console.log("\n📊 Setting up market data...");
  
  // Ensure markets exist
  console.log("Adding sample markets...");
  const addMarket = async (sym, base, quote, maxLev, minSize, tick) => {
    // Use static call to compute returned marketId, then send tx
    const expectedId = await perpMarket.connect(adminSigner).addMarket.staticCall(sym, base, quote, maxLev, ethers.parseEther(minSize), ethers.parseEther(tick));
    await (await perpMarket.connect(adminSigner).addMarket(sym, base, quote, maxLev, ethers.parseEther(minSize), ethers.parseEther(tick))).wait();
    return Number(expectedId);
  };
  const marketIdBTC = await addMarket("BTC-USD", "BTC", "USD", 100, "0.001", "1");
  const marketIdETH = await addMarket("ETH-USD", "ETH", "USD", 50, "0.01", "0.5");
  console.log(`Markets added: BTC-USD -> ${marketIdBTC}, ETH-USD -> ${marketIdETH}`);

  // Update prices (OracleAdapter expects bytes32 symbols)
  await priceOracle.connect(adminSigner).setPrice(ethers.encodeBytes32String("BTC-USD"), ethers.parseEther("45000"));
  await priceOracle.connect(adminSigner).setPrice(ethers.encodeBytes32String("ETH-USD"), ethers.parseEther("3000"));
  await priceOracle.connect(adminSigner).setPrice(ethers.encodeBytes32String("SOL-USD"), ethers.parseEther("100"));
  
  console.log("Updated price feeds");

  // Deposit collateral for users (skipped: MarginVault expects ERC20 transfers)
  console.log("\n🏦 Collateral deposit skipped (requires ERC20 token)");

  // Place some initial orders to create market depth
  console.log("\n📈 Creating initial market depth...");
  
  const markets = [
    { symbol: "BTC-USD", id: marketIdBTC },
    { symbol: "ETH-USD", id: marketIdETH },
  ];
  
  for (const market of markets) {
    // Get current price
    const currentPrice = await priceOracle.getPrice(ethers.encodeBytes32String(market.symbol));
    const price = Number(ethers.formatEther(currentPrice));
    
    // Place buy orders (bids) below current price
    const bidPrices = [
      price * 0.99,  // 1% below
      price * 0.98,  // 2% below
      price * 0.97,  // 3% below
    ];
    
    // Place sell orders (asks) above current price
    const askPrices = [
      price * 1.01,  // 1% above
      price * 1.02,  // 2% above
      price * 1.03,  // 3% above
    ];
    
    // Place bid orders
    for (let i = 0; i < bidPrices.length; i++) {
      const user = [user1, user2, user3][i];
      const orderPrice = ethers.parseEther(bidPrices[i].toString());
      const orderSize = ethers.parseEther("0.1"); // 0.1 BTC/ETH
      
      await orderBook.connect(user).placeOrder(
        market.id,
        0, // LIMIT order
        0, // BUY side
        orderSize,
        orderPrice,
        10 // 10x leverage
      );
    }
    
    // Place ask orders
    for (let i = 0; i < askPrices.length; i++) {
      const user = [user1, user2, user3][i];
      const orderPrice = ethers.parseEther(askPrices[i].toString());
      const orderSize = ethers.parseEther("0.1"); // 0.1 BTC/ETH
      
      await orderBook.connect(user).placeOrder(
        market.id,
        0, // LIMIT order
        1, // SELL side
        orderSize,
        orderPrice,
        10 // 10x leverage
      );
    }
    
    console.log(`Created order book depth for ${market}`);
  }

  // Open some sample positions
  console.log("\n🎯 Opening sample positions...");
  
  // User1 opens a long BTC position
  const btcPrice = await priceOracle.getPrice(ethers.encodeBytes32String("BTC-USD"));
  await perpMarket.connect(user1).openPosition(
    marketIdBTC,
    0, // LONG
    ethers.parseEther("0.5"), // 0.5 BTC
    20, // 20x leverage
    btcPrice
  );
  console.log("User1 opened 0.5 BTC long position with 20x leverage");
  
  // User2 opens a short ETH position
  const ethPrice = await priceOracle.getPrice(ethers.encodeBytes32String("ETH-USD"));
  await perpMarket.connect(user2).openPosition(
    marketIdETH,
    1, // SHORT
    ethers.parseEther("2"), // 2 ETH
    15, // 15x leverage
    ethPrice
  );
  console.log("User2 opened 2 ETH short position with 15x leverage");

  // Generate development configuration file
  console.log("\n⚙️  Generating development configuration...");
  
  const devConfig = {
    network: {
      name: "localhost",
      chainId: 31337,
      rpcUrl: "http://127.0.0.1:8545"
    },
    contracts: {
      orderBook: orderBook.target,
      perpMarket: perpMarket.target,
      marginVault: marginVault.target,
      priceOracle: priceOracle.target
    },
    tokens: {
      usdc: "0x0000000000000000000000000000000000000000"
    },
    accounts: {
      deployer: deployer.address,
      users: [user1.address, user2.address, user3.address]
    },
    testData: {
      markets: ["BTC-USD", "ETH-USD", "SOL-USD"],
      initialPrices: {
        "BTC-USD": "45000",
        "ETH-USD": "3000",
        "SOL-USD": "100"
      }
    },
    timestamp: new Date().toISOString()
  };

  // Save configuration
  const configPath = path.join(__dirname, "../dev-config.json");
  fs.writeFileSync(configPath, JSON.stringify(devConfig, null, 2));
  
  // Also save to frontend
  const frontendConfigPath = path.join(__dirname, "../frontend/src/lib/dev-config.json");
  try {
    fs.writeFileSync(frontendConfigPath, JSON.stringify(devConfig, null, 2));
    console.log(`Development config saved to frontend: ${frontendConfigPath}`);
  } catch (error) {
    console.log(`Warning: Could not save to frontend: ${error.message}`);
  }

  console.log(`Development config saved: ${configPath}`);

  // Print useful information
  console.log("\n✅ Development environment setup complete!");
  console.log("\n📝 Quick Start Guide:");
  console.log("1. Start the frontend: cd frontend && npm run dev");
  console.log("2. Connect MetaMask to localhost:8545");
  console.log("3. Import one of the test accounts using their private keys");
  console.log("4. Start trading on the DEX!");
  
  console.log("\n🔑 Test Account Private Keys:");
  console.log("(These are for development only - never use in production)");
  
  // Note: These are the default Hardhat accounts
  const testPrivateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // user1
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // user2
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // user3
  ];
  
  testPrivateKeys.forEach((key, index) => {
    console.log(`User${index + 1}: ${key}`);
  });

  console.log("\n🌐 Frontend Environment Variables:");
  console.log("Add these to your frontend/.env.local file:");
  console.log(`NEXT_PUBLIC_CHAIN_ID=31337`);
  console.log(`NEXT_PUBLIC_RPC_URL=http://localhost:8545`);
  console.log(`NEXT_PUBLIC_ORDERBOOK_ADDRESS=${orderBook.target}`);
  console.log(`NEXT_PUBLIC_PERPMARKET_ADDRESS=${perpMarket.target}`);
  console.log(`NEXT_PUBLIC_MARGINVAULT_ADDRESS=${marginVault.target}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=0x0000000000000000000000000000000000000000`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });