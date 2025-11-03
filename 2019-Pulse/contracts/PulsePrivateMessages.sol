//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title PulsePrivateMessages
 * @dev Decentralized private messaging for PulseChat
 * Note: Messages are encrypted off-chain before being stored
 */
contract PulsePrivateMessages {
    // Message structure
    struct PrivateMessage {
        address sender;
        address recipient;
        string encryptedContent;  // Content should be encrypted off-chain
        uint256 timestamp;
        uint256 messageId;
    }

    // State variables
    mapping(bytes32 => PrivateMessage[]) private conversationMessages;
    mapping(address => bytes32[]) private userConversations;
    uint256 private messageCounter;

    // Events
    event MessageSent(
        address indexed sender,
        address indexed recipient,
        bytes32 indexed conversationId,
        uint256 messageId,
        uint256 timestamp
    );

    /**
     * @dev Get conversation ID for two users
     * @param _user1 First user's address
     * @param _user2 Second user's address
     */
    function getConversationId(address _user1, address _user2) 
        public 
        pure 
        returns (bytes32) 
    {
        // Sort addresses to ensure consistent conversation ID
        if (_user1 < _user2) {
            return keccak256(abi.encodePacked(_user1, _user2));
        } else {
            return keccak256(abi.encodePacked(_user2, _user1));
        }
    }

    /**
     * @dev Send a private message
     * @param _recipient Recipient's address
     * @param _encryptedContent Encrypted message content
     */
    function sendPrivateMessage(address _recipient, string memory _encryptedContent) 
        public 
    {
        require(_recipient != address(0), "Invalid recipient");
        require(_recipient != msg.sender, "Cannot send message to yourself");
        require(bytes(_encryptedContent).length > 0, "Message cannot be empty");
        require(bytes(_encryptedContent).length <= 2000, "Message too long");

        bytes32 conversationId = getConversationId(msg.sender, _recipient);
        messageCounter++;

        PrivateMessage memory newMessage = PrivateMessage({
            sender: msg.sender,
            recipient: _recipient,
            encryptedContent: _encryptedContent,
            timestamp: block.timestamp,
            messageId: messageCounter
        });

        conversationMessages[conversationId].push(newMessage);

        // Track conversations for both users
        _addConversationToUser(msg.sender, conversationId);
        _addConversationToUser(_recipient, conversationId);

        emit MessageSent(
            msg.sender,
            _recipient,
            conversationId,
            messageCounter,
            block.timestamp
        );
    }

    /**
     * @dev Add conversation to user's conversation list
     * @param _user User's address
     * @param _conversationId Conversation ID
     */
    function _addConversationToUser(address _user, bytes32 _conversationId) 
        private 
    {
        bytes32[] storage conversations = userConversations[_user];
        
        // Check if conversation already exists
        for (uint256 i = 0; i < conversations.length; i++) {
            if (conversations[i] == _conversationId) {
                return;
            }
        }
        
        conversations.push(_conversationId);
    }

    /**
     * @dev Get messages in a conversation
     * @param _otherUser The other user in the conversation
     * @param _count Number of latest messages to retrieve
     */
    function getConversationMessages(address _otherUser, uint256 _count)
        public
        view
        returns (
            address[] memory senders,
            address[] memory recipients,
            string[] memory encryptedContents,
            uint256[] memory timestamps,
            uint256[] memory messageIds
        )
    {
        bytes32 conversationId = getConversationId(msg.sender, _otherUser);
        PrivateMessage[] storage msgs = conversationMessages[conversationId];

        if (_count > msgs.length) {
            _count = msgs.length;
        }

        senders = new address[](_count);
        recipients = new address[](_count);
        encryptedContents = new string[](_count);
        timestamps = new uint256[](_count);
        messageIds = new uint256[](_count);

        for (uint256 i = 0; i < _count; i++) {
            uint256 index = msgs.length - _count + i;
            PrivateMessage memory msg = msgs[index];
            senders[i] = msg.sender;
            recipients[i] = msg.recipient;
            encryptedContents[i] = msg.encryptedContent;
            timestamps[i] = msg.timestamp;
            messageIds[i] = msg.messageId;
        }

        return (senders, recipients, encryptedContents, timestamps, messageIds);
    }

    /**
     * @dev Get total message count in a conversation
     * @param _otherUser The other user in the conversation
     */
    function getConversationMessageCount(address _otherUser)
        public
        view
        returns (uint256)
    {
        bytes32 conversationId = getConversationId(msg.sender, _otherUser);
        return conversationMessages[conversationId].length;
    }

    /**
     * @dev Get user's conversation list
     * @param _user User's address
     */
    function getUserConversations(address _user)
        public
        view
        returns (bytes32[] memory)
    {
        return userConversations[_user];
    }

    /**
     * @dev Get total message count
     */
    function getTotalMessageCount() public view returns (uint256) {
        return messageCounter;
    }
}

