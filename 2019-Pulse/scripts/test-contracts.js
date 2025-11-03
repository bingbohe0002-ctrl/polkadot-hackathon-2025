import { readFileSync } from 'fs';
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
  const abiPath = join(__dirname, '../src/contracts', `${contractName}.json`);
  return JSON.parse(readFileSync(abiPath, 'utf8'));
};

const getDeployment = () => {
  const deploymentPath = join(__dirname, '../src/contracts/deployment.json');
  return JSON.parse(readFileSync(deploymentPath, 'utf8'));
};

// Main test function
const main = async () => {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('\n✗ Error: PRIVATE_KEY environment variable is not set');
    console.log('Usage:');
    console.log('  PRIVATE_KEY=0x... npm run test:contracts');
    process.exit(1);
  }

  const provider = createProvider();
  const wallet = createWallet(privateKey);
  const deployment = getDeployment();

  console.log('\n🧪 Testing Pulse Contracts');
  console.log('='.repeat(50));
  console.log(`Account: ${wallet.account.address}\n`);

  // Test 1: Register User
  console.log('📝 Test 1: Register User');
  try {
    const pulseChatABI = getAbi('PulseChat');
    const pulseChatAddress = deployment.PulseChat.address;

    const { request } = await provider.simulateContract({
      address: pulseChatAddress,
      abi: pulseChatABI,
      functionName: 'registerUser',
      args: ['TestUser', 'Hello from test!', 'https://avatar.example.com/test.png'],
      account: wallet.account,
    });

    const hash = await wallet.writeContract(request);
    console.log(`  Transaction hash: ${hash}`);
    
    const receipt = await provider.waitForTransactionReceipt({ hash });
    console.log(`  ✅ User registered successfully! Block: ${receipt.blockNumber}\n`);
  } catch (error) {
    console.log(`  ⚠️  User might already be registered or error: ${error.message}\n`);
  }

  // Test 2: Create Group
  console.log('👥 Test 2: Create Group');
  try {
    const pulseGroupsABI = getAbi('PulseGroups');
    const pulseGroupsAddress = deployment.PulseGroups.address;

    const { request } = await provider.simulateContract({
      address: pulseGroupsAddress,
      abi: pulseGroupsABI,
      functionName: 'createGroup',
      args: ['Test Group'],
      account: wallet.account,
    });

    const hash = await wallet.writeContract(request);
    console.log(`  Transaction hash: ${hash}`);
    
    const receipt = await provider.waitForTransactionReceipt({ hash });
    
    // Get groupId from event
    const log = receipt.logs.find(log => {
      try {
        const decoded = provider.decodeEventLog({
          abi: pulseGroupsABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'GroupCreated';
      } catch {
        return false;
      }
    });

    if (log) {
      const decoded = provider.decodeEventLog({
        abi: pulseGroupsABI,
        data: log.data,
        topics: log.topics,
      });
      console.log(`  ✅ Group created successfully! Group ID: ${decoded.args.groupId}\n`);
    } else {
      console.log(`  ✅ Group created successfully! Block: ${receipt.blockNumber}\n`);
    }
  } catch (error) {
    console.log(`  ❌ Error creating group: ${error.message}\n`);
  }

  // Test 3: Create Channel
  console.log('📢 Test 3: Create Channel');
  try {
    const pulseChannelsABI = getAbi('PulseChannels');
    const pulseChannelsAddress = deployment.PulseChannels.address;

    const { request } = await provider.simulateContract({
      address: pulseChannelsAddress,
      abi: pulseChannelsABI,
      functionName: 'createChannel',
      args: ['Test Channel'],
      account: wallet.account,
    });

    const hash = await wallet.writeContract(request);
    console.log(`  Transaction hash: ${hash}`);
    
    const receipt = await provider.waitForTransactionReceipt({ hash });
    
    // Get channelId from event
    const log = receipt.logs.find(log => {
      try {
        const decoded = provider.decodeEventLog({
          abi: pulseChannelsABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'ChannelCreated';
      } catch {
        return false;
      }
    });

    if (log) {
      const decoded = provider.decodeEventLog({
        abi: pulseChannelsABI,
        data: log.data,
        topics: log.topics,
      });
      console.log(`  ✅ Channel created successfully! Channel ID: ${decoded.args.channelId}\n`);
    } else {
      console.log(`  ✅ Channel created successfully! Block: ${receipt.blockNumber}\n`);
    }
  } catch (error) {
    console.log(`  ❌ Error creating channel: ${error.message}\n`);
  }

  // Test 4: Add Friend (using a test address)
  console.log('👤 Test 4: Add Friend');
  try {
    const pulseFriendsABI = getAbi('PulseFriends');
    const pulseFriendsAddress = deployment.PulseFriends.address;
    const testFriendAddress = '0x5a56f381c602aA9b6a223Bd5dF54cb4ea868533c'; // Example address

    const { request } = await provider.simulateContract({
      address: pulseFriendsAddress,
      abi: pulseFriendsABI,
      functionName: 'addFriend',
      args: [testFriendAddress],
      account: wallet.account,
    });

    const hash = await wallet.writeContract(request);
    console.log(`  Transaction hash: ${hash}`);
    
    const receipt = await provider.waitForTransactionReceipt({ hash });
    console.log(`  ✅ Friend added successfully! Block: ${receipt.blockNumber}\n`);
  } catch (error) {
    console.log(`  ⚠️  Friend might already be added or error: ${error.message}\n`);
  }

  // Test 5: Send Global Message
  console.log('💬 Test 5: Send Global Message');
  try {
    const pulseChatABI = getAbi('PulseChat');
    const pulseChatAddress = deployment.PulseChat.address;

    const { request } = await provider.simulateContract({
      address: pulseChatAddress,
      abi: pulseChatABI,
      functionName: 'sendMessage',
      args: ['Hello from automated test! 🎉'],
      account: wallet.account,
    });

    const hash = await wallet.writeContract(request);
    console.log(`  Transaction hash: ${hash}`);
    
    const receipt = await provider.waitForTransactionReceipt({ hash });
    console.log(`  ✅ Message sent successfully! Block: ${receipt.blockNumber}\n`);
  } catch (error) {
    console.log(`  ❌ Error sending message: ${error.message}\n`);
  }

  console.log('='.repeat(50));
  console.log('✅ All tests completed!\n');
};

main().catch(console.error);

