/*
Batch check and grant DEFAULT_ADMIN_ROLE for AssetHub deployments
- Checks each deployed contract for AccessControl DEFAULT_ADMIN_ROLE
- If 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 is an admin, grants DEFAULT_ADMIN_ROLE to TARGET_ADDR
- Skips contracts that don't implement AccessControl/DEFAULT_ADMIN_ROLE

Usage:
PRIVATE_KEY=<admin_pk> TARGET_ADDR=<target_address> npx hardhat run --network assethub pex/scripts/grant-admins-assethub.js
*/

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const ADMIN_CANDIDATE = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // insecure default admin to check

function loadDeployments() {
  const p = path.resolve(__dirname, "../deployments/assethub/deployment.json");
  const raw = fs.readFileSync(p, "utf8");
  const json = JSON.parse(raw);
  return json.contracts || {};
}

function isValidPrivKey(pk) {
  return typeof pk === "string" && /^0x[0-9a-fA-F]{64}$/.test(pk) && !/^0x0+$/.test(pk.slice(2));
}

async function getSigner() {
  const pk = process.env.PRIVATE_KEY;
  if (!isValidPrivKey(pk)) {
    throw new Error("Invalid or missing PRIVATE_KEY. Provide a 64-hex EVM private key.");
  }
  return new ethers.Wallet(pk, ethers.provider);
}

function pickContracts(contractsJson) {
  // Only those known to implement AccessControl DEFAULT_ADMIN_ROLE
  const order = [
    "OracleAdapter",
    "MarginVault",
    "PerpMarket",
    "SpotMarket",
    "TokenListingGovernor",
  ];
  const items = [];
  for (const name of order) {
    const addr = contractsJson[name];
    if (addr) items.push({ name, address: addr });
  }
  // Informational: others present but not AccessControl
  const nonAC = [];
  if (contractsJson["OrderBook"]) nonAC.push({ name: "OrderBook", address: contractsJson["OrderBook"] });
  if (contractsJson["SpotOrderBook"]) nonAC.push({ name: "SpotOrderBook", address: contractsJson["SpotOrderBook"] });
  return { items, nonAC };
}

async function supportsDefaultAdmin(contract) {
  try {
    const role = await contract.DEFAULT_ADMIN_ROLE();
    return role;
  } catch (e) {
    return null;
  }
}

async function hasRole(contract, role, address) {
  try {
    return await contract.hasRole(role, address);
  } catch (e) {
    return false;
  }
}

async function grantRole(contract, role, target) {
  const tx = await contract.grantRole(role, target);
  const rcpt = await tx.wait();
  return rcpt.transactionHash;
}

async function main() {
  const target = process.env.TARGET_ADDR;
  if (!target || !ethers.isAddress(target)) {
    throw new Error("Missing or invalid TARGET_ADDR environment variable");
  }

  const signer = await getSigner();
  console.log("Signer:", signer.address);

  const contractsJson = loadDeployments();
  const { items, nonAC } = pickContracts(contractsJson);

  if (nonAC.length) {
    console.log("Skipping non-AccessControl contracts:");
    for (const c of nonAC) {
      console.log(`- ${c.name} (${c.address}) [Ownable/No DEFAULT_ADMIN_ROLE]`);
    }
  }

  const results = [];
  for (const { name, address } of items) {
    console.log(`\nChecking ${name} @ ${address}`);
    const contract = await ethers.getContractAt(name, address, signer);
    const role = await supportsDefaultAdmin(contract);
    if (!role) {
      console.log("- DEFAULT_ADMIN_ROLE not found; skipping");
      results.push({ name, address, supported: false });
      continue;
    }

    const adminHas = await hasRole(contract, role, ADMIN_CANDIDATE);
    const targetHas = await hasRole(contract, role, target);

    console.log(`- ADMIN_CANDIDATE is admin: ${adminHas}`);
    console.log(`- TARGET_ADDR is admin: ${targetHas}`);

    let txHash = null;
    let action = "skip";

    if (adminHas && !targetHas) {
      try {
        txHash = await grantRole(contract, role, target);
        action = "granted";
        // Re-check
        const targetNow = await hasRole(contract, role, target);
        console.log(`- Granted DEFAULT_ADMIN_ROLE -> ${target}, now hasRole: ${targetNow}`);
      } catch (e) {
        action = "grant_failed";
        console.log(`- Grant failed: ${e.message || e}`);
      }
    } else if (targetHas) {
      action = "already_admin";
      console.log("- Target already has DEFAULT_ADMIN_ROLE; no action taken");
    } else {
      console.log("- ADMIN_CANDIDATE is not admin; no action taken");
    }

    results.push({ name, address, supported: true, adminHas, targetHas, action, txHash });
  }

  console.log("\nSummary:");
  for (const r of results) {
    console.log(
      `- ${r.name} @ ${r.address} | supported=${r.supported} | adminHas=${r.adminHas} | targetHas=${r.targetHas} | action=${r.action} | tx=${r.txHash || "-"}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});