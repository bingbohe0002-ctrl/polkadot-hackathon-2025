//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title PulseGroups
 * @dev Decentralized group management for PulseChat
 */
contract PulseGroups {
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

    // State variables
    uint256 public groupCounter;
    mapping(uint256 => Group) public groups;
    mapping(uint256 => address[]) public groupMembers;
    mapping(uint256 => mapping(address => bool)) public isGroupMember;
    mapping(uint256 => GroupMessage[]) private groupMessages;

    // Events
    event GroupCreated(uint256 indexed groupId, string name, address indexed creator, uint256 timestamp);
    event GroupMemberAdded(uint256 indexed groupId, address indexed member, uint256 timestamp);
    event GroupMemberRemoved(uint256 indexed groupId, address indexed member, uint256 timestamp);
    event GroupMessageSent(uint256 indexed groupId, address indexed sender, string content, uint256 timestamp, uint256 messageId);

    /**
     * @dev Create a new group
     * @param _name Group name
     * @return groupId The ID of the created group
     */
    function createGroup(string memory _name) public returns (uint256) {
        require(bytes(_name).length > 0, "Group name cannot be empty");
        require(bytes(_name).length <= 100, "Group name too long");

        groupCounter++;
        uint256 newGroupId = groupCounter;

        groups[newGroupId] = Group({
            groupId: newGroupId,
            name: _name,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        // Add creator as first member
        groupMembers[newGroupId].push(msg.sender);
        isGroupMember[newGroupId][msg.sender] = true;

        emit GroupCreated(newGroupId, _name, msg.sender, block.timestamp);
        emit GroupMemberAdded(newGroupId, msg.sender, block.timestamp);

        return newGroupId;
    }

    /**
     * @dev Join a group
     * @param _groupId Group ID
     */
    function joinGroup(uint256 _groupId) public {
        require(groups[_groupId].exists, "Group does not exist");
        require(!isGroupMember[_groupId][msg.sender], "Already a member");

        groupMembers[_groupId].push(msg.sender);
        isGroupMember[_groupId][msg.sender] = true;

        emit GroupMemberAdded(_groupId, msg.sender, block.timestamp);
    }

    /**
     * @dev Leave a group
     * @param _groupId Group ID
     */
    function leaveGroup(uint256 _groupId) public {
        require(groups[_groupId].exists, "Group does not exist");
        require(isGroupMember[_groupId][msg.sender], "Not a member");

        isGroupMember[_groupId][msg.sender] = false;

        // Remove from members array
        address[] storage members = groupMembers[_groupId];
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == msg.sender) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }

        emit GroupMemberRemoved(_groupId, msg.sender, block.timestamp);
    }

    /**
     * @dev Send a message to a group
     * @param _groupId Group ID
     * @param _content Message content
     */
    function sendGroupMessage(uint256 _groupId, string memory _content) public {
        require(groups[_groupId].exists, "Group does not exist");
        require(isGroupMember[_groupId][msg.sender], "Not a member");
        require(bytes(_content).length > 0, "Message cannot be empty");
        require(bytes(_content).length <= 1000, "Message too long");

        GroupMessage[] storage msgs = groupMessages[_groupId];
        uint256 messageId = msgs.length;

        msgs.push(GroupMessage({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            messageId: messageId
        }));

        emit GroupMessageSent(_groupId, msg.sender, _content, block.timestamp, messageId);
    }

    /**
     * @dev Get group information
     * @param _groupId Group ID
     */
    function getGroup(uint256 _groupId) 
        public 
        view 
        returns (
            uint256 groupId,
            string memory name,
            address creator,
            uint256 createdAt,
            bool exists
        ) 
    {
        Group memory group = groups[_groupId];
        return (
            group.groupId,
            group.name,
            group.creator,
            group.createdAt,
            group.exists
        );
    }

    /**
     * @dev Get group members
     * @param _groupId Group ID
     */
    function getGroupMembers(uint256 _groupId) public view returns (address[] memory) {
        require(groups[_groupId].exists, "Group does not exist");
        return groupMembers[_groupId];
    }

    /**
     * @dev Get group member count
     * @param _groupId Group ID
     */
    function getGroupMemberCount(uint256 _groupId) public view returns (uint256) {
        require(groups[_groupId].exists, "Group does not exist");
        return groupMembers[_groupId].length;
    }

    /**
     * @dev Get latest group messages
     * @param _groupId Group ID
     * @param _count Number of messages to retrieve
     */
    function getLatestGroupMessages(uint256 _groupId, uint256 _count) 
        public 
        view 
        returns (
            address[] memory senders,
            string[] memory contents,
            uint256[] memory timestamps,
            uint256[] memory messageIds
        ) 
    {
        require(groups[_groupId].exists, "Group does not exist");

        GroupMessage[] storage msgs = groupMessages[_groupId];
        if (_count > msgs.length) {
            _count = msgs.length;
        }

        senders = new address[](_count);
        contents = new string[](_count);
        timestamps = new uint256[](_count);
        messageIds = new uint256[](_count);

        for (uint256 i = 0; i < _count; i++) {
            uint256 index = msgs.length - _count + i;
            GroupMessage memory msg = msgs[index];
            senders[i] = msg.sender;
            contents[i] = msg.content;
            timestamps[i] = msg.timestamp;
            messageIds[i] = msg.messageId;
        }

        return (senders, contents, timestamps, messageIds);
    }

    /**
     * @dev Get total group messages
     * @param _groupId Group ID
     */
    function getTotalGroupMessages(uint256 _groupId) public view returns (uint256) {
        require(groups[_groupId].exists, "Group does not exist");
        return groupMessages[_groupId].length;
    }

    /**
     * @dev Get all groups
     */
    function getAllGroups() 
        public 
        view 
        returns (
            uint256[] memory groupIds,
            string[] memory names,
            address[] memory creators,
            uint256[] memory createdAts
        ) 
    {
        uint256 count = groupCounter;
        groupIds = new uint256[](count);
        names = new string[](count);
        creators = new address[](count);
        createdAts = new uint256[](count);

        uint256 index = 0;
        for (uint256 i = 1; i <= groupCounter; i++) {
            if (groups[i].exists) {
                Group memory group = groups[i];
                groupIds[index] = group.groupId;
                names[index] = group.name;
                creators[index] = group.creator;
                createdAts[index] = group.createdAt;
                index++;
            }
        }

        return (groupIds, names, creators, createdAts);
    }

    /**
     * @dev Get total groups
     */
    function getTotalGroups() public view returns (uint256) {
        return groupCounter;
    }
}

