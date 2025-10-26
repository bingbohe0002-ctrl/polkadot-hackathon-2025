const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  const depPath = path.join(__dirname, '../deployments/localhost/PerpMarket.json');
  const depJson = JSON.parse(fs.readFileSync(depPath, 'utf8'));
  const address = depJson.address;
  if (!address) throw new Error('PerpMarket address not found in deployments');

  const pm = await ethers.getContractAt('PerpMarket', address);

  const out = { PerpMarket: address };
  async function safe(name, fn) {
    try {
      out[name] = await fn();
    } catch (e) {
      out[name] = `<error: ${e.shortMessage || e.message || e}>`;
    }
  }

  await safe('usdcToken', () => pm.usdcToken());
  await safe('matchEngine', () => pm.matchEngine());
  await safe('marginVault', () => pm.marginVault());
  await safe('riskEngine', () => pm.riskEngine());
  await safe('oracle', () => pm.oracle());

  console.log('PerpMarket wiring:');
  Object.entries(out).forEach(([k, v]) => console.log(k + ':', v));

  if (out.usdcToken === ethers.ZeroAddress) {
    console.log('WARN: usdcToken is zero-address (未设置 USDC)');
  }
  if (out.matchEngine === ethers.ZeroAddress) {
    console.log('WARN: matchEngine is zero-address (未设置撮合引擎)');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });