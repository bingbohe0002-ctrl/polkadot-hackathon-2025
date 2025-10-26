const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  const trader = process.env.TRADER;
  const amountStr = process.env.AMOUNT || '5000000'; // default 5,000,000 USDC
  if (!trader || !/^0x[0-9a-fA-F]{40}$/.test(trader)) throw new Error('提供 TRADER=0x...');

  const depPath = path.join(__dirname, '../frontend/src/lib/contracts/deployed.json');
  const json = JSON.parse(fs.readFileSync(depPath, 'utf8'));
  const spotOrderBook = json.contracts?.spotOrderBook;
  const usdcAddr = json.tokens?.usdc;
  if (!spotOrderBook || !usdcAddr) throw new Error('deployed.json 缺少地址');

  const signer = await ethers.getSigner(trader);
  const usdc = await ethers.getContractAt('MockERC20', usdcAddr, signer);
  const decimals = await usdc.decimals();
  const amount = ethers.parseUnits(amountStr, decimals);

  console.log('Approving USDC...');
  console.log('Trader:', trader);
  console.log('USDC:', usdcAddr);
  console.log('OrderBook:', spotOrderBook);
  console.log('Amount:', amountStr, 'USDC');

  const tx = await usdc.approve(spotOrderBook, amount);
  console.log('Approve tx:', tx.hash);
  await tx.wait();
  console.log('USDC allowance set.');
}

main().catch((e) => { console.error(e); process.exit(1); });