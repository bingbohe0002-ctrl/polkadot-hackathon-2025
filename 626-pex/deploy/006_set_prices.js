module.exports = async function ({ deployments, getNamedAccounts, ethers }) {
  const { execute, read, log } = deployments;
  const { admin } = await getNamedAccounts();

  // Support ethers v5 and v6 helpers
  const parseEther = ethers.parseEther || ethers.utils.parseEther;
  const toBytes32 = ethers.encodeBytes32String || ethers.utils.formatBytes32String;

  log("Starting set_prices script...");

  // Read markets to confirm they exist
  const allMarkets = await read("PerpMarket", "getAllMarkets");
  log(`Found ${allMarkets.length} markets`);
  if (allMarkets.length === 0) {
    log("No markets found. Ensure 'add_markets' has run before 'set_prices'.");
  }

  // Example prices (1e18 precision expected by OracleAdapter)
  const PRICES = {
    "BTC-USD": parseEther("63000"),
    "ETH-USD": parseEther("2500"),
  };

  // Set prices for known symbols
  for (const symbol of Object.keys(PRICES)) {
    const symbolKey = toBytes32(symbol);
    const price = PRICES[symbol];

    log(`Setting price for ${symbol} -> ${price.toString()}`);
    await execute(
      "OracleAdapter",
      { from: admin, log: true },
      "setPrice",
      symbolKey,
      price
    );

    const readBack = await read("OracleAdapter", "getPrice", symbolKey);
    log(`Verified price for ${symbol}: ${readBack.toString()}`);
  }

  // Optionally display per-market symbol and current price
  for (const m of allMarkets) {
    try {
      const sym = m.symbol;
      const symKey = toBytes32(sym);
      const p = await read("OracleAdapter", "getPrice", symKey);
      log(`Market ${m.id} (${sym}) current price: ${p.toString()}`);
    } catch (e) {
      log(`Unable to read price for market id ${m.id}`);
    }
  }
};

module.exports.tags = ["set_prices"];
module.exports.dependencies = ["core_step2", "add_markets"];