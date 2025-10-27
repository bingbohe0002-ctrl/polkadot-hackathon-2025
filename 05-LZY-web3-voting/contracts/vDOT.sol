// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title vDOT
 * @dev vDOT wrapped token contract - deposit ETH to mint vDOT, burn vDOT to redeem ETH
 * 1:1 ratio between ETH and vDOT
 */
contract vDOT is ERC20, Ownable, Pausable, ReentrancyGuard {
    uint8 private _decimals = 18;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor() ERC20("Wrapped DOT", "vDOT") Ownable(msg.sender) {}

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Deposit ETH and mint vDOT tokens at 1:1 ratio
     */
    function deposit() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must deposit more than 0");
        
        // Mint vDOT tokens 1:1 with deposited ETH
        _mint(msg.sender, msg.value);
        
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Burn vDOT tokens and withdraw ETH at 1:1 ratio
     * @param amount Amount of vDOT to burn
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Must withdraw more than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient vDOT balance");
        require(address(this).balance >= amount, "Insufficient contract ETH balance");
        
        // Burn vDOT tokens
        _burn(msg.sender, amount);
        
        // Transfer ETH back to user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @dev Get contract ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Fallback function to accept ETH deposits
     */
    receive() external payable {
        require(msg.value > 0, "Must deposit more than 0");
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}

