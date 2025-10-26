const hre = require('hardhat');
const { ethers } = hre;
const path = require('path');

async function main() {
  const rpc = (process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545').trim();
  const provider = new ethers.JsonRpcProvider(rpc);
  const deploySpot = require(path.join(__dirname, '..', 'deployments', 'localhost', 'SpotMarket.json'));
  const spot = new ethers.Contract(deploySpot.address, deploySpot.abi, provider);

  const pk = (process.env.PRIVATE_KEY || '').trim();
  if (!pk) throw new Error('Missing PRIVATE_KEY');
  const wallet = new ethers.Wallet(pk, provider);
  const spotGov = spot.connect(wallet);

  let nonce = await provider.getTransactionCount(wallet.address, 'latest');
  const all = await spotGov.getAllMarkets();
  const targets = all.filter(m => !m.isActive && (m.symbol === 'PAS/USDC' || m.symbol === 'USDC/PAS'));
  if (targets.length === 0) {
    console.log('No inactive PAS/USDC or USDC/PAS markets found.');
    return;
  }
  for (const m of targets) {
    console.log(`[activateMarket] id=${m.id} (${m.symbol})`);
    const tx = await spotGov.activateMarket(m.id, { gasLimit: 2_000_000, nonce });
    const rec = await tx.wait();
    console.log('  tx:', rec?.hash);
    nonce++;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});