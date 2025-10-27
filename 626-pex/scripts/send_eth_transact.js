const { ethers } = require("ethers");
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require("@polkadot/keyring");

async function main() {
  const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
  const WS = process.env.WS_URL || "ws://127.0.0.1:9944";
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat default #0
  const TO_RAW = process.env.TO || "0x59C6995e998f97a5a0044966F0945389Dc9E86dA";
  const TO = ethers.getAddress(TO_RAW);
  const VALUE_WEI = BigInt(process.env.VALUE_WEI || "10000000000000"); // 0.00001 ETH

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const gasPriceHex = await provider.send("eth_gasPrice", []);
  const gasPrice = BigInt(gasPriceHex);
  const nonce = await provider.getTransactionCount(signer.address, "pending");

  const legacyTx = {
    to: TO,
    value: VALUE_WEI,
    gasPrice,
    gasLimit: 21000n,
    nonce,
    type: 0,
  };

  const raw = await signer.signTransaction(legacyTx);
  console.log("raw tx:", raw);

  // Submit via revive.ethTransact to inspect detailed events
  const ws = new WsProvider(WS);
  const api = await ApiPromise.create({ provider: ws });
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");

  console.log("Submitting revive.ethTransact ...");
  await new Promise(async (resolve, reject) => {
    try {
      const unsub = await api.tx.revive.ethTransact(raw).signAndSend(alice, ({ status, events }) => {
        console.log("ethTransact Status:", status.toString());
        if (status.isInBlock || status.isFinalized) {
          events.forEach(({ event: { section, method, data } }) => {
            console.log("ethTransact Event:", `${section}.${method}`, data.toString());
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
  console.error("send_eth_transact failed:", e);
  process.exit(1);
});