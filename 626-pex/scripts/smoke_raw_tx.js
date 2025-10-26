const { JsonRpcProvider, Wallet, parseUnits } = require("ethers");

async function main() {
  const rpc = process.env.RPC_URL || "http://127.0.0.1:8545";
  const pk = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const provider = new JsonRpcProvider(rpc);
  const net = await provider.getNetwork();
  console.log("Network:", net.chainId.toString());
  const wallet = new Wallet(pk, provider);
  console.log("From:", wallet.address);

  const bal = await provider.getBalance(wallet.address);
  console.log("Balance:", bal.toString());
  const fee = await provider.getFeeData();
  console.log("FeeData:", fee);

  const nonceLatest = await provider.getTransactionCount(wallet.address, "latest");
  const noncePending = await provider.getTransactionCount(wallet.address, "pending");
  const nonce = Math.max(nonceLatest, noncePending);
  console.log("Nonce latest:", nonceLatest, "pending:", noncePending, "chosen:", nonce);

  const gasPrice = fee.gasPrice || parseUnits("10", "gwei");

  const tx = {
    type: 0, // legacy
    to: wallet.address,
    value: 0n, // 0 wei
    gasLimit: 21000n,
    gasPrice,
    nonce,
  };

  const sent = await wallet.sendTransaction(tx);
  console.log("Tx:", sent.hash);
  const rc = await sent.wait();
  console.log("Receipt:", rc);
}

main().catch((e) => {
  console.error("Raw tx failed:", e);
  process.exit(1);
});