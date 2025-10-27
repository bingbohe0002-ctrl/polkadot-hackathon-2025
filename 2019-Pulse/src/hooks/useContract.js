import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

// Import contract artifacts directly
import contractABIData from '../contracts/PulseChat.json';
import deploymentData from '../contracts/deployment.json';

// Contract ABI and address
const contractABI = contractABIData;
const contractAddress = deploymentData.address;

export function useContract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Check if user is registered
  const checkUserRegistered = async (userAddress) => {
    if (!contractAddress || !contractABI) {
      console.error('Contract not deployed');
      return false;
    }

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
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
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
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
    if (!contractAddress || !contractABI) {
      throw new Error('Contract not available');
    }

    try {
      const available = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
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
    if (!contractAddress || !contractABI || !walletClient) {
      throw new Error('Contract not available or wallet not connected');
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: contractABI,
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
  };
}

