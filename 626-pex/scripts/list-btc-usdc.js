const hre = require("hardhat");
const { ethers, network } = hre;
const fs = require("fs");
const path = require("path");

function readEnvLocal() {
  const envPath = path.join(__dirname, "../frontend/.env.local");
  let env = {};
  try {
    const txt = fs.readFileSync(envPath, "utf8");
    txt.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].trim();
        env[key] = val;
      }
    });
  } catch (_) {}
  return env;
}

async function main() {
  const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
  let json = {};
  try { json = JSON.parse(fs.readFileSync(deployedPath, "utf8")); } catch (_) {}
  const env = readEnvLocal();

  const governorAddr = json.contracts?.tokenListingGovernor || env.NEXT_PUBLIC_TOKENLISTING_GOVERNOR_ADDRESS;
  const spotMarketAddr = json.contracts?.spotMarket || env.NEXT_PUBLIC_SPOTMARKET_ADDRESS;
  const usdcAddr = json.tokens?.usdc || env.NEXT_PUBLIC_USDC_ADDRESS;
  const btcAddr = json.tokens?.btc || env.NEXT_PUBLIC_BTC_ADDRESS;

  if (!governorAddr || !spotMarketAddr || !usdcAddr || !btcAddr) {
    throw new Error("Missing addresses: governor/spotMarket/usdc/btc");
  }

  const codeGov = await ethers.provider.getCode(governorAddr);
  if (!codeGov || codeGov === "0x") throw new Error(`Governor not deployed at ${governorAddr}`);
  const codeSm = await ethers.provider.getCode(spotMarketAddr);
  if (!codeSm || codeSm === "0x") throw new Error(`SpotMarket not deployed at ${spotMarketAddr}`);

  const governor = await ethers.getContractAt("TokenListingGovernor", governorAddr);
  const spotMarket = await ethers.getContractAt("SpotMarket", spotMarketAddr);

  console.log(`[BTC Listing] governor=${governorAddr}, spotMarket=${spotMarketAddr}`);
  console.log(`[BTC Listing] Base=${btcAddr} (BTC), Quote=${usdcAddr} (USDC)`);

  // Create proposal for BTC/USDC
  const symbol = "BTC/USDC";
  const txProp = await governor.createProposal(btcAddr, usdcAddr, symbol);
  await txProp.wait();
  const proposalId = await governor.proposalCount();
  console.log(`[BTC Listing] Proposal created: id=${proposalId}`);

  // Cast votes from several voters using native value (PEX-as-native)
  const voteAmount = ethers.parseEther(process.env.VOTE_AMOUNT || "10");
  const signers = await ethers.getSigners();
  for (let i = 0; i < Math.min(signers.length, 3); i++) {
    const govAs = governor.connect(signers[i]);
    try {
      const txVote = await govAs.vote(proposalId, true, { value: voteAmount });
      await txVote.wait();
      console.log(`[BTC Listing] Voter ${i} (${signers[i].address}) voted YES with ${voteAmount} wei`);
    } catch (e) {
      console.log(`[BTC Listing] Voter ${i} vote failed: ${e.message}`);
    }
  }

  // Mine blocks to exceed voting period
  console.log(`[BTC Listing] Mining blocks to pass voting period...`);
  await network.provider.send("hardhat_mine", ["0x28"]); // +40 blocks

  // Finalize
  const txFin = await governor.finalize(proposalId);
  await txFin.wait();
  console.log(`[BTC Listing] Proposal finalized.`);

  // Verify new market exists and is active
  const markets = await spotMarket.getAllMarkets();
  const found = markets.find((m) => m.baseToken.toLowerCase() === btcAddr.toLowerCase() && m.quoteToken.toLowerCase() === usdcAddr.toLowerCase());
  if (!found) {
    throw new Error("BTC/USDC market not found after finalize");
  }
  console.log(`[BTC Listing] Market id=${found.id}, active=${found.isActive}`);
  if (!found.isActive) {
    // Activate via GOVERNOR_ROLE using admin signer
    const { admin } = await hre.getNamedAccounts();
    const adminSigner = await ethers.getSigner(admin);
    const smAsAdmin = spotMarket.connect(adminSigner);
    const txAct = await smAsAdmin.activateMarket(found.id);
    await txAct.wait();
    console.log(`[BTC Listing] Market activated: id=${found.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});