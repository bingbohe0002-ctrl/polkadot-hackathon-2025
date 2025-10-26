const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 DeciCourt 合约交互测试");
    console.log("=".repeat(50));

    // 合约地址
    const juryTokenAddress = "0x07eB8A200793Ec7055ADD629C926cE6c65DC68Ac";
    const deciCourtAddress = "0x1A327ff18EF54eCF1B0AE4F885B78eCcF00A003E";

    // 获取签名者
    const [deployer] = await ethers.getSigners();
    console.log(`部署账户: ${deployer.address}`);
    console.log(`账户余额: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} PAS`);

    // 连接合约
    const JuryToken = await ethers.getContractFactory("JuryToken");
    const DeciCourt = await ethers.getContractFactory("DeciCourt");
    
    const juryToken = JuryToken.attach(juryTokenAddress);
    const deciCourt = DeciCourt.attach(deciCourtAddress);

    console.log("\n📊 合约信息:");
    
    // JuryToken 信息
    console.log("--- JuryToken 信息 ---");
    try {
        const tokenName = await juryToken.name();
        const tokenSymbol = await juryToken.symbol();
        const tokenDecimals = await juryToken.decimals();
        const tokenSupply = await juryToken.totalSupply();
        const deployerBalance = await juryToken.balanceOf(deployer.address);
        
        console.log(`名称: ${tokenName}`);
        console.log(`符号: ${tokenSymbol}`);
        console.log(`小数位: ${tokenDecimals}`);
        console.log(`总供应量: ${ethers.formatEther(tokenSupply)} ${tokenSymbol}`);
        console.log(`部署者余额: ${ethers.formatEther(deployerBalance)} ${tokenSymbol}`);
    } catch (error) {
        console.log(`❌ 读取 Token 信息失败: ${error.message}`);
    }

    // DeciCourt 信息
    console.log("\n--- DeciCourt 信息 ---");
    try {
        const filingFee = await deciCourt.filingFeeAmount();
        const jurorStake = await deciCourt.jurorStakeAmount();
        const jurySize = await deciCourt.jurySize();
        const nextCaseId = await deciCourt.nextCaseId();
        
        console.log(`立案费: ${ethers.formatEther(filingFee)} JURY`);
        console.log(`陪审员质押: ${ethers.formatEther(jurorStake)} JURY`);
        console.log(`陪审团大小: ${jurySize}`);
        console.log(`下一个案件ID: ${nextCaseId}`);
    } catch (error) {
        console.log(`❌ 读取 DeciCourt 信息失败: ${error.message}`);
    }

    console.log("\n✅ 合约部署和基本功能测试完成！");
    console.log("\n🔗 合约地址:");
    console.log(`JuryToken: ${juryTokenAddress}`);
    console.log(`DeciCourt: ${deciCourtAddress}`);
    console.log(`\n🌐 区块浏览器: https://blockscout-passet-hub.parity-testnet.parity.io/`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 脚本执行失败:", error);
        process.exit(1);
    });