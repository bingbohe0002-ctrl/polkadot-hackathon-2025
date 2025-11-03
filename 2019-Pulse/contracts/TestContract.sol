//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract TestContract {
    mapping(address => bool) public isRegistered;
    mapping(address => uint256) public counter;

    function register() public {
        isRegistered[msg.sender] = true;
        counter[msg.sender] = 1;
    }

    function getCounter(address _user) public view returns (uint256) {
        return counter[_user];
    }

    function checkRegistered(address _user) public view returns (bool) {
        return isRegistered[_user];
    }
}

