const hre = require("hardhat");
const { ethers, network, deployments, getNamedAccounts } = hre;

async function main() {
  // Read addresses directly from hardhat-deploy artifacts
  const govDep = await deployments.get("TokenListingGovernor");
  const spotDep = await deployments.get("SpotMarket");
  const pexDep = await deployments.get("PEXToken");
  const usdcDep = await deployments.get("MockERC20");

  const governorAddr = govDep.address;
  const spotMarketAddr = spotDep.address;
  const pexAddr = pexDep.address;
  const usdcAddr = usdcDep.address;

  const governor = await ethers.getContractAt("TokenListingGovernor", governorAddr);
  const spotMarket = await ethers.getContractAt("SpotMarket", spotMarketAddr);

  console.log(`[MultiVoteTest] governor=${governorAddr}`);

  // Create a proposal
  const symbol = "PAS/USDC";
  const txProp = await governor.createProposal(pexAddr, usdcAddr, symbol);
  await txProp.wait();
  const proposalId = await governor.proposalCount();
  console.log(`[MultiVoteTest] Proposal created: id=${proposalId}`);

  // Use signer[0] to cast two YES votes
  const [signer0] = await ethers.getSigners();
  const voteAmount1 = ethers.parseEther(process.env.VOTE_AMOUNT_1 || "3");
  const voteAmount2 = ethers.parseEther(process.env.VOTE_AMOUNT_2 || "7");

  console.log(`[MultiVoteTest] Signer0=${signer0.address} sending two YES votes: ${voteAmount1} + ${voteAmount2}`);
  const govAs0 = governor.connect(signer0);

  // First vote
  const txV1 = await govAs0.vote(proposalId, true, { value: voteAmount1 });
  await txV1.wait();
  console.log(`[MultiVoteTest] First YES vote mined: ${txV1.hash}`);

  // Second vote (same direction)
  const txV2 = await govAs0.vote(proposalId, true, { value: voteAmount2 });
  await txV2.wait();
  console.log(`[MultiVoteTest] Second YES vote mined: ${txV2.hash}`);

  // Read proposal tallies
  const p = await governor.proposals(proposalId);
  console.log(`[MultiVoteTest] Tallies: yesVotes=${p.yesVotes} noVotes=${p.noVotes}`);

  // Check per-voter cumulative weight
  const weight = await governor.weightOf(proposalId, signer0.address);
  const support = await governor.supportOf(proposalId, signer0.address);
  console.log(`[MultiVoteTest] Voter weightOf=${weight}, supportOf=${support}`);

  // Expect yesVotes == voteAmount1 + voteAmount2
  const expected = voteAmount1 + voteAmount2;
  if (p.yesVotes !== expected) {
    throw new Error(`yesVotes mismatch: expected ${expected} got ${p.yesVotes}`);
  }

  // Mine blocks to exceed voting period
  console.log(`[MultiVoteTest] Mining blocks to pass voting period...`);
  await network.provider.send("hardhat_mine", ["0x28"]); // +40 blocks

  // Finalize with admin signer (must have SpotMarket GOVERNOR_ROLE)
  const { admin } = await getNamedAccounts();
  const adminSigner = await ethers.getSigner(admin);
  const govAsAdmin = governor.connect(adminSigner);
  const txFin = await govAsAdmin.finalize(proposalId);
  await txFin.wait();
  console.log(`[MultiVoteTest] Finalized OK. Approved? see events/logs.`);

  // Verify market exists
  const markets = await spotMarket.getAllMarkets();
  const found = markets.find((m) => m.baseToken.toLowerCase() === pexAddr.toLowerCase() && m.quoteToken.toLowerCase() === usdcAddr.toLowerCase());
  if (!found) throw new Error("Market not found after finalize");
  console.log(`[MultiVoteTest] Market id=${found.id}, active=${found.isActive}, symbol=${found.symbol}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});