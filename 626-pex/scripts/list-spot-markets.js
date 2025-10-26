const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
  const json = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const spotMarketAddr = json.contracts?.spotMarket;
  if (!spotMarketAddr) throw new Error("Missing spotMarket address in deployed.json");
  const sm = await ethers.getContractAt("SpotMarket", spotMarketAddr);
  const markets = await sm.getAllMarkets();
  console.log("Spot Markets:");
  markets.forEach((m) => {
    console.log(`- id=${m.id} symbol=${m.symbol} active=${m.isActive} base=${m.baseToken} quote=${m.quoteToken} baseDec=${m.baseDecimals} quoteDec=${m.quoteDecimals}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});