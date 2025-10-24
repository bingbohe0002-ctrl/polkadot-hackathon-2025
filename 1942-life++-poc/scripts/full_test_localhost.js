const hre = require("hardhat");

async function main() {
  console.log("🧪 完整流程测试 - Localhost");
  console.log("=".repeat(60));

  const deployment = require("../deployments/localhost-deployment.json");
  const [deployer, agent] = await hre.ethers.getSigners();

  console.log("\n📋 环境信息:");
  console.log("Network:", deployment.network);
  console.log("Deployer:", deployer.address);
  console.log("Agent:", agent.address);

  // 获取合约实例
  const catk = await hre.ethers.getContractAt("CognitiveAssetToken", deployment.contracts.CATK);
  const registry = await hre.ethers.getContractAt("PoCRegistry", deployment.contracts.Registry);
  const ledger = await hre.ethers.getContractAt("PoCLedger", deployment.contracts.Ledger);

  // 步骤 1: 注册代理
  console.log("\n" + "=".repeat(60));
  console.log("步骤 1: 注册代理");
  console.log("=".repeat(60));

  const stakeAmount = hre.ethers.parseEther("100");
  
  console.log("1.1 转移 CATK 到代理...");
  await (await catk.transfer(agent.address, stakeAmount)).wait();
  console.log("✅ CATK 已转移");

  console.log("\n1.2 代理授权 Registry...");
  await (await catk.connect(agent).approve(deployment.contracts.Registry, stakeAmount)).wait();
  console.log("✅ 授权完成");

  console.log("\n1.3 注册代理...");
  const agentMetaHash = hre.ethers.id("robot-model-v1.0");
  const registerTx = await registry.connect(agent).registerAgent(agent.address, agentMetaHash, stakeAmount);
  const receipt = await registerTx.wait();
  console.log("✅ 代理已注册");

  // 从事件获取 CID
  let cid = null;
  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed && parsed.name === 'AgentRegistered') {
        cid = parsed.args.cid;
        console.log("   CID:", cid);
        break;
      }
    } catch {}
  }

  // 步骤 2: 提交认知证明
  console.log("\n" + "=".repeat(60));
  console.log("步骤 2: 提交认知证明");
  console.log("=".repeat(60));

  const inputHash = hre.ethers.id("input: move forward 10 meters");
  const reasoningHash = hre.ethers.id("reasoning: [step1, step2, step3]");
  const outputHash = hre.ethers.id("output: action completed successfully");
  const metadataCID = "QmTest123";

  console.log("2.1 提交证明...");
  const submitTx = await ledger.connect(agent).submitProof(cid, inputHash, reasoningHash, outputHash, metadataCID);
  const submitReceipt = await submitTx.wait();
  console.log("✅ 证明已提交");

  // 获取 proofId
  let proofId = null;
  for (const log of submitReceipt.logs) {
    try {
      const parsed = ledger.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed && parsed.name === 'ProofSubmitted') {
        proofId = parsed.args.proofId;
        console.log("   ProofId:", proofId);
        break;
      }
    } catch {}
  }

  // 步骤 3: 验证器认证
  console.log("\n" + "=".repeat(60));
  console.log("步骤 3: 验证器认证");
  console.log("=".repeat(60));

  console.log("3.1 验证器认证证明...");
  await (await ledger.connect(deployer).attestProof(proofId, true)).wait();
  console.log("✅ 认证完成");

  // 步骤 4: 查询证明
  console.log("\n" + "=".repeat(60));
  console.log("步骤 4: 查询证明");
  console.log("=".repeat(60));

  console.log("4.1 查询证明详情...");
  const proof = await ledger.getProof(proofId);
  console.log("✅ 证明查询成功\n");
  console.log("证明详情:");
  console.log("  CID:", proof.cid);
  console.log("  Metadata CID:", proof.metadataCID);
  console.log("  Timestamp:", new Date(Number(proof.timestamp) * 1000).toISOString());
  console.log("  Status:", proof.status);
  console.log("  Attested By:", proof.attestedBy);
  console.log("  Chain Rank:", proof.chainRank.toString());

  console.log("\n" + "=".repeat(60));
  console.log("🎉 所有测试通过！");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 测试失败:", error);
    process.exit(1);
  });
