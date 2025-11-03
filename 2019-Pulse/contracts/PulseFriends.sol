//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title PulseFriends
 * @dev Decentralized friend management for PulseChat
 */
contract PulseFriends {
    // State variables
    mapping(address => address[]) public userFriends;
    mapping(address => mapping(address => bool)) public isFriend;

    // Events
    event FriendAdded(address indexed user, address indexed friend, uint256 timestamp);
    event FriendRemoved(address indexed user, address indexed friend, uint256 timestamp);

    /**
     * @dev Add a friend
     * @param _friend Friend's address
     */
    function addFriend(address _friend) public {
        require(_friend != address(0), "Invalid friend address");
        require(_friend != msg.sender, "Cannot add yourself as friend");
        require(!isFriend[msg.sender][_friend], "Already friends");

        userFriends[msg.sender].push(_friend);
        isFriend[msg.sender][_friend] = true;

        emit FriendAdded(msg.sender, _friend, block.timestamp);
    }

    /**
     * @dev Remove a friend
     * @param _friend Friend's address
     */
    function removeFriend(address _friend) public {
        require(isFriend[msg.sender][_friend], "Not friends");

        isFriend[msg.sender][_friend] = false;

        // Remove from array
        address[] storage friends = userFriends[msg.sender];
        for (uint256 i = 0; i < friends.length; i++) {
            if (friends[i] == _friend) {
                friends[i] = friends[friends.length - 1];
                friends.pop();
                break;
            }
        }

        emit FriendRemoved(msg.sender, _friend, block.timestamp);
    }

    /**
     * @dev Get user's friends
     * @param _user User's address
     */
    function getFriends(address _user) public view returns (address[] memory) {
        return userFriends[_user];
    }

    /**
     * @dev Get friend count
     * @param _user User's address
     */
    function getFriendCount(address _user) public view returns (uint256) {
        return userFriends[_user].length;
    }

    /**
     * @dev Check if two users are friends
     * @param _user1 First user's address
     * @param _user2 Second user's address
     */
    function areFriends(address _user1, address _user2) public view returns (bool) {
        return isFriend[_user1][_user2];
    }
}

