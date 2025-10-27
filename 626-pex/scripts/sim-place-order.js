const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  const from = process.env.FROM;
  const marketId = BigInt(process.env.MARKET_ID || '2');
  const orderType = BigInt(process.env.ORDER_TYPE || '0'); // 0 LIMIT, 1 MARKET
  const side = BigInt(process.env.SIDE || '1');            // 0 BUY, 1 SELL
  const size = BigInt(process.env.SIZE || (3_900000000000000000n).toString());
  const price = BigInt(process.env.PRICE || (1_000000000000000000n).toString());
  if (!from) throw new Error('Provide FROM');

  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, '../deployments/localhost/SpotOrderBook.json'), 'utf8'));
  const iface = new ethers.Interface(dep.abi);
  const data = iface.encodeFunctionData('placeOrder', [marketId, orderType, side, size, price]);

  console.log('Encoded data length:', data.length);
  console.log('Args:\n', { marketId: marketId.toString(), orderType: orderType.toString(), side: side.toString(), size: size.toString(), price: price.toString() });
  try {
    const res = await ethers.provider.call({ to: dep.address, from, data });
    console.log('eth_call result:', res);
  } catch (e) {
    console.log('eth_call error:', e.message || e);
    if (e.data) {
      console.log('error data:', e.data);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });