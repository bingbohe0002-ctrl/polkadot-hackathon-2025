//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title PulseChannels
 * @dev Decentralized channel management for PulseChat
 */
contract PulseChannels {
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
    uint256 public channelCounter;
    mapping(uint256 => Channel) public channels;
    mapping(uint256 => address[]) public channelSubscribers;
    mapping(uint256 => mapping(address => bool)) public isChannelSubscriber;
    mapping(uint256 => ChannelMessage[]) private channelMessages;

    // Events
    event ChannelCreated(uint256 indexed channelId, string name, address indexed creator, uint256 timestamp);
    event ChannelSubscriberAdded(uint256 indexed channelId, address indexed subscriber, uint256 timestamp);
    event ChannelSubscriberRemoved(uint256 indexed channelId, address indexed subscriber, uint256 timestamp);
    event ChannelMessageSent(uint256 indexed channelId, address indexed sender, string content, uint256 timestamp, uint256 messageId);

    /**
     * @dev Create a new channel
     * @param _name Channel name
     * @return channelId The ID of the created channel
     */
    function createChannel(string memory _name) public returns (uint256) {
        require(bytes(_name).length > 0, "Channel name cannot be empty");
        require(bytes(_name).length <= 100, "Channel name too long");

        channelCounter++;
        uint256 newChannelId = channelCounter;

        channels[newChannelId] = Channel({
            channelId: newChannelId,
            name: _name,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        // Add creator as first subscriber
        channelSubscribers[newChannelId].push(msg.sender);
        isChannelSubscriber[newChannelId][msg.sender] = true;

        emit ChannelCreated(newChannelId, _name, msg.sender, block.timestamp);
        emit ChannelSubscriberAdded(newChannelId, msg.sender, block.timestamp);

        return newChannelId;
    }

    /**
     * @dev Subscribe to a channel
     * @param _channelId Channel ID
     */
    function subscribeChannel(uint256 _channelId) public {
        require(channels[_channelId].exists, "Channel does not exist");
        require(!isChannelSubscriber[_channelId][msg.sender], "Already subscribed");

        channelSubscribers[_channelId].push(msg.sender);
        isChannelSubscriber[_channelId][msg.sender] = true;

        emit ChannelSubscriberAdded(_channelId, msg.sender, block.timestamp);
    }

    /**
     * @dev Unsubscribe from a channel
     * @param _channelId Channel ID
     */
    function unsubscribeChannel(uint256 _channelId) public {
        require(channels[_channelId].exists, "Channel does not exist");
        require(isChannelSubscriber[_channelId][msg.sender], "Not subscribed");

        isChannelSubscriber[_channelId][msg.sender] = false;

        // Remove from subscribers array
        address[] storage subscribers = channelSubscribers[_channelId];
        for (uint256 i = 0; i < subscribers.length; i++) {
            if (subscribers[i] == msg.sender) {
                subscribers[i] = subscribers[subscribers.length - 1];
                subscribers.pop();
                break;
            }
        }

        emit ChannelSubscriberRemoved(_channelId, msg.sender, block.timestamp);
    }

    /**
     * @dev Send a message to a channel
     * @param _channelId Channel ID
     * @param _content Message content
     */
    function sendChannelMessage(uint256 _channelId, string memory _content) public {
        require(channels[_channelId].exists, "Channel does not exist");
        require(isChannelSubscriber[_channelId][msg.sender], "Not subscribed");
        require(bytes(_content).length > 0, "Message cannot be empty");
        require(bytes(_content).length <= 1000, "Message too long");

        ChannelMessage[] storage msgs = channelMessages[_channelId];
        uint256 messageId = msgs.length;

        msgs.push(ChannelMessage({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            messageId: messageId
        }));

        emit ChannelMessageSent(_channelId, msg.sender, _content, block.timestamp, messageId);
    }

    /**
     * @dev Get channel information
     * @param _channelId Channel ID
     */
    function getChannel(uint256 _channelId) 
        public 
        view 
        returns (
            uint256 channelId,
            string memory name,
            address creator,
            uint256 createdAt,
            bool exists
        ) 
    {
        Channel memory channel = channels[_channelId];
        return (
            channel.channelId,
            channel.name,
            channel.creator,
            channel.createdAt,
            channel.exists
        );
    }

    /**
     * @dev Get channel subscribers
     * @param _channelId Channel ID
     */
    function getChannelSubscribers(uint256 _channelId) public view returns (address[] memory) {
        require(channels[_channelId].exists, "Channel does not exist");
        return channelSubscribers[_channelId];
    }

    /**
     * @dev Get channel subscriber count
     * @param _channelId Channel ID
     */
    function getChannelSubscriberCount(uint256 _channelId) public view returns (uint256) {
        require(channels[_channelId].exists, "Channel does not exist");
        return channelSubscribers[_channelId].length;
    }

    /**
     * @dev Get latest channel messages
     * @param _channelId Channel ID
     * @param _count Number of messages to retrieve
     */
    function getLatestChannelMessages(uint256 _channelId, uint256 _count) 
        public 
        view 
        returns (
            address[] memory senders,
            string[] memory contents,
            uint256[] memory timestamps,
            uint256[] memory messageIds
        ) 
    {
        require(channels[_channelId].exists, "Channel does not exist");

        ChannelMessage[] storage msgs = channelMessages[_channelId];
        if (_count > msgs.length) {
            _count = msgs.length;
        }

        senders = new address[](_count);
        contents = new string[](_count);
        timestamps = new uint256[](_count);
        messageIds = new uint256[](_count);

        for (uint256 i = 0; i < _count; i++) {
            uint256 index = msgs.length - _count + i;
            ChannelMessage memory msg = msgs[index];
            senders[i] = msg.sender;
            contents[i] = msg.content;
            timestamps[i] = msg.timestamp;
            messageIds[i] = msg.messageId;
        }

        return (senders, contents, timestamps, messageIds);
    }

    /**
     * @dev Get total channel messages
     * @param _channelId Channel ID
     */
    function getTotalChannelMessages(uint256 _channelId) public view returns (uint256) {
        require(channels[_channelId].exists, "Channel does not exist");
        return channelMessages[_channelId].length;
    }

    /**
     * @dev Get all channels
     */
    function getAllChannels() 
        public 
        view 
        returns (
            uint256[] memory channelIds,
            string[] memory names,
            address[] memory creators,
            uint256[] memory createdAts
        ) 
    {
        uint256 count = channelCounter;
        channelIds = new uint256[](count);
        names = new string[](count);
        creators = new address[](count);
        createdAts = new uint256[](count);

        uint256 index = 0;
        for (uint256 i = 1; i <= channelCounter; i++) {
            if (channels[i].exists) {
                Channel memory channel = channels[i];
                channelIds[index] = channel.channelId;
                names[index] = channel.name;
                creators[index] = channel.creator;
                createdAts[index] = channel.createdAt;
                index++;
            }
        }

        return (channelIds, names, creators, createdAts);
    }

    /**
     * @dev Get total channels
     */
    function getTotalChannels() public view returns (uint256) {
        return channelCounter;
    }
}

