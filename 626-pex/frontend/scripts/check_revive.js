const { ApiPromise, WsProvider } = require('@polkadot/api');
(async () => {
  try {
    const url = process.env.POLKAVM_WS_URL || 'ws://127.0.0.1:9944';
    const api = await ApiPromise.create({ provider: new WsProvider(url) });
    console.log('Connected to', url);
    console.log('Has revive pallet:', !!api.tx.revive);
    await api.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();