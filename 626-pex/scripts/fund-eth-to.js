const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

function getFaucetPrivateKeyFromEnvLocal() {
  try {
    const envPath = path.join(__dirname, '../frontend/.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/FAUCET_PRIVATE_KEY\s*=\s*(0x[0-9a-fA-F]{64})/);
    return match ? match[1] : null;
  } catch (_) {
    return null;
  }
}

async function main() {
  const to = process.env.TO;
  const amtStr = process.env.AMOUNT || '10'; // default 10 ETH
  if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
    throw new Error('请提供有效的收款地址，示例：TO=0xabc...');
  }

  const overridePk = process.env.FAUCET_PRIVATE_KEY || null;
  const envPk = getFaucetPrivateKeyFromEnvLocal();
  const pk = overridePk || envPk;
  if (!pk) {
    throw new Error('未找到水龙头私钥。请在环境变量 FAUCET_PRIVATE_KEY 或 frontend/.env.local 中配置 FAUCET_PRIVATE_KEY');
  }
  const faucet = new ethers.Wallet(pk, ethers.provider);

  console.log(`[Fund ETH] Faucet: ${faucet.address}`);
  console.log(`[Fund ETH] To: ${to}`);
  console.log(`[Fund ETH] Amount: ${amtStr} ETH`);

  const bal = await ethers.provider.getBalance(faucet.address);
  console.log(`[Faucet ETH Balance] ${ethers.formatEther(bal)} ETH`);

  const tx = await faucet.sendTransaction({ to, value: ethers.parseEther(amtStr) });
  console.log('Sent tx:', tx.hash);
  await tx.wait();

  const toBal = await ethers.provider.getBalance(to);
  console.log(`[Recipient ETH Balance] ${ethers.formatEther(toBal)} ETH`);
}

main().catch((e) => { console.error(e); process.exit(1); });