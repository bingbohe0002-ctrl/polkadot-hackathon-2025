/*
Batch renounce DEFAULT_ADMIN_ROLE for the old admin across AssetHub deployments
- Iterates known AccessControl contracts and renounces DEFAULT_ADMIN_ROLE if held
- Uses PRIVATE_KEY of the old admin (must be the msg.sender)

Usage:
PRIVATE_KEY=<old_admin_pk> npx hardhat run --network assethub scripts/renounce-admins-assethub.js
*/

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

function loadDeployments() {
  const p = path.resolve(__dirname, "../deployments/assethub/deployment.json");
  const raw = fs.readFileSync(p, "utf8");
  const json = JSON.parse(raw);
  return json.contracts || {};
}

function isValidPrivKey(pk) {
  return typeof pk === "string" && /^0x[0-9a-fA-F]{64}$/.test(pk) && !/^0+$/.test(pk.slice(2));
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
  const nonAC = [];
  if (contractsJson["OrderBook"]) nonAC.push({ name: "OrderBook", address: contractsJson["OrderBook"] });
  if (contractsJson["SpotOrderBook"]) nonAC.push({ name: "SpotOrderBook", address: contractsJson["SpotOrderBook"] });
  return { items, nonAC };
}

async function getDefaultAdminRole(contract) {
  try {
    return await contract.DEFAULT_ADMIN_ROLE();
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

async function renounceRole(contract, role, account) {
  const tx = await contract.renounceRole(role, account);
  const rcpt = await tx.wait();
  return rcpt.transactionHash;
}

async function main() {
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
    const role = await getDefaultAdminRole(contract);
    if (!role) {
      console.log("- DEFAULT_ADMIN_ROLE not found; skipping");
      results.push({ name, address, supported: false });
      continue;
    }

    const adminHas = await hasRole(contract, role, signer.address);
    console.log(`- signer is admin: ${adminHas}`);

    let txHash = null;
    let action = "skip";

    if (adminHas) {
      try {
        txHash = await renounceRole(contract, role, signer.address);
        action = "renounced";
        const nowHas = await hasRole(contract, role, signer.address);
        console.log(`- Renounced DEFAULT_ADMIN_ROLE, now hasRole: ${nowHas}`);
      } catch (e) {
        action = "renounce_failed";
        console.log(`- Renounce failed: ${e.message || e}`);
      }
    } else {
      console.log("- Not admin; no action taken");
    }

    results.push({ name, address, supported: true, adminHas, action, txHash });
  }

  console.log("\nSummary:");
  for (const r of results) {
    console.log(
      `- ${r.name} @ ${r.address} | supported=${r.supported} | adminHas=${r.adminHas} | action=${r.action} | tx=${r.txHash || "-"}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});