const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

function measure(artifactPath, args) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const iface = new ethers.Interface(artifact.abi);
  const bytecode = artifact.bytecode?.object || artifact.bytecode;
  if (!bytecode) throw new Error('bytecode not found');
  const deployData = ethers.concat([bytecode, iface.encodeDeploy(args || [])]);
  console.log('artifact:', artifactPath);
  console.log('bytecode hex length:', String(bytecode).length);
  console.log('deployData hex length:', String(deployData).length);
  console.log('startsWith0x:', String(deployData).startsWith('0x'));
}

const art = process.env.ARTIFACT_PATH || path.join(__dirname, '../artifacts/contracts/src/mocks/MockERC20.sol/MockERC20.json');
const name = process.env.NAME || 'USD Coin';
const symbol = process.env.SYMBOL || 'USDC';
const decimals = Number(process.env.DECIMALS || 6);

measure(art, [name, symbol, decimals]);