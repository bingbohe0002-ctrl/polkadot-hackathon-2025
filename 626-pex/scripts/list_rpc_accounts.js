const { JsonRpcProvider } = require("ethers");

async function main() {
  const rpc = process.env.RPC_URL || "http://127.0.0.1:8545";
  const provider = new JsonRpcProvider(rpc);
  const accounts = await provider.send("eth_accounts", []);
  console.log("eth_accounts:", accounts);
}

main().catch((e) => { console.error(e); process.exit(1); });