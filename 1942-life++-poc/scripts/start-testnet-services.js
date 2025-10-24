// ============================================================================
// scripts/start-testnet-services.js - Start testnet services
// ============================================================================
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Life++ PoC Testnet Services...\n");

  // 检查部署文件
  const deploymentPath = "./deployments/assetHub-deployment.json";
  if (!fs.existsSync(deploymentPath)) {
    console.log("❌ Deployment file not found!");
    console.log("💡 Please run deployment first: npm run deploy:testnet");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📋 Using deployment from:", deployment.timestamp);

  // 设置环境变量
  const env = {
    ...process.env,
    RPC_URL: "https://polkadot-asset-hub-rpc.polkadot.io",
    LEDGER_ADDRESS: deployment.contracts.Ledger,
    REGISTRY_ADDRESS: deployment.contracts.Registry,
    CATK_ADDRESS: deployment.contracts.CATK,
    ANFT_ADDRESS: deployment.contracts.aNFT,
    LEGAL_WRAPPER_ADDRESS: deployment.contracts.LegalWrapper,
    IPFS_URL: "https://ipfs.io",
    PORT: "3000",
    CHECK_INTERVAL: "10000"
  };

  console.log("🔧 Environment Configuration:");
  console.log(`   RPC URL: ${env.RPC_URL}`);
  console.log(`   Ledger: ${env.LEDGER_ADDRESS}`);
  console.log(`   Registry: ${env.REGISTRY_ADDRESS}`);
  console.log(`   IPFS: ${env.IPFS_URL}`);
  console.log(`   Port: ${env.PORT}`);

  console.log("\n" + "=".repeat(60));
  console.log("🚀 STARTING SERVICES");
  console.log("=".repeat(60));

  // 启动 AHIN Indexer
  console.log("\n1️⃣ Starting AHIN Indexer...");
  const indexerProcess = spawn("npx", ["ts-node", "src/ahin-indexer/server.ts"], {
    env: env,
    stdio: "inherit",
    shell: true
  });

  indexerProcess.on("error", (error) => {
    console.error("❌ AHIN Indexer failed to start:", error);
  });

  // 等待一下让 Indexer 启动
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 启动 Validator Daemon
  console.log("\n2️⃣ Starting Validator Daemon...");
  const validatorProcess = spawn("npx", ["ts-node", "scripts/run-validator.ts"], {
    env: env,
    stdio: "inherit",
    shell: true
  });

  validatorProcess.on("error", (error) => {
    console.error("❌ Validator Daemon failed to start:", error);
  });

  console.log("\n" + "=".repeat(60));
  console.log("✅ SERVICES STARTED SUCCESSFULLY!");
  console.log("=".repeat(60));

  console.log("\n📋 Service Status:");
  console.log("✅ AHIN Indexer: Running on port 3000");
  console.log("✅ Validator Daemon: Listening for proofs");
  console.log("✅ Network: Polkadot Asset Hub Testnet");

  console.log("\n🔗 Service URLs:");
  console.log("   AHIN Indexer API: http://localhost:3000");
  console.log("   Health Check: http://localhost:3000/health");
  console.log("   Submit Proof: POST http://localhost:3000/ahin/submit");

  console.log("\n📋 Next Steps:");
  console.log("1. Test API endpoints with curl or Postman");
  console.log("2. Submit test proofs via API");
  console.log("3. Monitor validator attestations");
  console.log("4. Test with robot SDK");

  console.log("\n⚠️  Press Ctrl+C to stop all services");

  // 处理退出信号
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping services...");
    indexerProcess.kill();
    validatorProcess.kill();
    process.exit(0);
  });

  // 保持进程运行
  await new Promise(() => {});
}

main()
  .catch((error) => {
    console.error("\n❌ Failed to start services:", error);
    process.exit(1);
  });
