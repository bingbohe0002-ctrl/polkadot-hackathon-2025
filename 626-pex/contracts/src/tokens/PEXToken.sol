// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PEXToken
 * @notice Simple ERC20 token used for governance voting demonstration.
 */
contract PEXToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("PEX Token", "PEX") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}