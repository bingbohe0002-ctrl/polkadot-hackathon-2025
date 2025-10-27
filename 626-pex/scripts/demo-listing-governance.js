const hre = require("hardhat");
const { ethers, network } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const deployedPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
  const json = JSON.parse(fs.readFileSync(deployedPath, "utf8"));

  const governorAddr = json.contracts?.tokenListingGovernor;
  const spotMarketAddr = json.contracts?.spotMarket;
  const pexAddr = json.tokens?.pex;
  const usdcAddr = json.tokens?.usdc;

  if (!governorAddr || !spotMarketAddr || !pexAddr || !usdcAddr) {
    throw new Error("Missing addresses in deployed.json: governor/spotMarket/pas/usdc");
  }

  const governor = await ethers.getContractAt("TokenListingGovernor", governorAddr);
  const spotMarket = await ethers.getContractAt("SpotMarket", spotMarketAddr);

  console.log(`[GovernanceDemo] Using governor=${governorAddr}, spotMarket=${spotMarketAddr}`);
  console.log(`[GovernanceDemo] Base=${pexAddr} (PEX), Quote=${usdcAddr} (USDC)`);

  // Create proposal for PAS/USDC
  const symbol = "PAS/USDC";
  const txProp = await governor.createProposal(pexAddr, usdcAddr, symbol);
  await txProp.wait();
  const proposalId = await governor.proposalCount();
  console.log(`[GovernanceDemo] Proposal created: id=${proposalId}`);

  // Cast votes from several voters using native PEX (ETH) value
  const voteAmount = ethers.parseEther(process.env.VOTE_AMOUNT || "10");
  const signers = await ethers.getSigners();
  for (let i = 0; i < Math.min(signers.length, 3); i++) {
    const govAs = governor.connect(signers[i]);
    try {
      const txVote = await govAs.vote(proposalId, true, { value: voteAmount });
      await txVote.wait();
      console.log(`[GovernanceDemo] Voter ${i} (${signers[i].address}) voted YES with ${voteAmount} wei`);
    } catch (e) {
      console.log(`[GovernanceDemo] Voter ${i} vote failed: ${e.message}`);
    }
  }

  // Mine blocks to exceed voting period
  console.log(`[GovernanceDemo] Mining blocks to pass voting period...`);
  await network.provider.send("hardhat_mine", ["0x28"]); // +40 blocks

  // Finalize
  const txFin = await governor.finalize(proposalId);
  await txFin.wait();
  console.log(`[GovernanceDemo] Proposal finalized.`);

  // Find new market and activate it
  const markets = await spotMarket.getAllMarkets();
  const found = markets.find((m) => m.baseToken.toLowerCase() === pexAddr.toLowerCase() && m.quoteToken.toLowerCase() === usdcAddr.toLowerCase());
  if (!found) {
    throw new Error("New market not found after finalize");
  }
  console.log(`[GovernanceDemo] New market id=${found.id}, active=${found.isActive}`);

  // Activate via GOVERNOR_ROLE (use admin signer)
  const { admin } = await hre.getNamedAccounts();
  const adminSigner = await ethers.getSigner(admin);
  const smAsAdmin = spotMarket.connect(adminSigner);
  if (!found.isActive) {
    const txAct = await smAsAdmin.activateMarket(found.id);
    await txAct.wait();
    console.log(`[GovernanceDemo] Market activated: id=${found.id}`);
  } else {
    console.log(`[GovernanceDemo] Market already active: id=${found.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});