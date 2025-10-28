// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IVotingTicket
 * @dev Interface for VotingTicket contract with mint and burn functions
 */
interface IVotingTicket {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}



