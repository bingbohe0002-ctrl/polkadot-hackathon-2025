const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  const rpc = (process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545').trim();
  const provider = new ethers.JsonRpcProvider(rpc);

  const deploySpot = require(path.join(__dirname, '..', 'deployments', 'localhost', 'SpotMarket.json'));
  const spotAddr = deploySpot.address;
  const spotAbi = deploySpot.abi;
  const spotMarket = new ethers.Contract(spotAddr, spotAbi, provider);

  // Load USDC from frontend deployed.json
  const deployedPath = path.join(__dirname, '..', 'frontend', 'src', 'lib', 'contracts', 'deployed.json');
  const deployed = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
  const usdcAddr = deployed.tokens?.usdc;
  if (!usdcAddr || usdcAddr === ethers.ZeroAddress) throw new Error('USDC address missing in deployed.json');

  const deployerPk = (process.env.PRIVATE_KEY || '').trim();
  if (!deployerPk) throw new Error('Please set PRIVATE_KEY for default admin');
  const deployer = new ethers.Wallet(deployerPk, provider);
  const spotAsAdmin = spotMarket.connect(deployer);

  // Ensure deployer has GOVERNOR_ROLE
  const GOVERNOR_ROLE = await spotAsAdmin.GOVERNOR_ROLE();
  const hasGov = await spotAsAdmin.hasRole(GOVERNOR_ROLE, deployer.address).catch(() => false);
  if (!hasGov) {
    console.log('[role] grant GOVERNOR_ROLE to deployer');
    const tx = await spotAsAdmin.grantRole(GOVERNOR_ROLE, deployer.address);
    await tx.wait();
    console.log('  granted');
  } else {
    console.log('[role] deployer already has GOVERNOR_ROLE');
  }

  const Zero = ethers.ZeroAddress;
  const targets = [
    { base: Zero, quote: usdcAddr, symbol: 'PAS/USDC', baseIsNative: true, quoteIsNative: false },
    { base: usdcAddr, quote: Zero, symbol: 'USDC/PAS', baseIsNative: false, quoteIsNative: true },
  ];

  // Read existing markets to avoid duplicates
  const before = await spotAsAdmin.getAllMarkets();
  const exists = new Set(before.map(m => m.symbol));
  for (const t of targets) {
    if (exists.has(t.symbol)) {
      console.log(`[addMarket] skip existing: ${t.symbol}`);
      continue;
    }
    console.log(`[addMarket] ${t.symbol}`);
    const tx = await spotAsAdmin.addMarket(t.base, t.quote, t.symbol, t.baseIsNative, t.quoteIsNative, { gasLimit: 5_000_000 });
    const rec = await tx.wait();
    console.log('  tx:', rec?.hash);
  }

  // Activate any newly added markets
  const all = await spotAsAdmin.getAllMarkets();
  for (const m of all) {
    if (!m.isActive && (m.symbol === 'PAS/USDC' || m.symbol === 'USDC/PAS')) {
      console.log(`[activateMarket] id=${m.id} (${m.symbol})`);
      const tx = await spotAsAdmin.activateMarket(m.id, { gasLimit: 2_000_000 });
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