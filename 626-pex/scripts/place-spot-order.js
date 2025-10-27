const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

function parseEnv(name, def) {
  const v = process.env[name];
  return v === undefined ? def : v;
}

async function main() {
  const trader = process.env.TRADER;
  if (!trader || !/^0x[0-9a-fA-F]{40}$/.test(trader)) throw new Error('提供 TRADER=0x...');

  const marketId = BigInt(parseEnv('MARKET_ID', '2'));
  const typeStr = parseEnv('TYPE', 'LIMIT');
  const sideStr = parseEnv('SIDE', 'SELL');
  const sizeStr = parseEnv('SIZE', '1001');
  const priceStr = parseEnv('PRICE', '2000');

  const orderType = typeStr.toUpperCase() === 'MARKET' ? 1 : 0;
  const side = sideStr.toUpperCase() === 'BUY' ? 0 : 1;

  const depPath = path.join(__dirname, '../frontend/src/lib/contracts/deployed.json');
  const json = JSON.parse(fs.readFileSync(depPath, 'utf8'));
  const spotOrderBook = json.contracts?.spotOrderBook;
  if (!spotOrderBook) throw new Error('deployed.json 缺少 spotOrderBook 地址');

  const signer = await ethers.getSigner(trader);
  const sob = await ethers.getContractAt('SpotOrderBook', spotOrderBook, signer);

  const size = ethers.parseUnits(sizeStr, 18); // base decimals assumed 18
  const price = ethers.parseUnits(priceStr, 18); // price decimals 18

  console.log('Placing order...');
  console.log('Trader:', trader);
  console.log('Market:', marketId.toString());
  console.log('Type:', orderType === 0 ? 'LIMIT' : 'MARKET');
  console.log('Side:', side === 0 ? 'BUY' : 'SELL');
  console.log('Size:', sizeStr);
  console.log('Price:', priceStr);

  const tx = await sob.placeOrder(marketId, orderType, side, size, price);
  console.log('Order tx:', tx.hash);
  const rcpt = await tx.wait();
  console.log('Order placed in block', rcpt.blockNumber);
}

main().catch((e) => { console.error(e); process.exit(1); });