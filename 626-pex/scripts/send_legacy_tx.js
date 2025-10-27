const { ethers } = require("ethers");

async function main() {
  const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat default #0
  const TO = (process.env.TO || "0x59C6995e998f97a5a0044966F0945389Dc9E86dA").toLowerCase(); // Hardhat default #1
  const VALUE_WEI = BigInt(process.env.VALUE_WEI || "10000000000000"); // 0.00001 ETH

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const chainId = await provider.send("eth_chainId", []);
  const gasPriceHex = await provider.send("eth_gasPrice", []);
  const gasPrice = BigInt(gasPriceHex);
  const nonce = await provider.getTransactionCount(signer.address, "pending");

  console.log("RPC:", RPC_URL);
  console.log("chainId:", chainId);
  console.log("from:", signer.address);
  console.log("to:", TO);
  console.log("gasPrice:", gasPrice.toString());
  console.log("nonce:", nonce);

  const tx = {
    to: TO,
    value: VALUE_WEI,
    gasPrice,
    gasLimit: 21000n,
    nonce,
    type: 0, // force legacy
  };

  const sent = await signer.sendTransaction(tx);
  console.log("tx sent:", sent.hash);
  const rec = await sent.wait();
  console.log("receipt:", rec);
}

main().catch((e) => {
  console.error("send_legacy_tx failed:", e);
  process.exit(1);
});