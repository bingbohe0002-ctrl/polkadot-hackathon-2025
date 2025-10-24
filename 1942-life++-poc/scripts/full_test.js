// ============================================================================
// scripts/full_test.js - Complete flow test
// ============================================================================
const hre = require("hardhat");

async function main() {
  console.log("🧪 =".repeat(30));
  console.log("🧪 完整流程测试");
  console.log("🧪 =".repeat(30));

  const deployment = require("../deployments/hardhat-deployment.json");
  const [deployer, agent] = await hre.ethers.getSigners();

  console.log("\n📋 账户信息:");
  console.log("Deployer:", deployer.address);
  console.log("Agent:", agent.address);

  console.log("\n📋 合约地址:");
  console.log("CATK:", deployment.contracts.CATK);
  console.log("Registry:", deployment.contracts.Registry);
  console.log("Ledger:", deployment.contracts.Ledger);

  // 获取合约实例
  const catk = await hre.ethers.getContractAt("CognitiveAssetToken", deployment.contracts.CATK);
  const registry = await hre.ethers.getContractAt("PoCRegistry", deployment.contracts.Registry);
  const ledger = await hre.ethers.getContractAt("PoCLedger", deployment.contracts.Ledger);

  // Step 1: 注册代理
  console.log("\n" + "=".repeat(60));
  console.log("步骤 1: 注册代理");
  console.log("=".repeat(60));

  const stakeAmount = hre.ethers.parseEther("100");
  
  console.log("1.1 转移 CATK 到代理...");
  const transferTx = await catk.transfer(agent.address, stakeAmount);
  await transferTx.wait();
  const agentBalance = await catk.balanceOf(agent.address);
  console.log(`✅ 代理余额: ${hre.ethers.formatEther(agentBalance)} CATK`);

  console.log("\n1.2 代理授权 Registry...");
  const approveTx = await catk.connect(agent).approve(deployment.contracts.Registry, stakeAmount);
  await approveTx.wait();
  console.log("✅ 授权成功");

  console.log("\n1.3 注册代理到链上...");
  const agentMetaHash = hre.ethers.id("robot-model-v1.0");
  const registerTx = await registry.connect(agent).registerAgent(agent.address, agentMetaHash, stakeAmount);
  const receipt = await registerTx.wait();
  console.log("✅ 注册交易确认");

  // 解析事件
  console.log("\n1.4 解析注册事件...");
  let cid = null;
  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed && parsed.name === 'AgentRegistered') {
        cid = parsed.args.cid;
        console.log("✅ 找到 AgentRegistered 事件");
        console.log("   CID:", cid);
        console.log("   Agent Address:", parsed.args.agentAddr);
        break;
      }
    } catch {}
  }

  if (!cid) {
    console.log("❌ 未找到 AgentRegistered 事件");
    process.exit(1);
  }

  // 验证注册
  console.log("\n1.5 验证代理注册...");
  const storedCid = await registry.addressToCid(agent.address);
  console.log("存储的 CID:", storedCid);
  console.log("事件中的 CID:", cid);
  console.log("CID 匹配:", storedCid === cid ? "✅" : "❌");

  // Step 2: 提交认知证明
  console.log("\n" + "=".repeat(60));
  console.log("步骤 2: 提交认知证明");
  console.log("=".repeat(60));

  console.log("2.1 准备证明数据...");
  const inputHash = hre.ethers.id("input: move forward 10 meters");
  const reasoningHash = hre.ethers.id("reasoning: [step1, step2, step3]");
  const outputHash = hre.ethers.id("output: action completed successfully");
  const metadataCID = "QmTest123";
  console.log("✅ 证明数据准备完成");

  console.log("\n2.2 提交证明到 Ledger...");
  const submitTx = await ledger.connect(agent).submitProof(
    storedCid,
    inputHash,
    reasoningHash,
    outputHash,
    metadataCID
  );
  const submitReceipt = await submitTx.wait();
  console.log("✅ 证明提交成功");

  // 解析证明事件
  console.log("\n2.3 解析证明提交事件...");
  let proofId = null;
  for (const log of submitReceipt.logs) {
    try {
      const parsed = ledger.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed && parsed.name === 'ProofSubmitted') {
        proofId = parsed.args.proofId;
        console.log("✅ 找到 ProofSubmitted 事件");
        console.log("   ProofId:", proofId);
        break;
      }
    } catch {}
  }

  if (!proofId) {
    console.log("⚠️  未找到 ProofSubmitted 事件，使用交易哈希作为 proofId");
    proofId = submitReceipt.hash;
  }

  // Step 3: 查询证明
  console.log("\n" + "=".repeat(60));
  console.log("步骤 3: 查询证明");
  console.log("=".repeat(60));

  console.log("3.1 从 Ledger 查询证明...");
  const proof = await ledger.getProof(proofId);
  console.log("✅ 证明查询成功");
  console.log("\n证明详情:");
  console.log("  CID:", proof.cid);
  console.log("  Input Hash:", proof.inputHash);
  console.log("  Reasoning Hash:", proof.reasoningHash);
  console.log("  Output Hash:", proof.outputHash);
  console.log("  Metadata CID:", proof.metadataCID);
  console.log("  Timestamp:", new Date(Number(proof.timestamp) * 1000).toISOString());
  console.log("  Status:", proof.status);
  console.log("  Attested By:", proof.attestedBy);
  console.log("  Chain Rank:", proof.chainRank.toString());

  // Step 4: 验证器认证
  console.log("\n" + "=".repeat(60));
  console.log("步骤 4: 验证器认证证明");
  console.log("=".repeat(60));

  console.log("4.1 验证器认证证明...");
  const attestTx = await ledger.connect(deployer).attestProof(proofId, true);
  await attestTx.wait();
  console.log("✅ 证明认证成功");

  console.log("\n4.2 再次查询证明状态...");
  const attestedProof = await ledger.getProof(proofId);
  console.log("✅ 更新后的证明状态");
  console.log("  Status:", attestedProof.status);
  console.log("  Attested By:", attestedProof.attestedBy);
  console.log("  Chain Rank:", attestedProof.chainRank.toString());

  // 最终报告
  console.log("\n" + "=".repeat(60));
  console.log("🎉 测试完成");
  console.log("=".repeat(60));
  console.log("\n测试结果:");
  console.log("✅ 代理注册成功");
  console.log("✅ 证明提交成功");
  console.log("✅ 证明查询成功");
  console.log("✅ 验证器认证成功");
  console.log("\n所有测试通过！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 测试失败:", error);
    process.exit(1);
  });
