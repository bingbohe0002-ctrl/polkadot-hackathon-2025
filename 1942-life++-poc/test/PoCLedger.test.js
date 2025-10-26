// ============================================================================
// test/PoCLedger.test.js - Unit tests
// ============================================================================
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Life++ PoC Ledger", function () {
  let catk, aNFT, registry, ledger;
  let owner, agent, validator1, validator2, validator3;

  beforeEach(async function () {
    [owner, agent, validator1, validator2, validator3] = await ethers.getSigners();

    // Deploy contracts
    const CATK = await ethers.getContractFactory("CognitiveAssetToken");
    catk = await CATK.deploy();

    const ANFT = await ethers.getContractFactory("ActionProofNFT");
    aNFT = await ANFT.deploy();

    const Registry = await ethers.getContractFactory("PoCRegistry");
    registry = await Registry.deploy(await catk.getAddress());

    const Ledger = await ethers.getContractFactory("PoCLedger");
    ledger = await Ledger.deploy(await registry.getAddress(), await aNFT.getAddress());

    // Setup roles
    const MINTER_ROLE = await aNFT.MINTER_ROLE();
    await aNFT.grantRole(MINTER_ROLE, await ledger.getAddress());

    const VALIDATOR_ROLE = await ledger.VALIDATOR_ROLE();
    await ledger.grantRole(VALIDATOR_ROLE, validator1.address);
    await ledger.grantRole(VALIDATOR_ROLE, validator2.address);
    await ledger.grantRole(VALIDATOR_ROLE, validator3.address);

    // Setup agent
    const stakeAmount = ethers.parseEther("100");
    await catk.transfer(agent.address, stakeAmount);
    await catk.connect(agent).approve(await registry.getAddress(), stakeAmount);
  });

  it("Should register agent successfully", async function () {
    const metaHash = ethers.id("test-agent");
    const stakeAmount = ethers.parseEther("100");

    const tx = await registry.connect(agent).registerAgent(
      agent.address,
      metaHash,
      stakeAmount
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const parsed = registry.interface.parseLog(log);
        return parsed.name === "AgentRegistered";
      } catch {
        return false;
      }
    });
    expect(event).to.not.be.undefined;
    const parsedEvent = registry.interface.parseLog(event);
    expect(parsedEvent.args.agentAddr).to.equal(agent.address);
  });

  it("Should submit and verify proof with 3 attestations", async function () {
    // Register agent
    const metaHash = ethers.id("test-agent");
    const stakeAmount = ethers.parseEther("100");
    const regTx = await registry.connect(agent).registerAgent(
      agent.address,
      metaHash,
      stakeAmount
    );
    const regReceipt = await regTx.wait();
    const regEvent = regReceipt.logs.find(log => {
      try {
        const parsed = registry.interface.parseLog(log);
        return parsed.name === "AgentRegistered";
      } catch {
        return false;
      }
    });
    const parsedRegEvent = registry.interface.parseLog(regEvent);
    const cid = parsedRegEvent.args.cid;

    // Submit proof
    const inputHash = ethers.id("input");
    const reasoningHash = ethers.id("reasoning");
    const outputHash = ethers.id("output");
    const metadataCID = "QmTest";

    const submitTx = await ledger.connect(agent).submitProof(
      cid,
      inputHash,
      reasoningHash,
      outputHash,
      metadataCID
    );
    const submitReceipt = await submitTx.wait();
    const submitEvent = submitReceipt.logs.find(log => {
      try {
        const parsed = ledger.interface.parseLog(log);
        return parsed.name === "ProofSubmitted";
      } catch {
        return false;
      }
    });
    const parsedSubmitEvent = ledger.interface.parseLog(submitEvent);
    const proofId = parsedSubmitEvent.args.proofId;

    // Attest by 3 validators
    await ledger.connect(validator1).attestProof(proofId, true);
    await ledger.connect(validator2).attestProof(proofId, true);
    await ledger.connect(validator3).attestProof(proofId, true);

    // Check status
    const proof = await ledger.getProof(proofId);
    expect(proof.status).to.equal(1); // VERIFIED
    expect(proof.attestedBy.length).to.equal(3);
  });

  it("Should reject proof if validator disapproves", async function () {
    // Register and submit proof
    const metaHash = ethers.id("test-agent");
    const stakeAmount = ethers.parseEther("100");
    const regTx = await registry.connect(agent).registerAgent(
      agent.address,
      metaHash,
      stakeAmount
    );
    const regReceipt = await regTx.wait();
    const regEvent = regReceipt.logs.find(log => {
      try {
        const parsed = registry.interface.parseLog(log);
        return parsed.name === "AgentRegistered";
      } catch {
        return false;
      }
    });
    const parsedRegEvent = registry.interface.parseLog(regEvent);
    const cid = parsedRegEvent.args.cid;

    const submitTx = await ledger.connect(agent).submitProof(
      cid,
      ethers.id("input"),
      ethers.id("reasoning"),
      ethers.id("output"),
      "QmTest"
    );
    const submitReceipt = await submitTx.wait();
    const submitEvent = submitReceipt.logs.find(log => {
      try {
        const parsed = ledger.interface.parseLog(log);
        return parsed.name === "ProofSubmitted";
      } catch {
        return false;
      }
    });
    const parsedSubmitEvent = ledger.interface.parseLog(submitEvent);
    const proofId = parsedSubmitEvent.args.proofId;

    // Reject proof
    await ledger.connect(validator1).attestProof(proofId, false);

    const proof = await ledger.getProof(proofId);
    expect(proof.status).to.equal(2); // REJECTED
  });
});
