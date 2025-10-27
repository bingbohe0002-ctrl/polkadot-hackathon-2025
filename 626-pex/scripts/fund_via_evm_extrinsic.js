const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { parseUnits } = require('ethers');

async function main() {
  const WS = process.env.WS_URL || 'ws://127.0.0.1:9944';
  const TARGET = (process.env.TARGET || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266').toLowerCase();
  const VALUE_ETH = process.env.VALUE_ETH ?? '1'; // allow decimals
  const VALUE_WEI = process.env.VALUE_WEI; // optional direct wei override

  const provider = new WsProvider(WS);
  const api = await ApiPromise.create({ provider });

  const pallets = Object.keys(api.tx);
  console.log('Available pallets:', pallets);

  if (!api.tx.revive) {
    throw new Error('pallet-revive not available on this node');
  }

  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  const wei = (VALUE_WEI ?? parseUnits(String(VALUE_ETH), 18)).toString();
  console.log('WS:', WS);
  console.log('Target H160:', TARGET);
  console.log('Value (wei):', wei);

  // Try mapping fallback account (optional, but helps with signing via EVM later)
  try {
    console.log('Calling revive.mapAccount() to bind fallback account...');
    await new Promise(async (resolve, reject) => {
      try {
        const unsub = await api.tx.revive.mapAccount().signAndSend(alice, ({ status, events }) => {
          console.log('mapAccount Status:', status.toString());
          if (status.isInBlock || status.isFinalized) {
            events.forEach(({ event: { section, method, data } }) => {
              console.log('mapAccount Event:', `${section}.${method}`, data.toString());
            });
            try { unsub && unsub(); } catch {}
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  } catch (err) {
    console.warn('revive.mapAccount failed or not required:', err?.message || err);
  }

  // Construct WeightV2 for gasLimit
  const gasWeight = api.registry.createType('WeightV2', { refTime: 1_000_000_000, proofSize: 0 });

  console.log('Calling revive.call() to transfer native ETH to target...');
  const tx = api.tx.revive.call(
    TARGET,
    wei,
    gasWeight,
    0,
    '0x'
  );

  await new Promise(async (resolve, reject) => {
    try {
      const unsub = await tx.signAndSend(alice, ({ status, events }) => {
        console.log('call Status:', status.toString());
        if (status.isInBlock || status.isFinalized) {
          events.forEach(({ event: { section, method, data } }) => {
            console.log('call Event:', `${section}.${method}`, data.toString());
          });
          try { unsub && unsub(); } catch {}
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });

  await api.disconnect();
}

main().catch((e) => {
  console.error('fund_via_evm_extrinsic failed:', e);
  process.exit(1);
});