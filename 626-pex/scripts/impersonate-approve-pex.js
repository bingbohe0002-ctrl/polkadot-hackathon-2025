const hre = require('hardhat');
const { ethers, network } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  const trader = process.env.TRADER;
  const amountStr = process.env.AMOUNT || '1000000';
  if (!trader || !/^0x[0-9a-fA-F]{40}$/.test(trader)) throw new Error('Provide TRADER=0x...');

  const depPath = path.join(__dirname, '../frontend/src/lib/contracts/deployed.json');
  const json = JSON.parse(fs.readFileSync(depPath, 'utf8'));
  const spotOrderBook = json.contracts?.spotOrderBook;
  const pexAddr = json.tokens?.pex;
  if (!spotOrderBook || !pexAddr) throw new Error('deployed.json missing addresses');

  // Fund trader with ETH and impersonate
  await network.provider.request({ method: 'hardhat_setBalance', params: [trader, '0x8AC7230489E80000'] }); // 10 ETH
  await network.provider.request({ method: 'hardhat_impersonateAccount', params: [trader] });
  const signer = await ethers.getSigner(trader);

  const erc20Abi = [ 'function approve(address spender, uint256 amount) returns (bool)', 'function decimals() view returns (uint8)' ];
  const pex = await ethers.getContractAt(erc20Abi, pexAddr, signer);
  const decimals = await pex.decimals();
  const amount = ethers.parseUnits(amountStr, decimals);

  console.log('Impersonating to approve PEX...');
  console.log('Trader:', trader);
  console.log('PEX:', pexAddr);
  console.log('OrderBook:', spotOrderBook);
  console.log('Amount:', amountStr, 'PEX');

  const tx = await pex.approve(spotOrderBook, amount);
  console.log('Approve tx:', tx.hash);
  await tx.wait();
  console.log('PEX allowance set.');

  await network.provider.request({ method: 'hardhat_stopImpersonatingAccount', params: [trader] });
}

main().catch((e) => { console.error(e); process.exit(1); });