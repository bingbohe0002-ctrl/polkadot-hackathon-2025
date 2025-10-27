const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

function getDeployment(name) {
  const p = path.join(__dirname, `../deployments/localhost/${name}.json`);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  return j.address;
}

async function main() {
  const [deployer, trader] = await ethers.getSigners();
  const vaultAddr = getDeployment("MarginVault");
  const usdcAddr = getDeployment("MockERC20");
  const perpAddr = getDeployment("PerpMarket");

  const codeUsdc = await ethers.provider.getCode(usdcAddr);
  const codeVault = await ethers.provider.getCode(vaultAddr);
  const codePerp = await ethers.provider.getCode(perpAddr);
  console.log("USDC bytecode len:", codeUsdc.length, usdcAddr);
  console.log("Vault bytecode len:", codeVault.length, vaultAddr);
  console.log("Perp bytecode len:", codePerp.length, perpAddr);

  if (codeUsdc === "0x") {
    console.log("Warning: USDC not found at deployments address; falling back to frontend deployed.json tokens.usdc");
    const frontendPath = path.join(__dirname, "../frontend/src/lib/contracts/deployed.json");
    const f = JSON.parse(fs.readFileSync(frontendPath, "utf8"));
    if (f.tokens && f.tokens.usdc) {
      console.log("Frontend tokens.usdc:", f.tokens.usdc);
      const codeFront = await ethers.provider.getCode(f.tokens.usdc);
      console.log("Frontend USDC code len:", codeFront.length);
      if (codeFront !== "0x") {
        usdcAddr = f.tokens.usdc;
      } else {
        throw new Error("No valid USDC contract on chain");
      }
    } else {
      throw new Error("Frontend deployed.json missing tokens.usdc");
    }
  }

  const vault = await ethers.getContractAt("MarginVault", vaultAddr);
  const usdc = await ethers.getContractAt("MockERC20", usdcAddr);

  console.log("Deployer:", deployer.address);
  console.log("Trader:", trader.address);
  console.log("Vault:", vaultAddr);
  console.log("USDC:", usdcAddr);

  const mintAmt = ethers.parseUnits("1000", 6);
  const bal = await usdc.balanceOf(trader.address);
  if (bal < mintAmt) {
    console.log("Minting USDC to trader...");
    const txMint = await usdc.connect(deployer).mint(trader.address, mintAmt);
    await txMint.wait();
  }

  const approveTx = await usdc.connect(trader).approve(vault.target, mintAmt);
  await approveTx.wait();
  const depTx = await vault.connect(trader).deposit(usdc.target, mintAmt);
  await depTx.wait();

  let info = await vault.getAccountInfo(trader.address);
  const beforeAvail = info[3];
  console.log("Available before:", ethers.formatUnits(beforeAvail, 6), "USDC");

  const allocAmt = ethers.parseUnits("100", 6);
  const mode = 0; // ISOLATED
  const allocTx = await vault.connect(deployer).allocateMargin(trader.address, 1, allocAmt, mode);
  await allocTx.wait();

  info = await vault.getAccountInfo(trader.address);
  const afterAvail = info[3];
  console.log("Available after:", ethers.formatUnits(afterAvail, 6), "USDC");

  const diff = beforeAvail - afterAvail;
  console.log("Delta:", ethers.formatUnits(diff, 6), "USDC");

  const marketMargin = await vault.getMarketMargin(trader.address, 1);
  console.log("Market 1 margin:", ethers.formatUnits(marketMargin, 6), "USDC");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});