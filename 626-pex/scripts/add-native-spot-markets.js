const hre = require("hardhat");
const { ethers, deployments, getNamedAccounts } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const { admin } = await getNamedAccounts();
  const ZERO = ethers.ZeroAddress;

  const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
  const json = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const usdcAddr = json.tokens?.usdc;
  const wethAddr = json.tokens?.weth;
  if (!usdcAddr) throw new Error("Missing USDC address in deployed.json");
  if (!wethAddr) throw new Error("Missing WETH address in deployed.json");

  const spotDeployment = await deployments.get("SpotMarket");
  const spotMarketAddr = spotDeployment.address;
  console.log(`Using SpotMarket at ${spotMarketAddr}`);
  console.log(`Admin signer: ${admin}`);

  // Add markets via hardhat-deploy helper to ensure proper from account
  await deployments.execute(
    "SpotMarket",
    { from: admin, log: true },
    "addMarket",
    ZERO,
    usdcAddr,
    "PAS/USDC",
    true,
    false
  );
  console.log("Added PAS/USDC (Native/ERC20)");

  await deployments.execute(
    "SpotMarket",
    { from: admin, log: true },
    "addMarket",
    wethAddr,
    ZERO,
    "WETH/PEX",
    false,
    true
  );
  console.log("Added WETH/PEX (ERC20/Native)");

  // Activate newly added markets
  const sm = await ethers.getContractAt("SpotMarket", spotMarketAddr);
  const markets = await sm.getAllMarkets();
  const pexUsdc = markets.find((m) => m.symbol === "PAS/USDC");
  const wethPex = markets.find((m) => m.symbol === "WETH/PEX");
  if (pexUsdc && pexUsdc.id) {
    await deployments.execute("SpotMarket", { from: admin, log: true }, "activateMarket", Number(pexUsdc.id));
    console.log(`Activated PAS/USDC id=${Number(pexUsdc.id)}`);
  }
  if (wethPex && wethPex.id) {
    await deployments.execute("SpotMarket", { from: admin, log: true }, "activateMarket", Number(wethPex.id));
    console.log(`Activated WETH/PEX id=${Number(wethPex.id)}`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});