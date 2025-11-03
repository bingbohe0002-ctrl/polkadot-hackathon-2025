import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Polkadot Hub TestNet Configuration
const polkadotHubTestnet = {
  id: 420420422,
  name: 'Polkadot Hub TestNet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'PAS',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
};

const transport = http('https://testnet-passet-hub-eth-rpc.polkadot.io');

const createProvider = () => {
  return createPublicClient({
    chain: polkadotHubTestnet,
    transport,
  });
};

const createWallet = (privateKey) => {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: polkadotHubTestnet,
    transport,
  });
};

const getAbi = (contractName) => {
  try {
    const abiPath = join(__dirname, '../src/contracts', `${contractName}.json`);
    return JSON.parse(readFileSync(abiPath, 'utf8'));
  } catch (error) {
    console.error(`Could not find ABI for contract ${contractName}:`, error.message);
    throw error;
  }
};

const getBytecode = (contractName) => {
  try {
    const bytecodePath = join(__dirname, '../src/contracts', `${contractName}.polkavm`);
    return `0x${readFileSync(bytecodePath).toString('hex')}`;
  } catch (error) {
    console.error(`Could not find bytecode for contract ${contractName}:`, error.message);
    throw error;
  }
};

const deployContract = async (contractName, privateKey) => {
  console.log(`\nDeploying ${contractName} to Polkadot Hub TestNet...`);

  try {
    // Create provider and wallet
    const provider = createProvider();
    const wallet = createWallet(privateKey);

    console.log(`Deploying from address: ${wallet.account.address}`);

    // Get contract artifacts
    const abi = getAbi(contractName);
    const bytecode = getBytecode(contractName);

    // Deploy contract
    const hash = await wallet.deployContract({
      abi,
      bytecode,
      args: [],
    });

    console.log(`Transaction hash: ${hash}`);
    console.log('Waiting for confirmation...');

    // Wait for deployment
    const receipt = await provider.waitForTransactionReceipt({ hash });
    const contractAddress = receipt.contractAddress;

    console.log(`\n✓ Contract ${contractName} deployed successfully!`);
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Block number: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed}`);

    // Save deployment info
    const deploymentDir = join(__dirname, '../src/contracts');
    if (!existsSync(deploymentDir)) {
      mkdirSync(deploymentDir, { recursive: true });
    }

    // Return deployment info instead of saving to single file
    return {
      contractName,
      address: contractAddress,
      network: 'Polkadot Hub TestNet',
      chainId: polkadotHubTestnet.id,
      deployedAt: new Date().toISOString(),
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error(`\n✗ Failed to deploy contract ${contractName}:`, error);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  // Check for private key in environment variable
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('\n✗ Error: PRIVATE_KEY environment variable is not set');
    console.log('\nUsage:');
    console.log('  PRIVATE_KEY=0x... npm run deploy');
    console.log('\nMake sure your wallet has PAS tokens for gas fees.');
    console.log('Get test tokens from: https://faucet.polkadot.io/?parachain=1111');
    process.exit(1);
  }

  // Deploy all contracts
  const contracts = ['PulseChat', 'PulseGroups', 'PulseChannels', 'PulseFriends', 'PulsePrivateMessages', 'PulseAI'];
  const deployments = {};

  for (const contractName of contracts) {
    const deploymentInfo = await deployContract(contractName, privateKey);
    deployments[contractName] = deploymentInfo;
  }

  // Save all deployment info to a single file
  const deploymentDir = join(__dirname, '../src/contracts');
  if (!existsSync(deploymentDir)) {
    mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = join(deploymentDir, 'deployment.json');
  writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2), 'utf8');
  console.log(`\n✓ All deployment info saved to ${deploymentFile}`);

  console.log('\n📋 Deployment Summary:');
  for (const [name, info] of Object.entries(deployments)) {
    console.log(`  ${name}: ${info.address}`);
  }
};

main();

