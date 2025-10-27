const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  console.log(`[add-native-markets-fixed] network=${network}`);

  const deployedPath = path.join(__dirname, '..', 'frontend', 'src', 'lib', 'contracts', 'deployed.json');
  const deployed = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
  const spotAddr = deployed.contracts?.spotMarket;
  const usdcAddr = deployed.tokens?.usdc;
  if (!spotAddr || !usdcAddr) throw new Error('Missing spotMarket or usdc in deployed.json');

  const provider = new ethers.JsonRpcProvider((process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545').trim());
  const pk = (process.env.FAUCET_PRIVATE_KEY || process.env.PRIVATE_KEY || '').trim();
  if (!pk) throw new Error('Missing FAUCET_PRIVATE_KEY/PRIVATE_KEY in env');
  const adminWallet = new ethers.Wallet(pk, provider);
  console.log(`[signer] ${adminWallet.address}`);

  const spotMarket = new ethers.Contract(spotAddr, (require('../deployments/localhost/SpotMarket.json')).abi, adminWallet);
  const iface = new ethers.Interface((require('../deployments/localhost/SpotMarket.json')).abi);
  console.log('selector addMarket:', iface.getFunction('addMarket').selector);
  console.log('selector activateMarket:', iface.getFunction('activateMarket').selector);

  const Zero = ethers.ZeroAddress;

  const markets = [
    { base: Zero, quote: usdcAddr, symbol: 'PAS/USDC', baseIsNative: true, quoteIsNative: false },
    { base: (require('../deployments/localhost/WETH.json')).address, quote: Zero, symbol: 'WETH/PEX', baseIsNative: false, quoteIsNative: true },
  ];

  for (const m of markets) {
    console.log(`[addMarket] ${m.symbol}`);
    const tx = await spotMarket.addMarket(m.base, m.quote, m.symbol, m.baseIsNative, m.quoteIsNative, { gasLimit: 5_000_000 });
    const rec = await tx.wait();
    console.log('  tx:', rec?.hash);
  }

  // list markets and activate if not active
  const all = await spotMarket.getAllMarkets();
  console.log(`[markets] count=${all.length}`);
  for (const mk of all) {
    if (!mk.isActive) {
      console.log(`[activateMarket] id=${mk.id} (${mk.symbol})`);
      const tx = await spotMarket.activateMarket(mk.id, { gasLimit: 2_000_000 });
      const rec = await tx.wait();
      console.log('  tx:', rec?.hash);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});