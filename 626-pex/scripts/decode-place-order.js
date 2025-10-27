const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  const data = process.env.DATA;
  if (!data) throw new Error('Provide DATA=0x...');
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, '../deployments/localhost/SpotOrderBook.json'), 'utf8'));
  const iface = new ethers.Interface(dep.abi);
  const decoded = iface.decodeFunctionData('placeOrder', data);
  console.log('Decoded placeOrder args:', decoded);
}

main().catch((e) => { console.error(e); process.exit(1); });