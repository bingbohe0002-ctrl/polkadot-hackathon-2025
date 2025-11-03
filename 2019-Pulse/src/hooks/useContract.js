import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

// Import contract artifacts directly
import pulseChatABI from '../contracts/PulseChat.json';
import pulseGroupsABI from '../contracts/PulseGroups.json';
import pulseChannelsABI from '../contracts/PulseChannels.json';
import pulseFriendsABI from '../contracts/PulseFriends.json';
import pulsePrivateMessagesABI from '../contracts/PulsePrivateMessages.json';
import pulseAIABI from '../contracts/PulseAI.json';
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
  pulsePrivateMessages: {
    abi: pulsePrivateMessagesABI,
    address: deploymentData.PulsePrivateMessages?.address,
  },
  pulseAI: {
    abi: pulseAIABI,
    address: deploymentData.PulseAI?.address,
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
  const getLatestMessages = async (count = 50) => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const messages = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getLatestMessages',
        args: [BigInt(count)],
      });

      console.log('Raw messages from contract:', messages);

      // Messages is an array of Message structs
      if (!Array.isArray(messages)) {
        console.error('Messages is not an array:', messages);
        return [];
      }

      return messages.map((msg) => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: Number(msg.timestamp),
        messageId: Number(msg.messageId),
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  };

  // Get total messages
  const getTotalMessages = async () => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi) {
      return 0;
    }

    try {
      const total = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getTotalMessages',
      });

      return Number(total);
    } catch (error) {
      console.error('Error getting total messages:', error);
      return 0;
    }
  };

  // Get user profile
  const getUserProfile = async (userAddress) => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi) {
      throw new Error('Contract not available');
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getUserProfile',
        args: [userAddress],
      });

      return {
        username: result[0],
        signature: result[1],
        avatarUrl: result[2],
        registeredAt: Number(result[3]),
        isRegistered: result[4],
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  };

  // Get all users
  const getAllUsers = async () => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const users = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getAllUsers',
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };

  // Listen to new messages
  const listenToMessages = (callback) => {
    const { address: contractAddress, abi } = contracts.pulseChat;
    if (!contractAddress || !abi || !publicClient) {
      return null;
    }

    try {
      const unwatch = publicClient.watchContractEvent({
        address: contractAddress,
        abi,
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

  // ==================== PulseGroups Functions ====================
  
  // Create group
  const createGroup = async (name) => {
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
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
            abi,
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
          abi,
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
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'joinGroup',
        args: [groupId],
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

  // Leave group
  const leaveGroup = async (groupId) => {
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'leaveGroup',
        args: [groupId],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  };

  // Send group message
  const sendGroupMessage = async (groupId, content) => {
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'sendGroupMessage',
        args: [groupId, content],
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
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi) {
      throw new Error('Contract not available');
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getGroup',
        args: [groupId],
      });

      return {
        groupId: Number(result[0]),
        name: result[1],
        creator: result[2],
        createdAt: Number(result[3]),
        exists: result[4],
      };
    } catch (error) {
      console.error('Error getting group info:', error);
      throw error;
    }
  };

  // Get group members
  const getGroupMembers = async (groupId) => {
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const members = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getGroupMembers',
        args: [groupId],
      });

      return members;
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  };

  // Get latest group messages
  const getLatestGroupMessages = async (groupId, count = 50) => {
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getLatestGroupMessages',
        args: [groupId, count],
      });

      const [senders, contents, timestamps, messageIds] = result;
      return senders.map((sender, i) => ({
        sender,
        content: contents[i],
        timestamp: Number(timestamps[i]),
        messageId: Number(messageIds[i]),
      }));
    } catch (error) {
      console.error('Error getting group messages:', error);
      return [];
    }
  };

  // Get all groups (all public groups)
  const getAllGroups = async () => {
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi) {
      console.error('PulseGroups contract not available');
      return [];
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getAllGroups',
      });

      console.log('Raw groups from contract:', result);

      const [groupIds, names, creators, createdAts] = result;

      if (!Array.isArray(groupIds)) {
        console.error('groupIds is not an array:', groupIds);
        return [];
      }

      // Get member count for each group
      const groupsWithCounts = await Promise.all(
        groupIds.map(async (id, i) => {
          try {
            const members = await getGroupMembers(Number(id));
            return {
              groupId: Number(id),
              name: names[i],
              creator: creators[i],
              createdAt: Number(createdAts[i]),
              memberCount: members.length,
            };
          } catch (error) {
            console.error(`Error getting members for group ${id}:`, error);
            return {
              groupId: Number(id),
              name: names[i],
              creator: creators[i],
              createdAt: Number(createdAts[i]),
              memberCount: 0,
            };
          }
        })
      );

      return groupsWithCounts;
    } catch (error) {
      console.error('Error getting all groups:', error);
      return [];
    }
  };

  // Get user's joined groups only
  const getMyGroups = async () => {
    if (!address) return [];

    const allGroups = await getAllGroups();

    // Filter groups where user is a member
    const myGroups = await Promise.all(
      allGroups.map(async (group) => {
        try {
          const members = await getGroupMembers(group.groupId);
          const isMember = members.some(
            member => member.toLowerCase() === address.toLowerCase()
          );
          return isMember ? group : null;
        } catch (error) {
          return null;
        }
      })
    );

    return myGroups.filter(group => group !== null);
  };

  // Check group membership
  const checkGroupMembership = async (groupId, userAddress) => {
    const { address: contractAddress, abi } = contracts.pulseGroups;
    if (!contractAddress || !abi) {
      return false;
    }

    try {
      const isMember = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'isGroupMember',
        args: [groupId, userAddress],
      });

      return isMember;
    } catch (error) {
      console.error('Error checking group membership:', error);
      return false;
    }
  };

  // ==================== PulseChannels Functions ====================

  // Create channel
  const createChannel = async (name) => {
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
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
            abi,
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
          abi,
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
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'subscribeChannel',
        args: [channelId],
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

  // Unsubscribe from channel
  const unsubscribeFromChannel = async (channelId) => {
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'unsubscribeChannel',
        args: [channelId],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      throw error;
    }
  };

  // Send channel message
  const sendChannelMessage = async (channelId, content) => {
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'sendChannelMessage',
        args: [channelId, content],
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
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi) {
      throw new Error('Contract not available');
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getChannel',
        args: [channelId],
      });

      return {
        channelId: Number(result[0]),
        name: result[1],
        creator: result[2],
        createdAt: Number(result[3]),
        exists: result[4],
      };
    } catch (error) {
      console.error('Error getting channel info:', error);
      throw error;
    }
  };

  // Get all channels (all public channels)
  const getAllChannels = async () => {
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi) {
      console.error('PulseChannels contract not available');
      return [];
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getAllChannels',
      });

      console.log('Raw channels from contract:', result);

      const [channelIds, names, creators, createdAts] = result;

      if (!Array.isArray(channelIds)) {
        console.error('channelIds is not an array:', channelIds);
        return [];
      }

      // Get subscriber count for each channel
      const channelsWithCounts = await Promise.all(
        channelIds.map(async (id, i) => {
          try {
            const subscribers = await getChannelSubscribers(Number(id));
            return {
              channelId: Number(id),
              name: names[i],
              creator: creators[i],
              createdAt: Number(createdAts[i]),
              subscriberCount: subscribers.length,
            };
          } catch (error) {
            console.error(`Error getting subscribers for channel ${id}:`, error);
            return {
              channelId: Number(id),
              name: names[i],
              creator: creators[i],
              createdAt: Number(createdAts[i]),
              subscriberCount: 0,
            };
          }
        })
      );

      return channelsWithCounts;
    } catch (error) {
      console.error('Error getting all channels:', error);
      return [];
    }
  };

  // Get user's subscribed channels only
  const getMyChannels = async () => {
    if (!address) return [];

    const allChannels = await getAllChannels();

    // Filter channels where user is subscribed
    const myChannels = await Promise.all(
      allChannels.map(async (channel) => {
        try {
          const subscribers = await getChannelSubscribers(channel.channelId);
          const isSubscribed = subscribers.some(
            sub => sub.toLowerCase() === address.toLowerCase()
          );
          return isSubscribed ? channel : null;
        } catch (error) {
          return null;
        }
      })
    );

    return myChannels.filter(channel => channel !== null);
  };

  // Get latest channel messages
  const getLatestChannelMessages = async (channelId, count = 50) => {
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getLatestChannelMessages',
        args: [channelId, count],
      });

      const [senders, contents, timestamps, messageIds] = result;
      return senders.map((sender, i) => ({
        sender,
        content: contents[i],
        timestamp: Number(timestamps[i]),
        messageId: Number(messageIds[i]),
      }));
    } catch (error) {
      console.error('Error getting channel messages:', error);
      return [];
    }
  };

  // Check channel subscription
  const checkChannelSubscription = async (channelId, userAddress) => {
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi) {
      return false;
    }

    try {
      const isSubscribed = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'isChannelSubscriber',
        args: [channelId, userAddress],
      });

      return isSubscribed;
    } catch (error) {
      console.error('Error checking channel subscription:', error);
      return false;
    }
  };

  // Get channel subscribers
  const getChannelSubscribers = async (channelId) => {
    const { address: contractAddress, abi } = contracts.pulseChannels;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const subscribers = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getChannelSubscribers',
        args: [channelId],
      });

      return subscribers;
    } catch (error) {
      console.error('Error getting channel subscribers:', error);
      return [];
    }
  };

  // ==================== PulseFriends Functions ====================

  // Add friend
  const addFriend = async (friendAddress) => {
    const { address: contractAddress, abi } = contracts.pulseFriends;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
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
    const { address: contractAddress, abi } = contracts.pulseFriends;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
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
    const { address: contractAddress, abi } = contracts.pulseFriends;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const friends = await publicClient.readContract({
        address: contractAddress,
        abi,
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
    const { address: contractAddress, abi } = contracts.pulseFriends;
    if (!contractAddress || !abi) {
      return false;
    }

    try {
      const areFriends = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'areFriends',
        args: [user1, user2],
      });

      return areFriends;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
  };

  // ==================== PulsePrivateMessages Functions ====================

  // Send private message
  const sendPrivateMessage = async (recipientAddress, content) => {
    const { address: contractAddress, abi } = contracts.pulsePrivateMessages;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName: 'sendPrivateMessage',
        args: [recipientAddress, content],
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      console.error('Error sending private message:', error);
      throw error;
    }
  };

  // Get conversation messages
  const getConversationMessages = async (otherUserAddress, count = 50) => {
    const { address: contractAddress, abi } = contracts.pulsePrivateMessages;
    if (!contractAddress || !abi || !address) {
      console.log('PulsePrivateMessages contract not available or wallet not connected');
      return [];
    }

    try {
      console.log('Fetching conversation messages from contract:', contractAddress);
      console.log('Current user address:', address);
      console.log('Other user address:', otherUserAddress);
      console.log('Count:', count);

      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getConversationMessages',
        args: [otherUserAddress, BigInt(count)],
        account: address, // Important: specify the account to use as msg.sender
      });

      console.log('Raw result from contract:', result);

      const [senders, recipients, encryptedContents, timestamps, messageIds] = result;
      const messages = senders.map((sender, i) => ({
        sender,
        recipient: recipients[i],
        content: encryptedContents[i],
        timestamp: Number(timestamps[i]),
        messageId: Number(messageIds[i]),
      }));

      console.log('Parsed messages:', messages);
      return messages;
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  };

  // Get conversation message count
  const getConversationMessageCount = async (otherUserAddress) => {
    const { address: contractAddress, abi } = contracts.pulsePrivateMessages;
    if (!contractAddress || !abi || !address) {
      return 0;
    }

    try {
      const count = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getConversationMessageCount',
        args: [otherUserAddress],
        account: address, // Important: specify the account to use as msg.sender
      });

      return Number(count);
    } catch (error) {
      console.error('Error getting conversation message count:', error);
      return 0;
    }
  };

  // ==================== PulseAI Functions ====================

  // Check if user has AI access
  const checkAIAccess = async (userAddress) => {
    const { address: contractAddress, abi } = contracts.pulseAI;
    if (!contractAddress || !abi) {
      console.error('PulseAI contract not deployed');
      return false;
    }

    try {
      const hasAccess = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'checkAIAccess',
        args: [userAddress],
      });

      return hasAccess;
    } catch (error) {
      console.error('Error checking AI access:', error);
      return false;
    }
  };

  // Mint AI NFT
  const mintAINFT = async (price) => {
    const { address: contractAddress, abi } = contracts.pulseAI;
    if (!contractAddress || !abi || !walletClient) {
      throw new Error('PulseAI contract not available');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'mintAINFT',
        account: address,
        value: BigInt(price),
      });

      const hash = await walletClient.writeContract(request);
      
      await publicClient.waitForTransactionReceipt({ hash });
      
      return hash;
    } catch (error) {
      console.error('Error minting AI NFT:', error);
      throw error;
    }
  };

  // Get mint price
  const getMintPrice = async () => {
    const { address: contractAddress, abi } = contracts.pulseAI;
    if (!contractAddress || !abi) {
      return '0';
    }

    try {
      const price = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'mintPrice',
      });

      return price.toString();
    } catch (error) {
      console.error('Error getting mint price:', error);
      return '10000000000000000000'; // Default 10 PAS
    }
  };

  // Get user's AI NFTs
  const getUserAINFTs = async (userAddress) => {
    const { address: contractAddress, abi } = contracts.pulseAI;
    if (!contractAddress || !abi) {
      return [];
    }

    try {
      const nfts = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getUserNFTs',
        args: [userAddress],
      });

      return nfts.map(id => Number(id));
    } catch (error) {
      console.error('Error getting user AI NFTs:', error);
      return [];
    }
  };

  // Get total AI NFTs minted
  const getTotalAINFTs = async () => {
    const { address: contractAddress, abi } = contracts.pulseAI;
    if (!contractAddress || !abi) {
      return 0;
    }

    try {
      const total = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getTotalNFTs',
      });

      return Number(total);
    } catch (error) {
      console.error('Error getting total AI NFTs:', error);
      return 0;
    }
  };

  return {
    // PulseChat
    checkUserRegistered,
    registerUser,
    checkUsernameAvailable,
    sendMessage,
    getLatestMessages,
    getTotalMessages,
    getUserProfile,
    getAllUsers,
    listenToMessages,
    // PulseGroups
    createGroup,
    joinGroup,
    leaveGroup,
    sendGroupMessage,
    getGroupInfo,
    getGroupMembers,
    getLatestGroupMessages,
    getAllGroups,
    getMyGroups,
    checkGroupMembership,
    // PulseChannels
    createChannel,
    subscribeToChannel,
    unsubscribeFromChannel,
    sendChannelMessage,
    getChannelInfo,
    getAllChannels,
    getMyChannels,
    getLatestChannelMessages,
    checkChannelSubscription,
    getChannelSubscribers,
    // PulseFriends
    addFriend,
    removeFriend,
    getFriends,
    checkFriendship,
    // PulsePrivateMessages
    sendPrivateMessage,
    getConversationMessages,
    getConversationMessageCount,
    // PulseAI
    checkAIAccess,
    mintAINFT,
    getMintPrice,
    getUserAINFTs,
    getTotalAINFTs,
  };
}

