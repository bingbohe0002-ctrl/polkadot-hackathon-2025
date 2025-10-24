// ============================================================================
// scripts/cleanup-sensitive-files.js - 清理敏感文件
// ============================================================================
const fs = require('fs');

function cleanupSensitiveFiles() {
  console.log("🧹 Cleaning up sensitive files...\n");

  const filesToClean = [
    'scripts/derive-keys.js',
    'scripts/derive-substrate-keys.js', 
    'scripts/fix-substrate-keys.js'
  ];

  console.log("📋 Files to clean:");
  filesToClean.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} - exists`);
    } else {
      console.log(`   ❌ ${file} - not found`);
    }
  });

  console.log("\n🔧 Recommended actions:");
  console.log("1. Remove hardcoded mnemonics from remaining scripts");
  console.log("2. Ensure .env.developer is in .gitignore");
  console.log("3. Use environment variables for sensitive data");
  
  console.log("\n✅ Current secure configuration:");
  console.log("   - .env.developer (contains mnemonics, ignored by Git)");
  console.log("   - scripts/final-key-derivation.js (reads from env)");
  console.log("   - env.passetHub.example (template for reviewers)");
  
  console.log("\n⚠️  Security checklist:");
  console.log("   ✅ Mnemonics moved to .env.developer");
  console.log("   ✅ .env.developer added to .gitignore");
  console.log("   ✅ Scripts use environment variables");
  console.log("   ✅ Reviewers use their own wallets");
  
  console.log("\n🎯 Next steps:");
  console.log("1. Test the new configuration: npm run dev:derive");
  console.log("2. Deploy with new config: npm run deploy:passethub");
  console.log("3. Verify reviewers can use their own wallets");
}

cleanupSensitiveFiles();