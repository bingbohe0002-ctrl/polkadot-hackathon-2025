import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const WORD_HASH_A = ethers.keccak256(ethers.toUtf8Bytes("alpha"));
const WORD_HASH_B = ethers.keccak256(ethers.toUtf8Bytes("bravo"));

describe("WorbooRegistry", () => {
  async function deploy() {
    const factory = await ethers.getContractFactory("WorbooRegistry");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it("registers new players and prevents duplicates", async () => {
    const registry = await deploy();
    const [, player] = await ethers.getSigners();

    await expect(registry.connect(player).register())
      .to.emit(registry, "PlayerRegistered")
      .withArgs(player.address);

    const profile = await registry.getProfile(player.address);
    expect(profile.isRegistered).to.be.true;
    expect(profile.totalGames).to.equal(0);
    expect(profile.totalWins).to.equal(0);
    expect(profile.currentStreak).to.equal(0);
    expect(profile.lastDayId).to.equal(0);

    await expect(registry.connect(player).register()).to.be.revertedWith(
      "AlreadyRegistered"
    );
  });

  it("requires registration before recording games", async () => {
    const registry = await deploy();
    const [, player] = await ethers.getSigners();

    await expect(
      registry.connect(player).recordGame(1, WORD_HASH_A, 3, true)
    ).to.be.revertedWith("NotRegistered");
  });

  it("records victories, streaks, and enforces daily ordering", async () => {
    const registry = await deploy();
    const [, player] = await ethers.getSigners();
    await registry.connect(player).register();

    const baseTimestamp = BigInt(await time.latest());
    await time.setNextBlockTimestamp(baseTimestamp + 10n);
    await expect(
      registry.connect(player).recordGame(1, WORD_HASH_A, 4, true)
    )
      .to.emit(registry, "GameRecorded")
      .withArgs(player.address, 1, WORD_HASH_A, 4, true, 1, 1, 1);

    let profile = await registry.getProfile(player.address);
    expect(profile.totalGames).to.equal(1);
    expect(profile.totalWins).to.equal(1);
    expect(profile.currentStreak).to.equal(1);
    expect(profile.lastDayId).to.equal(1);
    expect(profile.lastSubmissionAt).to.equal(baseTimestamp + 10n);

    const secondTimestamp = BigInt(await time.latest()) + 10n;
    await time.setNextBlockTimestamp(secondTimestamp);
    await expect(
      registry.connect(player).recordGame(2, WORD_HASH_B, 3, true)
    )
      .to.emit(registry, "GameRecorded")
      .withArgs(player.address, 2, WORD_HASH_B, 3, true, 2, 2, 2);

    profile = await registry.getProfile(player.address);
    expect(profile.totalGames).to.equal(2);
    expect(profile.totalWins).to.equal(2);
    expect(profile.currentStreak).to.equal(2);
    expect(profile.lastDayId).to.equal(2);
    expect(profile.lastSubmissionAt).to.equal(secondTimestamp);

    await expect(
      registry.connect(player).recordGame(2, WORD_HASH_A, 3, true)
    ).to.be.revertedWith("DayNotStrictlyIncreasing");

    const fourthTimestamp = BigInt(await time.latest()) + 10n;
    await time.setNextBlockTimestamp(fourthTimestamp);
    await expect(
      registry.connect(player).recordGame(4, WORD_HASH_A, 5, true)
    )
      .to.emit(registry, "GameRecorded")
      .withArgs(player.address, 4, WORD_HASH_A, 5, true, 1, 3, 3);

    profile = await registry.getProfile(player.address);
    expect(profile.currentStreak).to.equal(1);
    expect(profile.totalGames).to.equal(3);
    expect(profile.totalWins).to.equal(3);
    expect(profile.lastDayId).to.equal(4);
  });

  it("validates guesses and handles losses", async () => {
    const registry = await deploy();
    const [, player] = await ethers.getSigners();
    await registry.connect(player).register();

    await expect(
      registry.connect(player).recordGame(1, WORD_HASH_A, 0, false)
    ).to.be.revertedWith("InvalidGuesses");

    await expect(
      registry.connect(player).recordGame(1, WORD_HASH_A, 11, false)
    ).to.be.revertedWith("InvalidGuesses");

    await expect(
      registry.connect(player).recordGame(1, ethers.ZeroHash, 3, false)
    ).to.be.revertedWith("InvalidWordHash");

    const lossTimestamp = BigInt(await time.latest()) + 10n;
    await time.setNextBlockTimestamp(lossTimestamp);
    await registry.connect(player).recordGame(1, WORD_HASH_A, 6, false);

    const profile = await registry.getProfile(player.address);
    expect(profile.totalGames).to.equal(1);
    expect(profile.totalWins).to.equal(0);
    expect(profile.currentStreak).to.equal(0);
    expect(profile.lastDayId).to.equal(1);
  });
});
