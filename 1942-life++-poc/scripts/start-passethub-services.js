// ============================================================================
// scripts/start-passethub-services.js - Start services for PassetHub testnet
// ============================================================================
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: '.env.passetHub' });

console.log('🚀 Starting Life++ PoC services for PassetHub testnet...\n');

// Check if environment file exists
const fs = require('fs');
const envPath = '.env.passetHub';
if (!fs.existsSync(envPath)) {
  console.log('❌ Environment file not found: .env.passetHub');
  console.log('💡 Please copy env.passetHub.example to .env.passetHub and configure it');
  process.exit(1);
}

// Start AHIN Indexer
console.log('📡 Starting AHIN Indexer...');
const indexer = spawn('npm', ['run', 'indexer:start'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'passetHub' }
});

indexer.on('error', (err) => {
  console.error('❌ Failed to start AHIN Indexer:', err);
});

// Start Validator Daemon
console.log('🔍 Starting Validator Daemon...');
const validator = spawn('npm', ['run', 'validator:start'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'passetHub' }
});

validator.on('error', (err) => {
  console.error('❌ Failed to start Validator Daemon:', err);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  indexer.kill('SIGINT');
  validator.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down services...');
  indexer.kill('SIGTERM');
  validator.kill('SIGTERM');
  process.exit(0);
});

console.log('\n✅ Services started successfully!');
console.log('📋 AHIN Indexer: http://localhost:3000');
console.log('🔍 Validator Daemon: Running in background');
console.log('\n💡 Press Ctrl+C to stop all services');
