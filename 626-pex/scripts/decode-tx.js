const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

function loadABI(name) {
  const p = path.resolve(__dirname, '..', 'deployments', 'localhost', name + '.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return j.abi || j.ABI || j; // tolerate different shapes
}

async function main() {
  const hash = process.argv[2];
  if (!hash) {
    console.error('Usage: node scripts/decode-tx.js <txHash>');
    process.exit(1);
  }

  const pmABI = loadABI('PerpMarket');
  const obABI = loadABI('OrderBook');
  const ifacePM = new ethers.Interface(pmABI);
  const ifaceOB = new ethers.Interface(obABI);

  const rpc = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
  const provider = new ethers.JsonRpcProvider(rpc);

  const receipt = await provider.getTransactionReceipt(hash);
  if (!receipt) {
    console.error('No receipt found for', hash);
    process.exit(1);
  }

  const decoded = [];
  for (const log of receipt.logs) {
    let parsed = null;
    try { parsed = ifacePM.parseLog(log); } catch (_) {}
    if (!parsed) { try { parsed = ifaceOB.parseLog(log); } catch (_) {} }
    if (parsed) {
      const args = {};
      parsed.fragment.inputs.forEach((inp, idx) => {
        const v = parsed.args[idx];
        args[inp.name || `arg${idx}`] = typeof v === 'bigint' ? v.toString() : v;
      });
      decoded.push({ address: log.address, name: parsed.name, args });
    }
  }

  console.log(JSON.stringify(decoded, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });