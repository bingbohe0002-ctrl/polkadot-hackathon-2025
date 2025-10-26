const { JsonRpcProvider } = require("ethers");

function toHexWei(etherStr) {
  // Convert decimal ETH string to wei hex
  const [whole, frac = ""] = etherStr.split(".");
  const weiWhole = BigInt(whole) * 10n ** 18n;
  const fracPadded = (frac + "000000000000000000").slice(0, 18);
  const weiFrac = BigInt(fracPadded);
  return "0x" + (weiWhole + weiFrac).toString(16);
}

async function main() {
  const rpc = process.env.RPC_URL || "http://127.0.0.1:8545";
  const to = process.env.TO;
  const amount = process.env.AMOUNT || "10"; // 10 ETH
  if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
    throw new Error("请提供有效的收款地址，示例：TO=0xabc...");
  }

  const provider = new JsonRpcProvider(rpc);
  const accounts = await provider.send("eth_accounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("节点未返回本地账户，无法使用 eth_sendTransaction 资助。");
  }
  const from = process.env.FROM || accounts[0];
  console.log("Using node account:", from);

  const gasPrice = await provider.send("eth_gasPrice", []); // hex
  console.log("gasPrice:", gasPrice);

  const tx = {
    from,
    to,
    value: toHexWei(amount),
    gas: "0x5208", // 21000
    gasPrice,
  };

  const hash = await provider.send("eth_sendTransaction", [tx]);
  console.log("Sent tx:", hash);
}

main().catch((e) => { console.error(e); process.exit(1); });