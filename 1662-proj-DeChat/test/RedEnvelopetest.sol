import { ethers } from "hardhat";
import { expect } from "chai";
import { TieredRedPacket, TieredNFT } from "../typechain-types";

describe("TieredRedPacket", function () {
  let nft: TieredNFT;
  let redPacket: TieredRedPacket;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 部署 NFT
    const NFT = await ethers.getContractFactory("TieredNFT");
    nft = await NFT.deploy();
    await nft.deployed();

    // mint NFT 给 user1
    await nft.mint(user1.address, 1); // tokenId = 1
    await nft.setTier(1, 2); // 假设 2 = Silver

    // mint NFT 给 user2
    await nft.mint(user2.address, 2); // tokenId = 2
    await nft.setTier(2, 3); // 3 = Gold

    // 部署红包合约
    const RedPacket = await ethers.getContractFactory("TieredRedPacket");
    redPacket = await RedPacket.deploy(nft.address);
    await redPacket.deployed();
  });

  it("should create a Normal red packet", async function () {
    const tx = await redPacket.connect(owner).createRedPacket(0, 2, { value: ethers.utils.parseEther("1") });
    const receipt = await tx.wait();
    expect(receipt.events?.[0].event).to.equal("PacketCreated");

    const info = await redPacket.getPacketInfo(0);
    expect(info.totalAmount).to.equal(ethers.utils.parseEther("1"));
    expect(info.active).to.equal(true);
  });

  it("should allow anyone to claim Normal red packet", async function () {
    await redPacket.connect(owner).createRedPacket(0, 2, { value: ethers.utils.parseEther("1") });

    const balanceBefore = await ethers.provider.getBalance(user1.address);
    await redPacket.connect(user1).claim(0, 0); // Normal 红包不检查 NFT

    const balanceAfter = await ethers.provider.getBalance(user1.address);
    expect(balanceAfter.sub(balanceBefore)).to.be.gt(0);
  });

  it("should enforce NFT tier for Advanced and Super packets", async function () {
    // Advanced: Silver+
    await redPacket.connect(owner).createRedPacket(1, 1, { value: ethers.utils.parseEther("1") });
    await expect(redPacket.connect(user2).claim(1, 2)).to.not.be.reverted;
    await expect(redPacket.connect(user1).claim(1, 1)).to.not.be.reverted;

    // Super: Gold
    await redPacket.connect(owner).createRedPacket(2, 1, { value: ethers.utils.parseEther("1") });
    await expect(redPacket.connect(user1).claim(2, 1)).to.be.revertedWith("Need Gold");
    await expect(redPacket.connect(user2).claim(2, 2)).to.not.be.reverted;
  });

  it("should refund unclaimed balance", async function () {
    await redPacket.connect(owner).createRedPacket(0, 3, { value: ethers.utils.parseEther("1") });

    const balanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await redPacket.connect(owner).refund(0);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const balanceAfter = await ethers.provider.getBalance(owner.address);
    expect(balanceAfter.sub(balanceBefore).add(gasUsed)).to.equal(ethers.utils.parseEther("1"));

    const info = await redPacket.getPacketInfo(0);
    expect(info.active).to.equal(false);
    expect(info.balance).to.equal(0);
  });
});
