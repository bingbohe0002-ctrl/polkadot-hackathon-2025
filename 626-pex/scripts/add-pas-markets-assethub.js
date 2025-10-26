const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

function loadAssetHubDeployment() {
  const p1 = path.join(__dirname, "../deployments/assethub/deployment.json");
  if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, "utf8"));
  const p2 = path.join(__dirname, "../frontend/src/lib/contracts/deployed-assethub.json");
  if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, "utf8"));
  throw new Error("Missing AssetHub deployment snapshot.");
}

async function main() {
  const [signer] = await ethers.getSigners();
  const net = await signer.provider.getNetwork();
  console.log("Signer:", signer.address, "chainId:", net.chainId.toString());

  const snap = loadAssetHubDeployment();
  const spotAddr = snap.contracts?.SpotMarket;
  const usdcAddr = snap.tokens?.USDC;
  if (!spotAddr || !usdcAddr) throw new Error("Missing SpotMarket or USDC in AssetHub snapshot.");

  const spot = await ethers.getContractAt("SpotMarket", spotAddr, signer);

  // Ensure signer has GOVERNOR_ROLE or is admin
  const GOV = await spot.GOVERNOR_ROLE();
  const hasGov = await spot.hasRole(GOV, signer.address).catch(() => false);
  console.log("has GOVERNOR_ROLE:", hasGov);
  if (!hasGov) {
    const DEFAULT_ADMIN_ROLE = await spot.DEFAULT_ADMIN_ROLE();
    const isAdmin = await spot.hasRole(DEFAULT_ADMIN_ROLE, signer.address).catch(() => false);
    console.log("is ADMIN:", isAdmin);
    if (!isAdmin) {
      throw new Error("Signer lacks permission: need GOVERNOR_ROLE or DEFAULT_ADMIN_ROLE");
    }
  }

  const Zero = ethers.ZeroAddress;
  const targets = [
    { base: Zero, quote: usdcAddr, symbol: "PAS/USDC", baseIsNative: true, quoteIsNative: false },
    { base: usdcAddr, quote: Zero, symbol: "USDC/PAS", baseIsNative: false, quoteIsNative: true },
  ];

  const before = await spot.getAllMarkets();
  const existing = new Set(before.map((m) => m.symbol));

  for (const t of targets) {
    if (existing.has(t.symbol)) {
      console.log("[addMarket] skip existing:", t.symbol);
      continue;
    }
    console.log("[addMarket]", t.symbol);
    try {
      const estimated = await spot.addMarket.estimateGas(t.base, t.quote, t.symbol, t.baseIsNative, t.quoteIsNative);
      console.log("  estimated gas:", estimated.toString());
    } catch (e) {
      console.log("  gas estimation failed:", e.message);
    }
    const tx = await spot.addMarket(t.base, t.quote, t.symbol, t.baseIsNative, t.quoteIsNative);
    const rec = await tx.wait();
    console.log("  tx:", rec?.hash);
  }

  const all = await spot.getAllMarkets();
  for (const m of all) {
    if (!m.isActive && (m.symbol === "PAS/USDC" || m.symbol === "USDC/PAS")) {
      console.log(`[activateMarket] id=${m.id} (${m.symbol})`);
      const tx = await spot.activateMarket(m.id);
      const rec = await tx.wait();
      console.log("  tx:", rec?.hash);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});