import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("WorbooModule", (m) => {
  const deployer = m.getAccount(0);

  const registry = m.contract("WorbooRegistry");
  const token = m.contract("WorbooToken");
  const shop = m.contract("WorbooShop", [token, "ipfs://worboo-metadata/{id}.json", deployer]);

  const gameMasterRole = m.staticCall(token, "GAME_MASTER_ROLE", []);
  const itemManagerRole = m.staticCall(shop, "ITEM_MANAGER_ROLE", []);

  m.call(token, "grantRole", [gameMasterRole, shop]);
  m.call(shop, "grantRole", [itemManagerRole, deployer]);

  return {
    registry,
    token,
    shop,
  };
});
