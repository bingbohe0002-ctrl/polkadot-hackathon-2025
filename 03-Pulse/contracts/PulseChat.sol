//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title PulseChat
 * @dev A decentralized chat room where all messages are stored on-chain
 */
contract PulseChat {
    // User profile structure
    struct UserProfile {
        string username;
        string signature;
        string avatarUrl;
        address userAddress;
        uint256 registeredAt;
        bool isRegistered;
    }

    // Message structure
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
        uint256 messageId;
    }

    // State variables
    mapping(address => UserProfile) public users;
    address[] public userAddresses;
    Message[] public messages;
    
    // Events
    event UserRegistered(address indexed userAddress, string username, uint256 timestamp);
    event UserProfileUpdated(address indexed userAddress, string username, string signature, string avatarUrl);
    event MessageSent(address indexed sender, string content, uint256 timestamp, uint256 messageId);

    // Modifiers
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }

    modifier usernameNotTaken(string memory _username) {
        for (uint256 i = 0; i < userAddresses.length; i++) {
            if (keccak256(bytes(users[userAddresses[i]].username)) == keccak256(bytes(_username))) {
                require(userAddresses[i] == msg.sender, "Username already taken");
            }
        }
        _;
    }

    /**
     * @dev Register a new user with username (required), signature and avatar (optional)
     * @param _username The username (must be unique and not empty)
     * @param _signature Personal signature (optional)
     * @param _avatarUrl Avatar URL (optional)
     */
    function registerUser(
        string memory _username,
        string memory _signature,
        string memory _avatarUrl
    ) public usernameNotTaken(_username) {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_username).length <= 50, "Username too long");
        require(!users[msg.sender].isRegistered, "User already registered");

        users[msg.sender] = UserProfile({
            username: _username,
            signature: _signature,
            avatarUrl: _avatarUrl,
            userAddress: msg.sender,
            registeredAt: block.timestamp,
            isRegistered: true
        });

        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, _username, block.timestamp);
    }

    /**
     * @dev Update user profile
     * @param _username New username
     * @param _signature New signature
     * @param _avatarUrl New avatar URL
     */
    function updateProfile(
        string memory _username,
        string memory _signature,
        string memory _avatarUrl
    ) public onlyRegistered usernameNotTaken(_username) {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_username).length <= 50, "Username too long");

        users[msg.sender].username = _username;
        users[msg.sender].signature = _signature;
        users[msg.sender].avatarUrl = _avatarUrl;

        emit UserProfileUpdated(msg.sender, _username, _signature, _avatarUrl);
    }

    /**
     * @dev Send a message to the chat room
     * @param _content Message content
     */
    function sendMessage(string memory _content) public onlyRegistered {
        require(bytes(_content).length > 0, "Message cannot be empty");
        require(bytes(_content).length <= 1000, "Message too long");

        uint256 messageId = messages.length;
        
        messages.push(Message({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            messageId: messageId
        }));

        emit MessageSent(msg.sender, _content, block.timestamp, messageId);
    }

    /**
     * @dev Get user profile by address
     * @param _userAddress User's address
     * @return username User's username
     * @return signature User's signature
     * @return avatarUrl User's avatar URL
     * @return registeredAt Registration timestamp
     * @return isRegistered Whether user is registered
     */
    function getUserProfile(address _userAddress) 
        public 
        view 
        returns (
            string memory username,
            string memory signature,
            string memory avatarUrl,
            uint256 registeredAt,
            bool isRegistered
        ) 
    {
        UserProfile memory user = users[_userAddress];
        return (
            user.username,
            user.signature,
            user.avatarUrl,
            user.registeredAt,
            user.isRegistered
        );
    }

    /**
     * @dev Get total number of messages
     * @return Total message count
     */
    function getTotalMessages() public view returns (uint256) {
        return messages.length;
    }

    /**
     * @dev Get messages in a range (for pagination)
     * @param _start Start index
     * @param _limit Number of messages to fetch
     * @return Array of messages
     */
    function getMessages(uint256 _start, uint256 _limit) 
        public 
        view 
        returns (Message[] memory) 
    {
        require(_start < messages.length, "Start index out of bounds");
        
        uint256 end = _start + _limit;
        if (end > messages.length) {
            end = messages.length;
        }
        
        uint256 resultLength = end - _start;
        Message[] memory result = new Message[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = messages[_start + i];
        }
        
        return result;
    }

    /**
     * @dev Get latest N messages
     * @param _count Number of latest messages to fetch
     * @return Array of messages
     */
    function getLatestMessages(uint256 _count) 
        public 
        view 
        returns (Message[] memory) 
    {
        if (_count > messages.length) {
            _count = messages.length;
        }
        
        Message[] memory result = new Message[](_count);
        uint256 startIndex = messages.length - _count;
        
        for (uint256 i = 0; i < _count; i++) {
            result[i] = messages[startIndex + i];
        }
        
        return result;
    }

    /**
     * @dev Get total number of registered users
     * @return Total user count
     */
    function getTotalUsers() public view returns (uint256) {
        return userAddresses.length;
    }

    /**
     * @dev Get all registered user addresses
     * @return Array of user addresses
     */
    function getAllUsers() public view returns (address[] memory) {
        return userAddresses;
    }

    /**
     * @dev Check if a username is available
     * @param _username Username to check
     * @return true if available, false if taken
     */
    function isUsernameAvailable(string memory _username) public view returns (bool) {
        for (uint256 i = 0; i < userAddresses.length; i++) {
            if (keccak256(bytes(users[userAddresses[i]].username)) == keccak256(bytes(_username))) {
                return false;
            }
        }
        return true;
    }
}

