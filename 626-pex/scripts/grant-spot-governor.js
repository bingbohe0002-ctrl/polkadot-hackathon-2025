const hre = require("hardhat");
const { ethers, getNamedAccounts } = hre;
const fs = require("fs");
const path = require("path");

function isValidPrivKey(pk) {
  return typeof pk === "string" && /^0x[0-9a-fA-F]{64}$/.test(pk) && !/^0+$/.test(pk.slice(2));
}

function isValidAddress(addr) {
  try { return !!addr && ethers.isAddress(addr); } catch { return false; }
}

function loadSpotAddress() {
  // 1) 优先使用环境变量覆盖
  const envAddr = process.env.SPOT_MARKET_ADDR;
  if (isValidAddress(envAddr)) return envAddr;
  // 2) 读取聚合快照 deployments/assethub/deployment.json
  const p = path.resolve(__dirname, "../deployments/assethub/deployment.json");
  const raw = fs.readFileSync(p, "utf8");
  const json = JSON.parse(raw);
  const addr = json?.contracts?.SpotMarket;
  if (!isValidAddress(addr)) {
    throw new Error("Cannot resolve SpotMarket address. Set SPOT_MARKET_ADDR or ensure deployments/assethub/deployment.json contains contracts.SpotMarket");
  }
  return addr;
}

async function getSigner() {
  const pk = process.env.PRIVATE_KEY;
  if (isValidPrivKey(pk)) {
    return new ethers.Wallet(pk, ethers.provider);
  }
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  return signer;
}

async function main() {
  const target = process.env.TARGET_ADDR;
  if (!isValidAddress(target)) throw new Error("Missing or invalid TARGET_ADDR env var");

  const signer = await getSigner();
  console.log("Signer:", signer.address);

  const spotAddr = loadSpotAddress();
  console.log("SpotMarket:", spotAddr);

  const sm = await ethers.getContractAt("SpotMarket", spotAddr, signer);
  const GOV = await sm.GOVERNOR_ROLE();
  const ADM = await sm.DEFAULT_ADMIN_ROLE();

  const isAdmin = await sm.hasRole(ADM, signer.address);
  if (!isAdmin) {
    throw new Error(`Signer ${signer.address} is not DEFAULT_ADMIN_ROLE on SpotMarket. Provide PRIVATE_KEY of current admin.`);
  }

  const hasGov = await sm.hasRole(GOV, target);
  if (hasGov) {
    console.log("Target already has GOVERNOR_ROLE:", target);
    return;
  }

  const tx = await sm.grantRole(GOV, target);
  const rec = await tx.wait();
  const nowHas = await sm.hasRole(GOV, target);
  console.log(`Granted GOVERNOR_ROLE to ${target}. tx=${rec.hash} nowHas=${nowHas}`);
}

main().catch((e) => { console.error(e); process.exit(1); });