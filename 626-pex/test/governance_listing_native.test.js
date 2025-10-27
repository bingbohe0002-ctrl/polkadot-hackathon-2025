const { expect } = require("chai");
const { ethers, deployments, getNamedAccounts, network } = require("hardhat");

const ZERO = ethers.ZeroAddress;

describe("TokenListingGovernor - native PEX listing & activation", function () {
  let spotMarket, spotOrderBook, usdc;
  let governor;
  let adminSigner, deployerSigner, voterA, voterB;

  beforeEach(async () => {
    // Deploy core needed contracts: USDC mock, SpotMarket, SpotOrderBook
    await deployments.fixture(["USDC", "Spot"]);
    const smDep = await deployments.get("SpotMarket");
    const obDep = await deployments.get("SpotOrderBook");
    const usdcDep = await deployments.get("MockERC20");
    spotMarket = await ethers.getContractAt("SpotMarket", smDep.address);
    spotOrderBook = await ethers.getContractAt("SpotOrderBook", obDep.address);
    usdc = await ethers.getContractAt("MockERC20", usdcDep.address);

    const { admin, deployer } = await getNamedAccounts();
    adminSigner = await ethers.getSigner(admin);
    deployerSigner = await ethers.getSigner(deployer);
    const signers = await ethers.getSigners();
    voterA = signers[6];
    voterB = signers[7];

    // Deploy governor with native PEX (pexToken = zero)
    const votingPeriodBlocks = 20; // short period for test
    const approvalBps = 6000; // 60% threshold
    const GovFactory = await ethers.getContractFactory("TokenListingGovernor");
    governor = await GovFactory.deploy(ZERO, spotMarket.target, votingPeriodBlocks, approvalBps);
    await governor.waitForDeployment();

    // Grant GOVERNOR_ROLE on SpotMarket to admin and governor, so finalize can pass
    const GOV = await spotMarket.GOVERNOR_ROLE();
    const smAsAdmin = spotMarket.connect(adminSigner);
    await (await smAsAdmin.grantRole(GOV, adminSigner.address)).wait();
    await (await smAsAdmin.grantRole(GOV, governor.target)).wait();
  });

  it("finalizes PAS/USDC (Native/ERC20) listing via governance", async () => {
    // Create proposal for PEX(native)/USDC
    const txProp = await governor.connect(voterA).createProposal(ZERO, usdc.target, "PAS/USDC");
    await txProp.wait();
    const proposalId = await governor.proposalCount();

    // Cast votes using native value (PEX-as-native)
    const voteA = ethers.parseEther("6");
    const voteB = ethers.parseEther("5");
    await (await governor.connect(voterA).vote(proposalId, true, { value: voteA })).wait();
    await (await governor.connect(voterB).vote(proposalId, true, { value: voteB })).wait();

    // Mine blocks to exceed voting period
    await network.provider.send("hardhat_mine", ["0x28"]); // +40 blocks

    // Finalize with admin signer
    const govAsAdmin = governor.connect(adminSigner);
    await (await govAsAdmin.finalize(proposalId)).wait();

    // Verify market exists and is active
    const markets = await spotMarket.getAllMarkets();
    const found = markets.find((m) => m.symbol === "PAS/USDC");
    expect(found).to.not.be.undefined;
    expect(found.isActive).to.equal(true);
    expect(found.baseIsNative).to.equal(true);
    expect(found.quoteIsNative).to.equal(false);
  });

  it("finalizes USDC/PAS (ERC20/Native) listing via governance", async () => {
    // Create proposal for USDC/ERC20 base vs native quote
    const txProp = await governor.connect(voterA).createProposal(usdc.target, ZERO, "USDC/PAS");
    await txProp.wait();
    const proposalId = await governor.proposalCount();

    const voteA = ethers.parseEther("7");
    const voteB = ethers.parseEther("2");
    await (await governor.connect(voterA).vote(proposalId, true, { value: voteA })).wait();
    await (await governor.connect(voterB).vote(proposalId, true, { value: voteB })).wait();

    await network.provider.send("hardhat_mine", ["0x28"]);

    const govAsAdmin = governor.connect(adminSigner);
    await (await govAsAdmin.finalize(proposalId)).wait();

    const markets = await spotMarket.getAllMarkets();
    const found = markets.find((m) => m.symbol === "USDC/PAS");
    expect(found).to.not.be.undefined;
    expect(found.isActive).to.equal(true);
    expect(found.baseIsNative).to.equal(false);
    expect(found.quoteIsNative).to.equal(true);
  });
});