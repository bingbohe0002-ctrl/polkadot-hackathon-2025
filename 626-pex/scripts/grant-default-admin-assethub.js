const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

function loadAssetHubDeployment() {
  const p = path.join(__dirname, "../deployments/assethub/deployment.json");
  if (!fs.existsSync(p)) {
    throw new Error("Missing deployments/assethub/deployment.json");
  }
  const json = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!json.contracts || !json.contracts.SpotMarket) {
    throw new Error("AssetHub snapshot missing contracts.SpotMarket");
  }
  return json;
}

async function main() {
  const target = (process.env.TARGET_ADDR || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(target)) {
    throw new Error("Provide TARGET_ADDR=0x<address>");
  }

  const snap = loadAssetHubDeployment();
  const spotAddr = snap.contracts.SpotMarket;
  console.log("AssetHub SpotMarket:", spotAddr);
  console.log("Target to grant DEFAULT_ADMIN_ROLE:", target);

  const [signer] = await ethers.getSigners();
  const net = await signer.provider.getNetwork();
  console.log("Signer:", signer.address, "chainId:", net.chainId.toString());

  const sm = await ethers.getContractAt("SpotMarket", spotAddr, signer);
  const ADM = await sm.DEFAULT_ADMIN_ROLE();
  console.log("DEFAULT_ADMIN_ROLE:", ADM);

  const isAdmin = await sm.hasRole(ADM, signer.address).catch(() => false);
  if (!isAdmin) {
    throw new Error(`Signer ${signer.address} is not DEFAULT_ADMIN_ROLE on SpotMarket`);
  }

  const already = await sm.hasRole(ADM, target).catch(() => false);
  if (already) {
    console.log("Target already has DEFAULT_ADMIN_ROLE:", target);
    return;
  }

  console.log("Granting DEFAULT_ADMIN_ROLE...");
  const tx = await sm.grantRole(ADM, target);
  const rec = await tx.wait();
  console.log(`Granted DEFAULT_ADMIN_ROLE to ${target}. tx=${rec?.hash}`);

  const confirm = await sm.hasRole(ADM, target);
  console.log("Confirm target is admin:", confirm);
}

main().catch((e) => { console.error(e); process.exit(1); });