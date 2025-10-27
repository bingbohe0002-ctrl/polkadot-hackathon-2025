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
  const usdcAddr = snap.tokens?.USDC;
  if (!usdcAddr) throw new Error("Missing USDC address in snapshot.");

  const erc20 = await ethers.getContractAt("IERC20Metadata", usdcAddr);
  console.log("USDC:", usdcAddr);
  try {
    const decimals = await erc20.decimals();
    const name = await erc20.name();
    const symbol = await erc20.symbol();
    console.log({ name, symbol, decimals });
  } catch (e) {
    console.log("Reading ERC20 metadata failed:", e.message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });