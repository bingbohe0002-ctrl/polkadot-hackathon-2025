import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Polkadot Hub TestNet configuration
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
    public: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
};

// Load deployment info
const deploymentData = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/deployment.json'), 'utf8')
);

// Load ABIs
const pulseChatABI = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/PulseChat.json'), 'utf8')
);
const pulseGroupsABI = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/PulseGroups.json'), 'utf8')
);
const pulseChannelsABI = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/PulseChannels.json'), 'utf8')
);
const pulseFriendsABI = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/PulseFriends.json'), 'utf8')
);
const pulsePrivateMessagesABI = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/PulsePrivateMessages.json'), 'utf8')
);

const testAllFeatures = async () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY environment variable not set');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`\n🔑 Testing with account: ${account.address}\n`);

  const publicClient = createPublicClient({
    chain: polkadotHubTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: polkadotHubTestnet,
    transport: http(),
  });

  try {
    // Test 1: Register User
    console.log('📝 Test 1: Register User');
    try {
      const hash = await walletClient.writeContract({
        address: deploymentData.PulseChat.address,
        abi: pulseChatABI,
        functionName: 'registerUser',
        args: ['TestUser', 'https://avatar.example.com/test.png', 'Test bio'],
        account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`✅ User registered! Block: ${receipt.blockNumber}`);
    } catch (error) {
      if (error.message.includes('User already registered') || error.message.includes('Username already taken')) {
        console.log('✅ User already registered');
      } else {
        throw error;
      }
    }

    // Test 2: Create Group
    console.log('\n📝 Test 2: Create Group');
    const groupHash = await walletClient.writeContract({
      address: deploymentData.PulseGroups.address,
      abi: pulseGroupsABI,
      functionName: 'createGroup',
      args: ['Test Group'],
      account,
    });
    const groupReceipt = await publicClient.waitForTransactionReceipt({ hash: groupHash });
    console.log(`✅ Group created! Block: ${groupReceipt.blockNumber}`);

    // Test 3: Send Group Message
    console.log('\n📝 Test 3: Send Group Message');
    const groupMsgHash = await walletClient.writeContract({
      address: deploymentData.PulseGroups.address,
      abi: pulseGroupsABI,
      functionName: 'sendGroupMessage',
      args: [BigInt(1), 'Hello from group!'],
      account,
    });
    const groupMsgReceipt = await publicClient.waitForTransactionReceipt({ hash: groupMsgHash });
    console.log(`✅ Group message sent! Block: ${groupMsgReceipt.blockNumber}`);

    // Test 4: Create Channel
    console.log('\n📝 Test 4: Create Channel');
    const channelHash = await walletClient.writeContract({
      address: deploymentData.PulseChannels.address,
      abi: pulseChannelsABI,
      functionName: 'createChannel',
      args: ['Test Channel'],
      account,
    });
    const channelReceipt = await publicClient.waitForTransactionReceipt({ hash: channelHash });
    console.log(`✅ Channel created! Block: ${channelReceipt.blockNumber}`);

    // Test 5: Send Channel Message
    console.log('\n📝 Test 5: Send Channel Message');
    const channelMsgHash = await walletClient.writeContract({
      address: deploymentData.PulseChannels.address,
      abi: pulseChannelsABI,
      functionName: 'sendChannelMessage',
      args: [BigInt(1), 'Hello from channel!'],
      account,
    });
    const channelMsgReceipt = await publicClient.waitForTransactionReceipt({ hash: channelMsgHash });
    console.log(`✅ Channel message sent! Block: ${channelMsgReceipt.blockNumber}`);

    // Test 6: Add Friend (using a dummy address)
    console.log('\n📝 Test 6: Add Friend');
    const friendAddress = '0x5a56f381c602aA9b6a223Bd5dF54cb4ea868533c';
    try {
      const friendHash = await walletClient.writeContract({
        address: deploymentData.PulseFriends.address,
        abi: pulseFriendsABI,
        functionName: 'addFriend',
        args: [friendAddress],
        account,
      });
      const friendReceipt = await publicClient.waitForTransactionReceipt({ hash: friendHash });
      console.log(`✅ Friend added! Block: ${friendReceipt.blockNumber}`);
    } catch (error) {
      if (error.message.includes('Already friends')) {
        console.log('✅ Already friends');
      } else {
        throw error;
      }
    }

    // Test 7: Send Private Message
    console.log('\n📝 Test 7: Send Private Message');
    const privateMsgHash = await walletClient.writeContract({
      address: deploymentData.PulsePrivateMessages.address,
      abi: pulsePrivateMessagesABI,
      functionName: 'sendPrivateMessage',
      args: [friendAddress, 'Hello, this is a private message!'],
      account,
    });
    const privateMsgReceipt = await publicClient.waitForTransactionReceipt({ hash: privateMsgHash });
    console.log(`✅ Private message sent! Block: ${privateMsgReceipt.blockNumber}`);

    // Test 8: Get Conversation Messages
    console.log('\n📝 Test 8: Get Conversation Messages');
    const messages = await publicClient.readContract({
      address: deploymentData.PulsePrivateMessages.address,
      abi: pulsePrivateMessagesABI,
      functionName: 'getConversationMessages',
      args: [friendAddress, BigInt(10)],
    });
    console.log(`✅ Retrieved ${messages[0].length} messages from conversation`);

    // Test 9: Send Global Message
    console.log('\n📝 Test 9: Send Global Message');
    const globalMsgHash = await walletClient.writeContract({
      address: deploymentData.PulseChat.address,
      abi: pulseChatABI,
      functionName: 'sendMessage',
      args: ['Hello from global chat!'],
      account,
    });
    const globalMsgReceipt = await publicClient.waitForTransactionReceipt({ hash: globalMsgHash });
    console.log(`✅ Global message sent! Block: ${globalMsgReceipt.blockNumber}`);

    console.log('\n🎉 All tests passed successfully!\n');
    console.log('📋 Summary:');
    console.log('  ✅ User Registration');
    console.log('  ✅ Group Creation & Messaging');
    console.log('  ✅ Channel Creation & Messaging');
    console.log('  ✅ Friend Management');
    console.log('  ✅ Private Messaging');
    console.log('  ✅ Global Messaging');
    console.log('\n🔗 Contract Addresses:');
    console.log(`  PulseChat: ${deploymentData.PulseChat.address}`);
    console.log(`  PulseGroups: ${deploymentData.PulseGroups.address}`);
    console.log(`  PulseChannels: ${deploymentData.PulseChannels.address}`);
    console.log(`  PulseFriends: ${deploymentData.PulseFriends.address}`);
    console.log(`  PulsePrivateMessages: ${deploymentData.PulsePrivateMessages.address}`);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
};

testAllFeatures();

