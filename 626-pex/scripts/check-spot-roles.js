const hre = require("hardhat");
const { ethers, deployments, getNamedAccounts } = hre;

async function main() {
  const { admin, deployer } = await getNamedAccounts();
  const spot = await deployments.get("SpotMarket");
  const sm = await ethers.getContractAt("SpotMarket", spot.address);
  const GOV = await sm.GOVERNOR_ROLE();
  const ADM = await sm.DEFAULT_ADMIN_ROLE();
  const hasGovAdmin = await sm.hasRole(GOV, admin);
  const hasGovDeployer = await sm.hasRole(GOV, deployer);
  const hasAdminAdmin = await sm.hasRole(ADM, admin);
  const hasAdminDeployer = await sm.hasRole(ADM, deployer);
  console.log("SpotMarket:", spot.address);
  console.log("GOVERNOR_ROLE:", GOV);
  console.log("DEFAULT_ADMIN_ROLE:", ADM);
  console.log("admin has GOVERNOR?", hasGovAdmin);
  console.log("deployer has GOVERNOR?", hasGovDeployer);
  console.log("admin has DEFAULT_ADMIN?", hasAdminAdmin);
  console.log("deployer has DEFAULT_ADMIN?", hasAdminDeployer);
}

main().catch((e) => { console.error(e); process.exit(1); });