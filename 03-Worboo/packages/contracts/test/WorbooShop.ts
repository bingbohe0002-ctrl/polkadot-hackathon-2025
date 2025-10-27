import { expect } from "chai";
import { ethers } from "hardhat";

describe("WorbooShop", () => {
  async function deploySuite() {
    const [deployer, player, outsider] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("WorbooToken");
    const token = await tokenFactory.deploy();
    await token.waitForDeployment();

    const shopFactory = await ethers.getContractFactory("WorbooShop");
    const shop = await shopFactory.deploy(
      await token.getAddress(),
      "https://example.com/{id}.json",
      deployer.address
    );
    await shop.waitForDeployment();

    return { deployer, player, outsider, token, shop };
  }

  it("allows admins to configure items", async () => {
    const { deployer, outsider, shop } = await deploySuite();

    await expect(shop.connect(deployer).setItemConfig(1, 50n, true))
      .to.emit(shop, "ItemConfigured")
      .withArgs(1, 50n, true);

    const config = await shop.getItemConfig(1);
    expect(config.price).to.equal(50n);
    expect(config.active).to.equal(true);

    const itemManagerRole = await shop.ITEM_MANAGER_ROLE();
    await expect(
      shop.connect(outsider).setItemConfig(2, 10n, true)
    )
      .to.be.revertedWithCustomError(shop, "AccessControlUnauthorizedAccount")
      .withArgs(outsider.address, itemManagerRole);
  });

  it("processes purchases by burning WorbooToken", async () => {
    const { deployer, player, token, shop } = await deploySuite();
    const gameMasterRole = await token.GAME_MASTER_ROLE();
    await token.grantRole(gameMasterRole, await shop.getAddress());

    await shop.connect(deployer).setItemConfig(1, 25n, true);
    await token.mintTo(player.address, 100n);

    await expect(shop.connect(player).purchase(1, 2))
      .to.emit(shop, "TransferSingle")
      .withArgs(player.address, ethers.ZeroAddress, player.address, 1, 2);

    expect(await token.balanceOf(player.address)).to.equal(50n);
    expect(await shop.balanceOf(player.address, 1)).to.equal(2n);
  });

  it("validates item availability and user balances", async () => {
    const { deployer, player, token, shop } = await deploySuite();
    const gameMasterRole = await token.GAME_MASTER_ROLE();
    await token.grantRole(gameMasterRole, await shop.getAddress());

    await expect(shop.connect(player).purchase(1, 1)).to.be.revertedWith(
      "InactiveItem"
    );

    await shop.connect(deployer).setItemConfig(1, 25n, true);
    await token.mintTo(player.address, 10n);

    await expect(shop.connect(player).purchase(1, 1))
      .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
      .withArgs(player.address, 10n, 25n);

    await expect(shop.connect(player).purchase(1, 0)).to.be.revertedWith(
      "InvalidQuantity"
    );
  });
});
