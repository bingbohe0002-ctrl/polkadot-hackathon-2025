// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "zero address");
        uint256 bal = balanceOf[msg.sender];
        require(bal >= value, "insufficient");
        unchecked { balanceOf[msg.sender] = bal - value; }
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(to != address(0), "zero address");
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "not allowed");
        uint256 bal = balanceOf[from];
        require(bal >= value, "insufficient");
        unchecked {
            allowance[from][msg.sender] = allowed - value;
            balanceOf[from] = bal - value;
        }
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) external onlyOwner {
        require(to != address(0), "zero address");
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
}