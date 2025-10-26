const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  const trader = process.env.TRADER;
  if (!trader) throw new Error('Provide TRADER=0x...');
  const depPath = path.join(__dirname, '../frontend/src/lib/contracts/deployed.json');
  const json = JSON.parse(fs.readFileSync(depPath, 'utf8'));
  const spotOrderBook = json.contracts?.spotOrderBook;
  const pexAddr = json.tokens?.pex;
  const usdcAddr = json.tokens?.usdc;
  if (!spotOrderBook || !pexAddr || !usdcAddr) throw new Error('Missing addresses in deployed.json');

  const erc20Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address,address) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  const pex = await ethers.getContractAt(erc20Abi, pexAddr);
  const usdc = await ethers.getContractAt(erc20Abi, usdcAddr);

  const [pexBal, pexAllow, pexDec] = await Promise.all([
    pex.balanceOf(trader),
    pex.allowance(trader, spotOrderBook),
    pex.decimals()
  ]);
  const [usdcBal, usdcAllow, usdcDec] = await Promise.all([
    usdc.balanceOf(trader),
    usdc.allowance(trader, spotOrderBook),
    usdc.decimals()
  ]);

  console.log('Trader:', trader);
  console.log('PEX balance:', pexBal.toString(), 'decimals', pexDec);
  console.log('PEX allowance to OrderBook:', pexAllow.toString());
  console.log('USDC balance:', usdcBal.toString(), 'decimals', usdcDec);
  console.log('USDC allowance to OrderBook:', usdcAllow.toString());
}

main().catch((e) => { console.error(e); process.exit(1); });