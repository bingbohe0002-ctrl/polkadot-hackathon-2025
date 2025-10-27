const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  const trader = process.env.TRADER;
  const amountStr = process.env.AMOUNT || '1000000'; // default 1,000,000 PEX
  if (!trader || !/^0x[0-9a-fA-F]{40}$/.test(trader)) throw new Error('提供 TRADER=0x...');

  const depPath = path.join(__dirname, '../frontend/src/lib/contracts/deployed.json');
  const json = JSON.parse(fs.readFileSync(depPath, 'utf8'));
  const spotOrderBook = json.contracts?.spotOrderBook;
  const pexAddr = json.tokens?.pex;
  if (!spotOrderBook || !pexAddr) throw new Error('deployed.json 缺少地址');

  const signer = await ethers.getSigner(trader);
  const pex = await ethers.getContractAt('MockERC20', pexAddr, signer);
  const decimals = await pex.decimals();
  const amount = ethers.parseUnits(amountStr, decimals);

  console.log('Approving PEX...');
  console.log('Trader:', trader);
  console.log('PEX:', pexAddr);
  console.log('OrderBook:', spotOrderBook);
  console.log('Amount:', amountStr, 'PEX');

  const tx = await pex.approve(spotOrderBook, amount);
  console.log('Approve tx:', tx.hash);
  await tx.wait();
  console.log('PEX allowance set.');
}

main().catch((e) => { console.error(e); process.exit(1); });