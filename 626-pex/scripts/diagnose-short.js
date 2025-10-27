const hre = require('hardhat');
const { ethers, deployments, network } = hre;

function fmt18(v) {
  try { return Number(v) / 1e18; } catch { return v.toString(); }
}
function fmt6(v) {
  try { return Number(v) / 1e6; } catch { return v.toString(); }
}

async function main() {
  const chainId = (network.config.chainId || 31337).toString();
  const trader = process.argv[2] || process.env.TRADER;
  if (!trader || !/^0x[0-9a-fA-F]{40}$/.test(trader)) {
    throw new Error('请提供有效的交易地址，例如：npx hardhat run scripts/diagnose-short.js --network localhost 0xabc...');
  }
  console.log(`[Diagnose Short] chainId=${chainId}`);
  console.log(`[Diagnose Short] trader=${trader}`);

  const orderBookDep = await deployments.get('OrderBook');
  const perpDep = await deployments.get('PerpMarket');
  const vaultDep = await deployments.get('MarginVault');

  const orderBook = await ethers.getContractAt('OrderBook', orderBookDep.address);
  const perp = await ethers.getContractAt('PerpMarket', perpDep.address);
  const vault = await ethers.getContractAt('MarginVault', vaultDep.address);

  const me = await perp.matchEngine();
  console.log(`[PerpMarket] matchEngine=${me} orderBook=${orderBookDep.address} ok=${me.toLowerCase()===orderBookDep.address.toLowerCase()}`);
  const fromBlock = 0;
  const toBlock = 'latest';
  const matchedLogs = await orderBook.queryFilter(orderBook.filters.OrderMatched(), fromBlock, toBlock);
  const sellerLogs = matchedLogs.filter(l => (l.args?.seller || l.args?.[6])?.toLowerCase() === trader.toLowerCase());
  console.log(`[OrderMatched] total=${matchedLogs.length} sellerMatchesForTrader=${sellerLogs.length}`);

  // Global position events for trader
  const posAllOpen = await perp.queryFilter(perp.filters.PositionOpened(trader), fromBlock, toBlock);
  console.log(`[Perp PositionOpened] totalForTrader(all markets)=${posAllOpen.length}`);
  const posAllClose = await perp.queryFilter(perp.filters.PositionClosed(trader), fromBlock, toBlock);
  console.log(`[Perp PositionClosed] totalForTrader(all markets)=${posAllClose.length}`);
  if (posAllOpen.length > 0) {
    for (const pl of posAllOpen.slice(0, 5)) {
      const { marketId, side, size, entryPrice, leverage, margin } = pl.args;
      console.log(`  Opened: marketId=${marketId} side=${side} size=${size} price=${entryPrice} lev=${leverage} margin=${margin} tx=${pl.transactionHash}`);
    }
    if (posAllOpen.length > 5) {
      console.log(`  ... (${posAllOpen.length - 5} more)`);
    }
  }
  if (sellerLogs.length === 0) {
    console.log('未找到该地址作为卖方的撮合事件。请确认该地址是否真的下了卖单。');
    return;
  }

  // Get vault available
  const info = await vault.getAccountInfo(trader);
  const available = info[3];
  console.log(`[MarginVault] availableBalance=${available} (${fmt6(available)} USDC)`);

  for (const log of sellerLogs) {
    const { buyOrderId, sellOrderId, marketId, matchedSize, matchPrice, buyer, seller } = log.args;
    console.log(`\n--- Match tx=${log.transactionHash} block=${log.blockNumber}`);
    console.log(`marketId=${marketId} buyer=${buyer} seller=${seller}`);
    console.log(`matchedSize(raw)=${matchedSize} matchedSize(approx)=${fmt18(matchedSize)}`);
    console.log(`matchPrice(raw)=${matchPrice}`);
    console.log(`matchPrice(approx)=${fmt18(matchPrice)}`);

    // Read sell order to get leverage
    const sellOrder = await orderBook.getOrder(sellOrderId);
    const lev = sellOrder.leverage;
    console.log(`sellOrderId=${sellOrderId} leverage=${lev}`);

    // Read market config to check leverage bounds
    const market = await perp.getMarket(marketId);
    const maxLev = market.maxLeverage ?? market[4];
    const minOrderSize = market.minOrderSize ?? market[5];
    console.log(`[Market] maxLeverage=${maxLev} minOrderSize=${minOrderSize} (${fmt18(minOrderSize)} size)`);

    // Compute required margin per PerpMarket rule: reqUsdc = (size/leverage)/1e12; if 0 then 1
    const size = BigInt(matchedSize.toString());
    const leverage = BigInt(lev.toString());
    let reqUsdc = size / leverage / BigInt(1_000_000_000_000);
    if (reqUsdc === BigInt(0)) reqUsdc = BigInt(1);
    console.log(`[Required Margin] reqUsdc(raw)=${reqUsdc} (${fmt6(reqUsdc)} USDC)`);
    const ok = available >= reqUsdc;
    console.log(`[Check] available >= required ? ${ok}`);

    // Check if PositionOpened SHORT exists in same block for this trader/market
    const posLogs = await perp.queryFilter(perp.filters.PositionOpened(trader, marketId), log.blockNumber, log.blockNumber);
    const shorts = posLogs.filter(pl => (pl.args?.side || pl.args?.[2]) === 1); // PositionSide.SHORT = 1
    console.log(`[Perp PositionOpened in block] totalForTrader+Market=${posLogs.length} shorts=${shorts.length}`);
    for (const pl of shorts) {
      const { side, size: pSize, entryPrice, leverage: pLev, margin } = pl.args;
      console.log(`  SHORT opened: size(raw)=${pSize} size(approx)=${fmt18(pSize)} lev=${pLev} margin=${margin} (${fmt6(margin)} USDC) tx=${pl.transactionHash}`);
    }

    // Query MarginAllocated events near this block
    const allocFrom = Math.max(0, log.blockNumber - 10);
    const allocTo = log.blockNumber + 10;
    const allocLogs = await vault.queryFilter(vault.filters.MarginAllocated(trader, marketId), allocFrom, allocTo);
    console.log(`[MarginAllocated] around block ${log.blockNumber}: count=${allocLogs.length}`);
    for (const a of allocLogs) {
      const { amount, mode } = a.args;
      console.log(`  Alloc: amount=${amount} (${fmt6(amount)} USDC) mode=${mode} tx=${a.transactionHash} block=${a.blockNumber}`);
    }

    if (shorts.length === 0 && allocLogs.length === 0 && ok) {
      console.log('=> 可能原因：openPositionFor 调用被拒（例如杠杆越界或 matchEngine 权限），建议检查 sellOrder.leverage 与 [Market]maxLeverage，以及 PerpMarket.setMatchEngine wiring。');
    }
    if (shorts.length === 0 && !ok) {
      console.log('=> 结论：该卖方成交未开空，原因是保证金不足（根据 PerpMarket 要求的初始保证金计算）。');
    } else if (shorts.length === 0) {
      console.log('=> 结论：本区块无 SHORT PositionOpened 事件。若保证金充足，则可能为其他检查失败。');
    } else {
      console.log('=> 结论：已找到 SHORT PositionOpened 事件。前端显示问题可能源于事件订阅或过滤。');
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });