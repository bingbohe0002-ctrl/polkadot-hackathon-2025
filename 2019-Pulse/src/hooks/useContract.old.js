import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

// Import contract artifacts directly
import pulseChatABI from '../contracts/PulseChat.json';
import pulseGroupsABI from '../contracts/PulseGroups.json';
import pulseChannelsABI from '../contracts/PulseChannels.json';
import pulseFriendsABI from '../contracts/PulseFriends.json';
import deploymentData from '../contracts/deployment.json';

// Contract ABIs and addresses
const contracts = {
  pulseChat: {
    abi: pulseChatABI,
    address: deploymentData.PulseChat?.address,
  },
  pulseGroups: {
    abi: pulseGroupsABI,
    address: deploymentData.PulseGroups?.address,
  },
  pulseChannels: {
    abi: pulseChannelsABI,
    address: deploymentData.PulseChannels?.address,
  },
  pulseFriends: {
    abi: pulseFriendsABI,
    address: deploymentData.PulseFriends?.address,
  },
};

export function useContract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // ==================== PulseChat Functions ====================

  // Check if user is registered
  const checkUserRegistered = async (userAddress) => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi) {
      console.error('PulseChat contract not deployed');
      return false;
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getUserProfile',
        args: [userAddress],
      });

      return result[4]; // isRegistered is the 5th return value
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  };

  // Register user
  const registerUser = async (username, signature, avatarUrl) => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'registerUser',
        args: [username, signature, avatarUrl],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  // Check if username is available
  const checkUsernameAvailable = async (username) => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi) {
      throw new Error('Contract not available');
    }

    try {
      const available = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'isUsernameAvailable',
        args: [username],
      });

      return available;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = async (content) => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'sendMessage',
        args: [content],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      
      return hash;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Get latest messages
  const getLatestMessages = async (count) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const messages = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getLatestMessages',
        args: [BigInt(count)],
      });

      return messages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        messageId: msg.messageId,
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  };

  // Get total messages
  const getTotalMessages = async () => {
    if (!contractAddress || !contractABI) {
      return 0;
    }

    try {
      const total = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getTotalMessages',
      });

      return total;
    } catch (error) {
      console.error('Error getting total messages:', error);
      return 0;
    }
  };

  // Get user profile
  const getUserProfile = async (userAddress) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getUserProfile',
        args: [userAddress],
      });

      return {
        username: result[0],
        signature: result[1],
        avatarUrl: result[2],
        registeredAt: result[3],
        isRegistered: result[4],
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  };

  // Get all users
  const getAllUsers = async () => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const users = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getAllUsers',
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };

  // Listen to new messages (using event logs)
  const listenToMessages = (callback) => {
    if (!contractAddress || !contractABI || !publicClient) {
      return null;
    }

    try {
      const unwatch = publicClient.watchContractEvent({
        address: contractAddress,
        abi: contractABI,
        eventName: 'MessageSent',
        onLogs: (logs) => {
          logs.forEach((log) => {
            const { sender, content, timestamp, messageId } = log.args;
            callback({
              sender,
              content,
              timestamp,
              messageId,
            });
          });
        },
      });

      return unwatch;
    } catch (error) {
      console.error('Error listening to messages:', error);
      return null;
    }
  };

  // Create group
  const createGroup = async (name) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'createGroup',
        args: [name],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Get groupId from event logs
      const log = receipt.logs.find(log => {
        try {
          const decoded = publicClient.decodeEventLog({
            abi: contractABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'GroupCreated';
        } catch {
          return false;
        }
      });

      if (log) {
        const decoded = publicClient.decodeEventLog({
          abi: contractABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.args.groupId;
      }

      return null;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  // Join group
  const joinGroup = async (groupId) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'joinGroup',
        args: [BigInt(groupId)],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  };

  // Add group member
  const addGroupMember = async (groupId, memberAddress) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'addGroupMember',
        args: [BigInt(groupId), memberAddress],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error adding group member:', error);
      throw error;
    }
  };

  // Send group message
  const sendGroupMessage = async (groupId, content) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'sendGroupMessage',
        args: [BigInt(groupId), content],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  };

  // Get group info
  const getGroupInfo = async (groupId) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getGroupInfo',
        args: [BigInt(groupId)],
      });

      return {
        name: result[0],
        creator: result[1],
        createdAt: result[2],
        memberCount: result[3],
      };
    } catch (error) {
      console.error('Error getting group info:', error);
      throw error;
    }
  };

  // Get group members
  const getGroupMembers = async (groupId) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const members = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getGroupMembers',
        args: [BigInt(groupId)],
      });

      return members;
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  };

  // Get latest group messages
  const getLatestGroupMessages = async (groupId, count) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const messages = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getLatestGroupMessages',
        args: [BigInt(groupId), BigInt(count)],
      });

      return messages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        messageId: msg.messageId,
      }));
    } catch (error) {
      console.error('Error getting group messages:', error);
      return [];
    }
  };

  // Get total group messages
  const getTotalGroupMessages = async (groupId) => {
    if (!contractAddress || !contractABI) {
      return 0;
    }

    try {
      const total = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getTotalGroupMessages',
        args: [BigInt(groupId)],
      });

      return total;
    } catch (error) {
      console.error('Error getting total group messages:', error);
      return 0;
    }
  };

  // Get user groups
  const getUserGroups = async (userAddress) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const groupIds = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getUserGroups',
        args: [userAddress],
      });

      return groupIds;
    } catch (error) {
      console.error('Error getting user groups:', error);
      return [];
    }
  };

  // Check group membership
  const checkGroupMembership = async (groupId, userAddress) => {
    if (!contractAddress || !contractABI) {
      return false;
    }

    try {
      const isMember = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'checkGroupMembership',
        args: [BigInt(groupId), userAddress],
      });

      return isMember;
    } catch (error) {
      console.error('Error checking group membership:', error);
      return false;
    }
  };

  // Listen to group messages
  const listenToGroupMessages = (groupId, callback) => {
    if (!contractAddress || !contractABI || !publicClient) {
      return null;
    }

    try {
      const unwatch = publicClient.watchContractEvent({
        address: contractAddress,
        abi: contractABI,
        eventName: 'GroupMessageSent',
        args: { groupId: BigInt(groupId) },
        onLogs: (logs) => {
          logs.forEach((log) => {
            const { sender, content, timestamp, messageId } = log.args;
            callback({
              sender,
              content,
              timestamp,
              messageId,
            });
          });
        },
      });

      return unwatch;
    } catch (error) {
      console.error('Error listening to group messages:', error);
      return null;
    }
  };

  // Create channel
  const createChannel = async (name) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'createChannel',
        args: [name],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Get channelId from event logs
      const log = receipt.logs.find(log => {
        try {
          const decoded = publicClient.decodeEventLog({
            abi: contractABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'ChannelCreated';
        } catch {
          return false;
        }
      });

      if (log) {
        const decoded = publicClient.decodeEventLog({
          abi: contractABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.args.channelId;
      }

      return null;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  };

  // Subscribe to channel
  const subscribeToChannel = async (channelId) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'subscribeToChannel',
        args: [BigInt(channelId)],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      throw error;
    }
  };

  // Add channel subscriber
  const addChannelSubscriber = async (channelId, subscriberAddress) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'addChannelSubscriber',
        args: [BigInt(channelId), subscriberAddress],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error adding channel subscriber:', error);
      throw error;
    }
  };

  // Send channel message
  const sendChannelMessage = async (channelId, content) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'sendChannelMessage',
        args: [BigInt(channelId), content],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error sending channel message:', error);
      throw error;
    }
  };

  // Get channel info
  const getChannelInfo = async (channelId) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getChannelInfo',
        args: [BigInt(channelId)],
      });

      return {
        name: result[0],
        creator: result[1],
        createdAt: result[2],
        subscriberCount: result[3],
      };
    } catch (error) {
      console.error('Error getting channel info:', error);
      throw error;
    }
  };

  // Get channel subscribers
  const getChannelSubscribers = async (channelId) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const subscribers = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getChannelSubscribers',
        args: [BigInt(channelId)],
      });

      return subscribers;
    } catch (error) {
      console.error('Error getting channel subscribers:', error);
      return [];
    }
  };

  // Get latest channel messages
  const getLatestChannelMessages = async (channelId, count) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const messages = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getLatestChannelMessages',
        args: [BigInt(channelId), BigInt(count)],
      });

      return messages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        messageId: msg.messageId,
      }));
    } catch (error) {
      console.error('Error getting channel messages:', error);
      return [];
    }
  };

  // Get total channel messages
  const getTotalChannelMessages = async (channelId) => {
    if (!contractAddress || !contractABI) {
      return 0;
    }

    try {
      const total = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getTotalChannelMessages',
        args: [BigInt(channelId)],
      });

      return total;
    } catch (error) {
      console.error('Error getting total channel messages:', error);
      return 0;
    }
  };

  // Get user channels
  const getUserChannels = async (userAddress) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const channelIds = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getUserChannels',
        args: [userAddress],
      });

      return channelIds;
    } catch (error) {
      console.error('Error getting user channels:', error);
      return [];
    }
  };

  // Check channel subscription
  const checkChannelSubscription = async (channelId, userAddress) => {
    if (!contractAddress || !contractABI) {
      return false;
    }

    try {
      const isSubscriber = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'checkChannelSubscription',
        args: [BigInt(channelId), userAddress],
      });

      return isSubscriber;
    } catch (error) {
      console.error('Error checking channel subscription:', error);
      return false;
    }
  };

  // Listen to channel messages
  const listenToChannelMessages = (channelId, callback) => {
    if (!contractAddress || !contractABI || !publicClient) {
      return null;
    }

    try {
      const unwatch = publicClient.watchContractEvent({
        address: contractAddress,
        abi: contractABI,
        eventName: 'ChannelMessageSent',
        args: { channelId: BigInt(channelId) },
        onLogs: (logs) => {
          logs.forEach((log) => {
            const { sender, content, timestamp, messageId } = log.args;
            callback({
              sender,
              content,
              timestamp,
              messageId,
            });
          });
        },
      });

      return unwatch;
    } catch (error) {
      console.error('Error listening to channel messages:', error);
      return null;
    }
  };

  // Add friend
  const addFriend = async (friendAddress) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'addFriend',
        args: [friendAddress],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error adding friend:', error);
      throw error;
    }
  };

  // Remove friend
  const removeFriend = async (friendAddress) => {
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'removeFriend',
        args: [friendAddress],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  };

  // Get friends
  const getFriends = async (userAddress) => {
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const friends = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getFriends',
        args: [userAddress],
      });

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  };

  // Check friendship
  const checkFriendship = async (user1, user2) => {
    if (!contractAddress || !contractABI) {
      return false;
    }

    try {
      const areFriends = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'checkFriendship',
        args: [user1, user2],
      });

      return areFriends;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
  };

  return {
    checkUserRegistered,
    registerUser,
    checkUsernameAvailable,
    sendMessage,
    getLatestMessages,
    getTotalMessages,
    getUserProfile,
    getAllUsers,
    listenToMessages,
    createGroup,
    joinGroup,
    addGroupMember,
    sendGroupMessage,
    getGroupInfo,
    getGroupMembers,
    getLatestGroupMessages,
    getTotalGroupMessages,
    getUserGroups,
    checkGroupMembership,
    listenToGroupMessages,
    createChannel,
    subscribeToChannel,
    addChannelSubscriber,
    sendChannelMessage,
    getChannelInfo,
    getChannelSubscribers,
    getLatestChannelMessages,
    getTotalChannelMessages,
    getUserChannels,
    checkChannelSubscription,
    listenToChannelMessages,
    addFriend,
    removeFriend,
    getFriends,
    checkFriendship,
  };
}

