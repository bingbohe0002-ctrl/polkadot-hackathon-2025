const hre = require("hardhat");

async function main() {
  console.log("🔍 验证数据生成和存储");
  console.log("=".repeat(60));

  const deployment = require("../deployments/localhost-deployment.json");
  const ledger = await hre.ethers.getContractAt("PoCLedger", deployment.contracts.Ledger);
  const registry = await hre.ethers.getContractAt("PoCRegistry", deployment.contracts.Registry);

  // 检查提交的证明
  const proofId = "0x7011690b3a7d21634b7b41da8a493e5bf94dca6ed9dc3e8e8c0527de8640d472";
  
  console.log("\n1️⃣ 查询链上证明数据...");
  const proof = await ledger.getProof(proofId);
  console.log("✅ 证明数据查询成功\n");
  console.log("证明详情:");
  console.log("  ProofId:", proofId);
  console.log("  CID:", proof.cid);
  console.log("  Input Hash:", proof.inputHash);
  console.log("  Reasoning Hash:", proof.reasoningHash);
  console.log("  Output Hash:", proof.outputHash);
  console.log("  Metadata CID:", proof.metadataCID);
  console.log("  Timestamp:", new Date(Number(proof.timestamp) * 1000).toISOString());
  console.log("  Status:", proof.status);
  console.log("  Attested By:", proof.attestedBy);
  console.log("  Chain Rank:", proof.chainRank.toString());

  // 检查代理注册
  const agentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log("\n2️⃣ 查询代理注册数据...");
  const cid = await registry.addressToCid(agentAddress);
  console.log("✅ 代理数据查询成功\n");
  console.log("代理详情:");
  console.log("  Agent Address:", agentAddress);
  console.log("  CID:", cid);

  console.log("\n" + "=".repeat(60));
  console.log("✅ 数据验证完成");
  console.log("=".repeat(60));
}

main();
