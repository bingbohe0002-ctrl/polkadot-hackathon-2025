const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

function loadAbi() {
  const p = path.join(__dirname, '..', 'deployments', 'localhost', 'SpotMarket.json');
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  return json.abi;
}

function sigHash(iface, sig) {
  try {
    return iface.getFunction(sig).selector; // ethers v6
  } catch (e) {
    try {
      return iface.getSighash(sig); // ethers v5 fallback
    } catch (_) {
      return null;
    }
  }
}

async function main() {
  const abi = loadAbi();
  const iface = new ethers.Interface(abi);
  const sigs = [
    'addMarket(address,address,string,bool,bool)',
    'addMarket(address,address,string)',
    'addMarket(address,address,string,bool)',
    'activateMarket(uint256,bool)',
  ];
  console.log('Function selectors:');
  for (const s of sigs) {
    const h = sigHash(iface, s);
    console.log(`${s} -> ${h || 'N/A'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});