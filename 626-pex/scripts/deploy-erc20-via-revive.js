const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require("@polkadot/keyring");

function getFaucetPrivateKeyFromEnvLocal() {
  try {
    const envPath = path.join(__dirname, "../frontend/.env.local");
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/FAUCET_PRIVATE_KEY\s*=\s*(0x[0-9a-fA-F]{64})/);
    return match ? match[1] : null;
  } catch (_) {
    return null;
  }
}

async function submitRawViaRevive(raw, wsUrl) {
  const ws = new WsProvider(wsUrl);
  const api = await ApiPromise.create({ provider: ws });
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");

  try {
    if (api.tx.revive?.mapAccount) {
      await new Promise(async (resolve, reject) => {
        try {
          const unsub = await api.tx.revive.mapAccount().signAndSend(alice, ({ status }) => {
            if (status.isInBlock || status.isFinalized) {
              try { unsub && unsub(); } catch {}
              resolve();
            }
          });
        } catch (e) { reject(e); }
      });
    }
  } catch (_) {}

  await new Promise(async (resolve, reject) => {
    try {
      const unsub = await api.tx.revive.ethTransact(raw).signAndSend(alice, ({ status, events }) => {
        if (status.isInBlock || status.isFinalized) {
          events.forEach(({ event: { section, method } }) => console.log("revive event:", `${section}.${method}`));
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

async function deployMockERC20({ name, symbol, decimals, rpcUrl, wsUrl, pk }) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const net = await provider.getNetwork();
  console.log(`[Network] chainId=${net.chainId}`);

  const wallet = new ethers.Wallet(pk, provider);
  console.log(`[Deployer] ${wallet.address}`);

  const artifactPath = process.env.ARTIFACT_PATH || path.join(__dirname, "../artifacts/contracts/src/mocks/MockERC20.sol/MockERC20.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const iface = new ethers.Interface(artifact.abi);
  const bytecode = artifact.bytecode?.object || artifact.bytecode;
  if (!bytecode) throw new Error("MockERC20 bytecode not found in artifacts");

  const deployData = ethers.concat([bytecode, iface.encodeDeploy([name, symbol, decimals])]);

  const gasPriceHex = await provider.send("eth_gasPrice", []);
  const gasPrice = BigInt(gasPriceHex);
  const nonce = await provider.getTransactionCount(wallet.address, "pending");

  const createGasLimit = BigInt(process.env.CREATE_GAS_LIMIT || 300000);

  const tx = {
    to: undefined,
    data: deployData,
    value: 0n,
    gasPrice,
    gasLimit: createGasLimit,
    nonce,
    type: 0,
    chainId: Number(net.chainId),
  };

  const raw = await wallet.signTransaction(tx);
  console.log(`[Raw CreateTx] len=${raw.length} gasLimit=${createGasLimit}`);

  await submitRawViaRevive(raw, wsUrl);

  const contractAddr = ethers.getCreateAddress({ from: wallet.address, nonce });
  console.log(`[Deployed] ${symbol} -> ${contractAddr}`);

  const code = await provider.getCode(contractAddr);
  if (!code || code === "0x") throw new Error(`Contract code not found at ${contractAddr}`);

  return { address: contractAddr, deployer: wallet.address };
}

async function callMintViaRevive({ rpcUrl, wsUrl, pk, tokenAddr, to, amount, abi }) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const net = await provider.getNetwork();
  const wallet = new ethers.Wallet(pk, provider);
  const iface = new ethers.Interface(abi);

  const data = iface.encodeFunctionData("mint", [to, amount]);
  const gasPrice = BigInt(await provider.send("eth_gasPrice", []));
  const nonce = await provider.getTransactionCount(wallet.address, "pending");

  const mintGasLimit = BigInt(process.env.MINT_GAS_LIMIT || 300000);

  const tx = {
    to: tokenAddr,
    data,
    value: 0n,
    gasPrice,
    gasLimit: mintGasLimit,
    nonce,
    type: 0,
    chainId: Number(net.chainId),
  };

  const raw = await wallet.signTransaction(tx);
  console.log(`[Raw MintTx] to=${tokenAddr} nonce=${nonce} gasLimit=${mintGasLimit}`);
  await submitRawViaRevive(raw, wsUrl);
}

async function main() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const wsUrl = process.env.WS_URL || "ws://127.0.0.1:9944";
  const faucetPk = process.env.FAUCET_PRIVATE_KEY || getFaucetPrivateKeyFromEnvLocal();
  if (!faucetPk) throw new Error("未找到水龙头私钥。请在环境变量 FAUCET_PRIVATE_KEY 或 frontend/.env.local 中配置。");

  const faucetAddr = new ethers.Wallet(faucetPk).address;
  console.log(`[Faucet] ${faucetAddr}`);

  const usdcWhole = BigInt(process.env.FAUCET_USDC_AMOUNT || "3000000");
  const btcWhole = BigInt(process.env.FAUCET_BTC_AMOUNT || "1000000");
  const usdcAmount = usdcWhole * 10n ** 6n;
  const btcAmount = btcWhole * 10n ** 8n;

  const usdc = await deployMockERC20({ name: "USD Coin", symbol: "USDC", decimals: 6, rpcUrl, wsUrl, pk: faucetPk });
  const btc = await deployMockERC20({ name: "Bitcoin", symbol: "BTC", decimals: 8, rpcUrl, wsUrl, pk: faucetPk });

  const artifactPath = process.env.ARTIFACT_PATH || path.join(__dirname, "../artifacts/contracts/src/mocks/MockERC20.sol/MockERC20.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  await callMintViaRevive({ rpcUrl, wsUrl, pk: faucetPk, tokenAddr: usdc.address, to: faucetAddr, amount: usdcAmount, abi: artifact.abi });
  console.log(`[Minted] USDC=${usdcWhole} to ${faucetAddr}`);
  await callMintViaRevive({ rpcUrl, wsUrl, pk: faucetPk, tokenAddr: btc.address, to: faucetAddr, amount: btcAmount, abi: artifact.abi });
  console.log(`[Minted] BTC=${btcWhole} to ${faucetAddr}`);

  const deployedPath = path.resolve(__dirname, "../frontend/src/lib/contracts/deployed.json");
  let deployed = {};
  try {
    if (fs.existsSync(deployedPath)) {
      deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    }
  } catch (e) {
    console.warn(`[Warn] Failed to read deployed.json: ${e.message}`);
  }
  deployed.tokens = deployed.tokens || {};
  deployed.tokens.usdc = usdc.address;
  deployed.tokens.btc = btc.address;
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log(`[Update] ${deployedPath} updated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });