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

    // Group structure
    struct Group {
        uint256 groupId;
        string name;
        address creator;
        uint256 createdAt;
        bool exists;
    }

    // Group message structure
    struct GroupMessage {
        address sender;
        string content;
        uint256 timestamp;
        uint256 messageId;
    }

    // Channel structure
    struct Channel {
        uint256 channelId;
        string name;
        address creator;
        uint256 createdAt;
        bool exists;
    }

    // Channel message structure
    struct ChannelMessage {
        address sender;
        string content;
        uint256 timestamp;
        uint256 messageId;
    }

    // State variables
    mapping(address => UserProfile) public users;
    address[] public userAddresses;
    Message[] public messages;

    // Group state variables
    uint256 public groupCounter;
    mapping(uint256 => Group) public groups;
    mapping(uint256 => address[]) public groupMembers;
    mapping(uint256 => mapping(address => bool)) public isGroupMember;
    mapping(uint256 => GroupMessage[]) public groupMessages;

    // Channel state variables
    uint256 public channelCounter;
    mapping(uint256 => Channel) public channels;
    mapping(uint256 => address[]) public channelSubscribers;
    mapping(uint256 => mapping(address => bool)) public isChannelSubscriber;
    mapping(uint256 => ChannelMessage[]) public channelMessages;

    // Friend state variables
    mapping(address => address[]) public userFriends;
    mapping(address => mapping(address => bool)) public isFriend;

    // Events
    event UserRegistered(address indexed userAddress, string username, uint256 timestamp);
    event UserProfileUpdated(address indexed userAddress, string username, string signature, string avatarUrl);
    event MessageSent(address indexed sender, string content, uint256 timestamp, uint256 messageId);
    event GroupCreated(uint256 indexed groupId, string name, address indexed creator, uint256 timestamp);
    event GroupMemberAdded(uint256 indexed groupId, address indexed member, uint256 timestamp);
    event GroupMessageSent(uint256 indexed groupId, address indexed sender, string content, uint256 timestamp, uint256 messageId);
    event ChannelCreated(uint256 indexed channelId, string name, address indexed creator, uint256 timestamp);
    event ChannelSubscriberAdded(uint256 indexed channelId, address indexed subscriber, uint256 timestamp);
    event ChannelMessageSent(uint256 indexed channelId, address indexed sender, string content, uint256 timestamp, uint256 messageId);
    event FriendAdded(address indexed user, address indexed friend, uint256 timestamp);
    event FriendRemoved(address indexed user, address indexed friend, uint256 timestamp);

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
     * @dev Check if user is registered
     * @param _userAddress User's address
     * @return Whether user is registered
     */
    function isUserRegistered(address _userAddress) public view returns (bool) {
        UserProfile memory user = users[_userAddress];
        return user.isRegistered;
    }

    /**
     * @dev Get username
     * @param _userAddress User's address
     * @return User's username
     */
    function getUsername(address _userAddress) public view returns (string memory) {
        return users[_userAddress].username;
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

    /**
     * @dev Create a new group
     * @param _name Group name
     * @return groupId The ID of the created group
     */
    function createGroup(string memory _name) public onlyRegistered returns (uint256) {
        require(bytes(_name).length > 0, "Group name cannot be empty");
        require(bytes(_name).length <= 100, "Group name too long");

        uint256 groupId = groupCounter;
        groupCounter++;

        groups[groupId] = Group({
            groupId: groupId,
            name: _name,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        // Add creator as first member
        groupMembers[groupId].push(msg.sender);
        isGroupMember[groupId][msg.sender] = true;

        emit GroupCreated(groupId, _name, msg.sender, block.timestamp);
        emit GroupMemberAdded(groupId, msg.sender, block.timestamp);

        return groupId;
    }

    /**
     * @dev Add a member to a group
     * @param _groupId Group ID
     * @param _member Member address to add
     */
    function addGroupMember(uint256 _groupId, address _member) public onlyRegistered {
        require(groups[_groupId].exists, "Group does not exist");
        require(isGroupMember[_groupId][msg.sender], "Only group members can add others");
        require(users[_member].isRegistered, "Member must be registered");
        require(!isGroupMember[_groupId][_member], "Already a member");

        groupMembers[_groupId].push(_member);
        isGroupMember[_groupId][_member] = true;

        emit GroupMemberAdded(_groupId, _member, block.timestamp);
    }

    /**
     * @dev Join a group (via invite link)
     * @param _groupId Group ID
     */
    function joinGroup(uint256 _groupId) public onlyRegistered {
        require(groups[_groupId].exists, "Group does not exist");
        require(!isGroupMember[_groupId][msg.sender], "Already a member");

        groupMembers[_groupId].push(msg.sender);
        isGroupMember[_groupId][msg.sender] = true;

        emit GroupMemberAdded(_groupId, msg.sender, block.timestamp);
    }

    /**
     * @dev Send a message to a group
     * @param _groupId Group ID
     * @param _content Message content
     */
    function sendGroupMessage(uint256 _groupId, string memory _content) public onlyRegistered {
        require(groups[_groupId].exists, "Group does not exist");
        require(isGroupMember[_groupId][msg.sender], "Not a group member");
        require(bytes(_content).length > 0, "Message cannot be empty");
        require(bytes(_content).length <= 1000, "Message too long");

        uint256 messageId = groupMessages[_groupId].length;

        groupMessages[_groupId].push(GroupMessage({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            messageId: messageId
        }));

        emit GroupMessageSent(_groupId, msg.sender, _content, block.timestamp, messageId);
    }

    /**
     * @dev Get group info
     * @param _groupId Group ID
     * @return name Group name
     * @return creator Creator address
     * @return createdAt Creation timestamp
     * @return memberCount Number of members
     */
    function getGroupInfo(uint256 _groupId)
        public
        view
        returns (
            string memory name,
            address creator,
            uint256 createdAt,
            uint256 memberCount
        )
    {
        require(groups[_groupId].exists, "Group does not exist");
        Group memory group = groups[_groupId];
        return (
            group.name,
            group.creator,
            group.createdAt,
            groupMembers[_groupId].length
        );
    }

    /**
     * @dev Get group members
     * @param _groupId Group ID
     * @return Array of member addresses
     */
    function getGroupMembers(uint256 _groupId) public view returns (address[] memory) {
        require(groups[_groupId].exists, "Group does not exist");
        return groupMembers[_groupId];
    }

    /**
     * @dev Get latest group messages
     * @param _groupId Group ID
     * @param _count Number of messages to fetch
     * @return Array of messages
     */
    function getLatestGroupMessages(uint256 _groupId, uint256 _count)
        public
        view
        returns (GroupMessage[] memory)
    {
        require(groups[_groupId].exists, "Group does not exist");

        GroupMessage[] storage msgs = groupMessages[_groupId];
        if (_count > msgs.length) {
            _count = msgs.length;
        }

        GroupMessage[] memory result = new GroupMessage[](_count);
        uint256 startIndex = msgs.length - _count;

        for (uint256 i = 0; i < _count; i++) {
            result[i] = msgs[startIndex + i];
        }

        return result;
    }

    /**
     * @dev Get total number of group messages
     * @param _groupId Group ID
     * @return Total message count
     */
    function getTotalGroupMessages(uint256 _groupId) public view returns (uint256) {
        require(groups[_groupId].exists, "Group does not exist");
        return groupMessages[_groupId].length;
    }

    /**
     * @dev Check if user is a member of a group
     * @param _groupId Group ID
     * @param _user User address
     * @return true if member, false otherwise
     */
    function checkGroupMembership(uint256 _groupId, address _user) public view returns (bool) {
        return isGroupMember[_groupId][_user];
    }

    /**
     * @dev Get user's groups
     * @param _user User address
     * @return Array of group IDs
     */
    function getUserGroups(address _user) public view returns (uint256[] memory) {
        uint256[] memory userGroupIds = new uint256[](groupCounter);
        uint256 count = 0;

        for (uint256 i = 0; i < groupCounter; i++) {
            if (groups[i].exists && isGroupMember[i][_user]) {
                userGroupIds[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userGroupIds[i];
        }

        return result;
    }

    /**
     * @dev Create a new channel
     * @param _name Channel name
     * @return channelId The ID of the created channel
     */
    function createChannel(string memory _name) public onlyRegistered returns (uint256) {
        require(bytes(_name).length > 0, "Channel name cannot be empty");
        require(bytes(_name).length <= 100, "Channel name too long");

        uint256 channelId = channelCounter;
        channelCounter++;

        channels[channelId] = Channel({
            channelId: channelId,
            name: _name,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        // Add creator as first subscriber
        channelSubscribers[channelId].push(msg.sender);
        isChannelSubscriber[channelId][msg.sender] = true;

        emit ChannelCreated(channelId, _name, msg.sender, block.timestamp);
        emit ChannelSubscriberAdded(channelId, msg.sender, block.timestamp);

        return channelId;
    }

    /**
     * @dev Add a subscriber to a channel
     * @param _channelId Channel ID
     * @param _subscriber Subscriber address to add
     */
    function addChannelSubscriber(uint256 _channelId, address _subscriber) public onlyRegistered {
        require(channels[_channelId].exists, "Channel does not exist");
        require(isChannelSubscriber[_channelId][msg.sender], "Only subscribers can add others");
        require(users[_subscriber].isRegistered, "Subscriber must be registered");
        require(!isChannelSubscriber[_channelId][_subscriber], "Already a subscriber");

        channelSubscribers[_channelId].push(_subscriber);
        isChannelSubscriber[_channelId][_subscriber] = true;

        emit ChannelSubscriberAdded(_channelId, _subscriber, block.timestamp);
    }

    /**
     * @dev Subscribe to a channel (via invite link)
     * @param _channelId Channel ID
     */
    function subscribeToChannel(uint256 _channelId) public onlyRegistered {
        require(channels[_channelId].exists, "Channel does not exist");
        require(!isChannelSubscriber[_channelId][msg.sender], "Already a subscriber");

        channelSubscribers[_channelId].push(msg.sender);
        isChannelSubscriber[_channelId][msg.sender] = true;

        emit ChannelSubscriberAdded(_channelId, msg.sender, block.timestamp);
    }

    /**
     * @dev Send a message to a channel (only creator can send)
     * @param _channelId Channel ID
     * @param _content Message content
     */
    function sendChannelMessage(uint256 _channelId, string memory _content) public onlyRegistered {
        require(channels[_channelId].exists, "Channel does not exist");
        require(channels[_channelId].creator == msg.sender, "Only channel creator can send messages");
        require(bytes(_content).length > 0, "Message cannot be empty");
        require(bytes(_content).length <= 1000, "Message too long");

        uint256 messageId = channelMessages[_channelId].length;

        channelMessages[_channelId].push(ChannelMessage({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            messageId: messageId
        }));

        emit ChannelMessageSent(_channelId, msg.sender, _content, block.timestamp, messageId);
    }

    /**
     * @dev Get channel info
     * @param _channelId Channel ID
     * @return name Channel name
     * @return creator Creator address
     * @return createdAt Creation timestamp
     * @return subscriberCount Number of subscribers
     */
    function getChannelInfo(uint256 _channelId)
        public
        view
        returns (
            string memory name,
            address creator,
            uint256 createdAt,
            uint256 subscriberCount
        )
    {
        require(channels[_channelId].exists, "Channel does not exist");
        Channel memory channel = channels[_channelId];
        return (
            channel.name,
            channel.creator,
            channel.createdAt,
            channelSubscribers[_channelId].length
        );
    }

    /**
     * @dev Get channel subscribers
     * @param _channelId Channel ID
     * @return Array of subscriber addresses
     */
    function getChannelSubscribers(uint256 _channelId) public view returns (address[] memory) {
        require(channels[_channelId].exists, "Channel does not exist");
        return channelSubscribers[_channelId];
    }

    /**
     * @dev Get latest channel messages
     * @param _channelId Channel ID
     * @param _count Number of messages to fetch
     * @return Array of messages
     */
    function getLatestChannelMessages(uint256 _channelId, uint256 _count)
        public
        view
        returns (ChannelMessage[] memory)
    {
        require(channels[_channelId].exists, "Channel does not exist");

        ChannelMessage[] storage msgs = channelMessages[_channelId];
        if (_count > msgs.length) {
            _count = msgs.length;
        }

        ChannelMessage[] memory result = new ChannelMessage[](_count);
        uint256 startIndex = msgs.length - _count;

        for (uint256 i = 0; i < _count; i++) {
            result[i] = msgs[startIndex + i];
        }

        return result;
    }

    /**
     * @dev Get total number of channel messages
     * @param _channelId Channel ID
     * @return Total message count
     */
    function getTotalChannelMessages(uint256 _channelId) public view returns (uint256) {
        require(channels[_channelId].exists, "Channel does not exist");
        return channelMessages[_channelId].length;
    }

    /**
     * @dev Check if user is a subscriber of a channel
     * @param _channelId Channel ID
     * @param _user User address
     * @return true if subscriber, false otherwise
     */
    function checkChannelSubscription(uint256 _channelId, address _user) public view returns (bool) {
        return isChannelSubscriber[_channelId][_user];
    }

    /**
     * @dev Get user's channels
     * @param _user User address
     * @return Array of channel IDs
     */
    function getUserChannels(address _user) public view returns (uint256[] memory) {
        uint256[] memory userChannelIds = new uint256[](channelCounter);
        uint256 count = 0;

        for (uint256 i = 0; i < channelCounter; i++) {
            if (channels[i].exists && isChannelSubscriber[i][_user]) {
                userChannelIds[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userChannelIds[i];
        }

        return result;
    }

    /**
     * @dev Add a friend
     * @param _friend Friend address to add
     */
    function addFriend(address _friend) public onlyRegistered {
        require(users[_friend].isRegistered, "Friend must be registered");
        require(_friend != msg.sender, "Cannot add yourself as friend");
        require(!isFriend[msg.sender][_friend], "Already friends");

        userFriends[msg.sender].push(_friend);
        isFriend[msg.sender][_friend] = true;

        emit FriendAdded(msg.sender, _friend, block.timestamp);
    }

    /**
     * @dev Remove a friend
     * @param _friend Friend address to remove
     */
    function removeFriend(address _friend) public onlyRegistered {
        require(isFriend[msg.sender][_friend], "Not friends");

        // Remove from array
        address[] storage friends = userFriends[msg.sender];
        for (uint256 i = 0; i < friends.length; i++) {
            if (friends[i] == _friend) {
                friends[i] = friends[friends.length - 1];
                friends.pop();
                break;
            }
        }

        isFriend[msg.sender][_friend] = false;

        emit FriendRemoved(msg.sender, _friend, block.timestamp);
    }

    /**
     * @dev Get user's friends
     * @param _user User address
     * @return Array of friend addresses
     */
    function getFriends(address _user) public view returns (address[] memory) {
        return userFriends[_user];
    }

    /**
     * @dev Check if two users are friends
     * @param _user1 First user address
     * @param _user2 Second user address
     * @return true if friends, false otherwise
     */
    function checkFriendship(address _user1, address _user2) public view returns (bool) {
        return isFriend[_user1][_user2];
    }
}

