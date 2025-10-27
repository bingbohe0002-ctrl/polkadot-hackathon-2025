const { expect } = require("chai");
const { ethers, deployments, getNamedAccounts } = require("hardhat");

const ZERO = ethers.ZeroAddress;

// helpers mirroring SpotOrderBook's math
const toTokenDecimals = (amount18, decimals) => {
  if (decimals === 18) return amount18;
  if (decimals > 18) return amount18 * (10n ** BigInt(decimals - 18));
  return amount18 / (10n ** BigInt(18 - decimals));
};
const sizePriceToQuote = (size18, price18, quoteDecimals) => {
  const prod = size18 * price18; // 36 decimals
  const value18 = prod / (10n ** 18n); // 18 decimals
  return toTokenDecimals(value18, quoteDecimals);
};

describe("SpotOrderBook - native/non-native combinations", function () {
  let spotMarket, spotOrderBook, usdc, weth;
  let adminSigner, deployerSigner, traderA, traderB;

  beforeEach(async () => {
    await deployments.fixture(["USDC", "Spot"]);
    const smDep = await deployments.get("SpotMarket");
    const obDep = await deployments.get("SpotOrderBook");
    const usdcDep = await deployments.get("MockERC20");
    spotMarket = await ethers.getContractAt("SpotMarket", smDep.address);
    spotOrderBook = await ethers.getContractAt("SpotOrderBook", obDep.address);
    usdc = await ethers.getContractAt("MockERC20", usdcDep.address);
    try {
      const wethDep = await deployments.get("WETH");
      weth = await ethers.getContractAt("MockERC20", wethDep.address);
    } catch (_) {
      // Fallback: deploy a local WETH mock
      const ERC20 = await ethers.getContractFactory("MockERC20");
      weth = await ERC20.deploy("Wrapped Ether", "WETH", 18);
      await weth.waitForDeployment();
    }

    const { admin, deployer } = await getNamedAccounts();
    adminSigner = await ethers.getSigner(admin);
    deployerSigner = await ethers.getSigner(deployer);
    const signers = await ethers.getSigners();
    traderA = signers[4];
    traderB = signers[5];
  });

  it("Native base / ERC20 quote (SELL then BUY) matches and transfers", async () => {
    // Create PEX(native)/USDC market
    const addTx = await spotMarket.connect(adminSigner).addMarket(ZERO, usdc.target, "PAS/USDC", true, false);
    await addTx.wait();
    const markets = await spotMarket.getAllMarkets();
    const marketId = Number(markets[markets.length - 1].id);
    await (await spotMarket.connect(adminSigner).activateMarket(marketId)).wait();

    // Prepare amounts
    const size = ethers.parseEther("1"); // 1 base
    const price = ethers.parseEther("500"); // 500 USDC/base
    const quoteDec = Number(await usdc.decimals()); // 6
    const requiredBase = toTokenDecimals(size, 18); // native 18
    const requiredQuote = sizePriceToQuote(size, price, quoteDec);

    // Mint USDC to buyer (traderB), approve
    await (await usdc.connect(deployerSigner).mint(traderB.address, requiredQuote * 10n)).wait();
    await (await usdc.connect(traderB).approve(spotOrderBook.target, requiredQuote)).wait();

    // Seller places SELL with native base deposit
    const sellTx = await spotOrderBook.connect(traderA).placeOrder(
      marketId,
      0, // LIMIT
      1, // SELL
      size,
      price,
      { value: requiredBase }
    );
    await sellTx.wait();
    const sellIds = await spotOrderBook.getOrdersByTrader(traderA.address);
    const sellId = Number(sellIds[sellIds.length - 1]);

    // Buyer places BUY, reserve USDC
    const balBefore = await ethers.provider.getBalance(traderB.address);
    const buyTx = await spotOrderBook.connect(traderB).placeOrder(
      marketId,
      0, // LIMIT
      0, // BUY
      size,
      price
    );
    const buyRcpt = await buyTx.wait();

    const buyIds = await spotOrderBook.getOrdersByTrader(traderB.address);
    const buyId = Number(buyIds[buyIds.length - 1]);

    const sellOrder = await spotOrderBook.getOrder(sellId);
    const buyOrder = await spotOrderBook.getOrder(buyId);

    expect(sellOrder.status).to.equal(2); // FILLED
    expect(buyOrder.status).to.equal(2); // FILLED
    expect(sellOrder.reservedBase).to.equal(0);
    expect(buyOrder.reservedQuote).to.equal(0);

    // Seller should receive USDC equal to quote spent
    const sellerUsdc = await usdc.balanceOf(traderA.address);
    expect(sellerUsdc).to.equal(requiredQuote);
  });

  it("ERC20 base / Native quote (SELL then BUY) matches", async () => {
    // Create WETH/PEX(native) market
    const addTx = await spotMarket.connect(adminSigner).addMarket(weth.target, ZERO, "WETH/PEX", false, true);
    await addTx.wait();
    const markets = await spotMarket.getAllMarkets();
    const marketId = Number(markets[markets.length - 1].id);
    await (await spotMarket.connect(adminSigner).activateMarket(marketId)).wait();

    const size = ethers.parseEther("2");
    const price = ethers.parseEther("1000"); // 1000 native/base
    const baseDec = Number(await weth.decimals()); // 18
    const quoteDec = 18; // native

    const requiredBase = toTokenDecimals(size, baseDec);
    const requiredQuote = sizePriceToQuote(size, price, quoteDec);

    // Mint WETH to seller and approve
    await (await weth.connect(deployerSigner).mint(traderA.address, requiredBase * 10n)).wait();
    await (await weth.connect(traderA).approve(spotOrderBook.target, requiredBase)).wait();

    const sellTx = await spotOrderBook.connect(traderA).placeOrder(
      marketId,
      0,
      1,
      size,
      price
    );
    await sellTx.wait();
    const sellIds = await spotOrderBook.getOrdersByTrader(traderA.address);
    const sellId = Number(sellIds[sellIds.length - 1]);

    const buyTx = await spotOrderBook.connect(traderB).placeOrder(
      marketId,
      0,
      0,
      size,
      price,
      { value: requiredQuote }
    );
    await buyTx.wait();
    const buyIds = await spotOrderBook.getOrdersByTrader(traderB.address);
    const buyId = Number(buyIds[buyIds.length - 1]);

    const sellOrder = await spotOrderBook.getOrder(sellId);
    const buyOrder = await spotOrderBook.getOrder(buyId);

    expect(sellOrder.status).to.equal(2);
    expect(buyOrder.status).to.equal(2);
    expect(sellOrder.reservedBase).to.equal(0);
    expect(buyOrder.reservedQuote).to.equal(0);
  });

  it("ERC20 base / ERC20 quote matches without msg.value", async () => {
    // Create WETH/USDC market (ERC20/ERC20)
    const addTx = await spotMarket.connect(adminSigner).addMarket(weth.target, usdc.target, "WETH/USDC", false, false);
    await addTx.wait();
    const markets = await spotMarket.getAllMarkets();
    const marketId = Number(markets[markets.length - 1].id);
    await (await spotMarket.connect(adminSigner).activateMarket(marketId)).wait();

    const size = ethers.parseEther("1.5");
    const price = ethers.parseEther("700");
    const baseDec = Number(await weth.decimals());
    const quoteDec = Number(await usdc.decimals());
    const requiredBase = toTokenDecimals(size, baseDec);
    const requiredQuote = sizePriceToQuote(size, price, quoteDec);

    await (await weth.connect(deployerSigner).mint(traderA.address, requiredBase * 10n)).wait();
    await (await weth.connect(traderA).approve(spotOrderBook.target, requiredBase)).wait();

    await (await usdc.connect(deployerSigner).mint(traderB.address, requiredQuote * 10n)).wait();
    await (await usdc.connect(traderB).approve(spotOrderBook.target, requiredQuote)).wait();

    await (await spotOrderBook.connect(traderA).placeOrder(marketId, 0, 1, size, price)).wait();
    const sellIds = await spotOrderBook.getOrdersByTrader(traderA.address);
    const sellId = Number(sellIds[sellIds.length - 1]);

    await (await spotOrderBook.connect(traderB).placeOrder(marketId, 0, 0, size, price)).wait();
    const buyIds = await spotOrderBook.getOrdersByTrader(traderB.address);
    const buyId = Number(buyIds[buyIds.length - 1]);

    const sellOrder = await spotOrderBook.getOrder(sellId);
    const buyOrder = await spotOrderBook.getOrder(buyId);
    expect(sellOrder.status).to.equal(2);
    expect(buyOrder.status).to.equal(2);
  });

  it("Native base / Native quote matches with msg.value on both sides", async () => {
    // Create PEX(native)/PEX(native) market
    const addTx = await spotMarket.connect(adminSigner).addMarket(ZERO, ZERO, "PEX/PEX", true, true);
    await addTx.wait();
    const markets = await spotMarket.getAllMarkets();
    const marketId = Number(markets[markets.length - 1].id);
    await (await spotMarket.connect(adminSigner).activateMarket(marketId)).wait();

    const size = ethers.parseEther("0.75");
    const price = ethers.parseEther("1.25");
    const baseDec = 18;
    const quoteDec = 18;
    const requiredBase = toTokenDecimals(size, baseDec);
    const requiredQuote = sizePriceToQuote(size, price, quoteDec);

    const sellTx = await spotOrderBook.connect(traderA).placeOrder(
      marketId,
      0,
      1,
      size,
      price,
      { value: requiredBase }
    );
    await sellTx.wait();
    const sellIds = await spotOrderBook.getOrdersByTrader(traderA.address);
    const sellId = Number(sellIds[sellIds.length - 1]);

    const buyTx = await spotOrderBook.connect(traderB).placeOrder(
      marketId,
      0,
      0,
      size,
      price,
      { value: requiredQuote }
    );
    await buyTx.wait();
    const buyIds = await spotOrderBook.getOrdersByTrader(traderB.address);
    const buyId = Number(buyIds[buyIds.length - 1]);

    const sellOrder = await spotOrderBook.getOrder(sellId);
    const buyOrder = await spotOrderBook.getOrder(buyId);

    expect(sellOrder.status).to.equal(2);
    expect(buyOrder.status).to.equal(2);
    expect(sellOrder.reservedBase).to.equal(0);
    expect(buyOrder.reservedQuote).to.equal(0);
  });
});