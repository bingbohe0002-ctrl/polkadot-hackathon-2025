const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { execute, log } = deployments;
  const { admin } = await getNamedAccounts();
  log("[add_markets] Adding sample markets to PerpMarket...");

  const markets = [
    {
      symbol: "BTC-USD",
      baseAsset: "BTC",
      quoteAsset: "USD",
      maxLeverage: 100,
      minOrderSize: (ethers.utils?.parseEther || ethers.parseEther)("0.001"),
      tickSize: (ethers.utils?.parseEther || ethers.parseEther)("1"),
    },
    {
      symbol: "ETH-USD",
      baseAsset: "ETH",
      quoteAsset: "USD",
      maxLeverage: 50,
      minOrderSize: (ethers.utils?.parseEther || ethers.parseEther)("0.01"),
      tickSize: (ethers.utils?.parseEther || ethers.parseEther)("0.5"),
    },
  ];

  for (const m of markets) {
    await execute(
      "PerpMarket",
      { from: admin, log: true },
      "addMarket",
      m.symbol,
      m.baseAsset,
      m.quoteAsset,
      m.maxLeverage,
      m.minOrderSize,
      m.tickSize
    );
    log(`[add_markets] Added ${m.symbol}`);
  }
};

module.exports.tags = ["add_markets"];
module.exports.dependencies = ["core_step2"];