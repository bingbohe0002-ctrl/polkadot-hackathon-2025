const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrderBook", function () {
  let orderBook;
  let perpMarket;
  let marginVault;
  let owner, trader1, trader2;

  const MARKET_ID = 1;

  beforeEach(async () => {
    [owner, trader1, trader2] = await ethers.getSigners();

    const PerpFactory = await ethers.getContractFactory("MockPerpMarket");
    perpMarket = await PerpFactory.deploy();
    await perpMarket.waitForDeployment();
    await (await perpMarket.setMarketActive(MARKET_ID, true)).wait();

    const VaultFactory = await ethers.getContractFactory("MockMarginVault");
    marginVault = await VaultFactory.deploy();
    await marginVault.waitForDeployment();

    const OrderBookFactory = await ethers.getContractFactory("OrderBook");
    orderBook = await OrderBookFactory.deploy(await perpMarket.getAddress(), await marginVault.getAddress());
    await orderBook.waitForDeployment();
  });

  it("places limit orders and matches when prices cross", async () => {
    // trader1 places BUY limit at 100
    const tx1 = await orderBook.connect(trader1).placeOrder(
      MARKET_ID,
      0, // LIMIT
      0, // BUY
      100,
      100,
      10
    );
    const receipt1 = await tx1.wait();
    const orderId1 = receipt1.logs.find(() => true) ? (await orderBook.getOrderCount()) : 1; // fallback

    const order1 = await orderBook.getOrder(orderId1);
    expect(order1.status).to.equal(0); // PENDING

    // trader2 places SELL limit at 100 -> should match
    const tx2 = await orderBook.connect(trader2).placeOrder(
      MARKET_ID,
      0, // LIMIT
      1, // SELL
      100,
      100,
      10
    );
    await tx2.wait();

    const buyOrder = await orderBook.getOrder(orderId1);
    expect(buyOrder.filledSize).to.equal(100);
    expect(buyOrder.status).to.equal(1); // FILLED

    // the sell order should also be filled; its id is orderId1+1
    const sellOrder = await orderBook.getOrder(orderId1 + 1n);
    expect(sellOrder.filledSize).to.equal(100);
    expect(sellOrder.status).to.equal(1); // FILLED
  });

  it("supports market order matching against existing limits", async () => {
    // place a SELL limit of 100 @ 99
    await (await orderBook.connect(trader2).placeOrder(MARKET_ID, 0, 1, 100, 99, 10)).wait();

    // place a BUY market of 60
    const tx = await orderBook.connect(trader1).placeOrder(MARKET_ID, 1, 0, 60, 0, 10);
    await tx.wait();

    // market buy should be fully filled
    const marketOrder = await orderBook.getOrder(2n); // it should be the second order
    expect(marketOrder.filledSize).to.equal(60);
    expect(marketOrder.status).to.equal(1); // FILLED

    // limit sell should be partially filled
    const limitSell = await orderBook.getOrder(1n);
    expect(limitSell.filledSize).to.equal(60);
    expect(limitSell.status).to.equal(3); // PARTIALLY_FILLED
  });

  it("cancels a pending order", async () => {
    const tx = await orderBook.connect(trader1).placeOrder(MARKET_ID, 0, 0, 50, 101, 10);
    await tx.wait();
    const id = await orderBook.getOrderCount();

    await (await orderBook.connect(trader1).cancelOrder(id)).wait();
    const order = await orderBook.getOrder(id);
    expect(order.status).to.equal(2); // CANCELLED
  });

  it("computes best bid/ask and spread", async () => {
    // BUY 100 @ 100
    await (await orderBook.connect(trader1).placeOrder(MARKET_ID, 0, 0, 100, 100, 10)).wait();
    // SELL 100 @ 105 (no match, ask > bid)
    await (await orderBook.connect(trader2).placeOrder(MARKET_ID, 0, 1, 100, 105, 10)).wait();

    const [bidPrice, bidSize] = await orderBook.getBestBid(MARKET_ID);
    const [askPrice, askSize] = await orderBook.getBestAsk(MARKET_ID);
    expect(bidPrice).to.equal(100);
    expect(bidSize).to.equal(100);
    expect(askPrice).to.equal(105);
    expect(askSize).to.equal(100);

    const spread = await orderBook.getSpread(MARKET_ID);
    expect(spread).to.equal(5);
  });
});