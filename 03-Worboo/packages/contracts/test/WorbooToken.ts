import { expect } from "chai";
import { ethers } from "hardhat";

describe("WorbooToken", () => {
  async function deploy() {
    const factory = await ethers.getContractFactory("WorbooToken");
    const token = await factory.deploy();
    await token.waitForDeployment();
    return token;
  }

  it("grants admin and game master roles to deployer", async () => {
    const token = await deploy();
    const [deployer] = await ethers.getSigners();

    const adminRole = await token.DEFAULT_ADMIN_ROLE();
    const gameMasterRole = await token.GAME_MASTER_ROLE();

    expect(await token.hasRole(adminRole, deployer.address)).to.be.true;
    expect(await token.hasRole(gameMasterRole, deployer.address)).to.be.true;
  });

  it("allows game master to mint and spend tokens", async () => {
    const token = await deploy();
    const [, player, gameMaster] = await ethers.getSigners();

    const gameMasterRole = await token.GAME_MASTER_ROLE();
    await token.grantRole(gameMasterRole, gameMaster.address);

    await expect(
      token.connect(gameMaster).mintTo(player.address, 500n)
    ).to.emit(token, "Transfer");

    expect(await token.balanceOf(player.address)).to.equal(500n);

    await expect(token.connect(gameMaster).spend(player.address, 200n)).to.emit(
      token,
      "Transfer"
    );

    expect(await token.balanceOf(player.address)).to.equal(300n);
  });

  it("blocks unauthorized minting and spending", async () => {
    const token = await deploy();
    const [, player, attacker] = await ethers.getSigners();

    const gameMasterRole = await token.GAME_MASTER_ROLE();

    await expect(
      token.connect(attacker).mintTo(player.address, 100n)
    )
      .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
      .withArgs(attacker.address, gameMasterRole);

    await token.mintTo(player.address, 100n);

    await expect(
      token.connect(attacker).spend(player.address, 10n)
    )
      .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
      .withArgs(attacker.address, gameMasterRole);

    await expect(token.spend(player.address, 200n))
      .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
      .withArgs(player.address, 100n, 200n);
  });
});
