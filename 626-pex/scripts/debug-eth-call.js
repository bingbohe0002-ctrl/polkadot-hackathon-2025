const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  const to = process.env.TO;
  const from = process.env.FROM;
  const data = process.env.DATA;
  if (!to || !from || !data) throw new Error('Provide TO, FROM, DATA env vars');
  try {
    const res = await ethers.provider.call({ to, from, data });
    console.log('eth_call result:', res);
  } catch (e) {
    console.log('eth_call error:', e.message || e);
    if (e.data) {
      console.log('error data:', e.data);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });