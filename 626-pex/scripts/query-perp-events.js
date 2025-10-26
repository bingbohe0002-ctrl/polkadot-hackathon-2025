const hre = require('hardhat');
const { ethers, deployments, network } = hre;

async function main() {
  const trader = process.env.TRADER;
  if (!trader || !/^0x[0-9a-fA-F]{40}$/.test(trader)) throw new Error('提供 TRADER=0x...');
  const dep = await deployments.get('PerpMarket');
  const pm = await ethers.getContractAt('PerpMarket', dep.address);
  const latest = await ethers.provider.getBlockNumber();
  const opened = await pm.queryFilter(pm.filters.PositionOpened(trader), 0, latest);
  const closed = await pm.queryFilter(pm.filters.PositionClosed(trader), 0, latest);

  console.log('PerpMarket:', dep.address);
  console.log('Block range: 0..', latest);
  console.log(`Opened events for ${trader}:`, opened.length);
  for (const log of opened) {
    const { args } = log;
    const marketId = Number(args?.marketId ?? args?.[1]);
    const sideNum = Number(args?.side ?? args?.[2]);
    const size = args?.size ?? args?.[3];
    const price = args?.entryPrice ?? args?.[4];
    const leverage = args?.leverage ?? args?.[5];
    const margin = args?.margin ?? args?.[6];
    const side = sideNum === 0 ? 'LONG' : 'SHORT';
    console.log(`- Opened: marketId=${marketId} side=${side} size=${ethers.formatUnits(size, 18)} price=${ethers.formatUnits(price, 18)} lev=${leverage} margin=${ethers.formatUnits(margin, 6)} block=${log.blockNumber}`);
  }

  console.log(`Closed events for ${trader}:`, closed.length);
  for (const log of closed) {
    const { args } = log;
    const marketId = Number(args?.marketId ?? args?.[1]);
    const size = args?.size ?? args?.[2];
    const price = args?.exitPrice ?? args?.[3];
    console.log(`- Closed: marketId=${marketId} size=${ethers.formatUnits(size, 18)} price=${ethers.formatUnits(price, 18)} block=${log.blockNumber}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });