// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IOracleAdapter.sol";

/**
 * @title OracleAdapter
 * @notice Unified adapter for external price feeds
 */
contract OracleAdapter is IOracleAdapter, AccessControl {
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");

    mapping(bytes32 => uint256) private _prices; // symbol => price (1e18)
    mapping(bytes32 => address) private _feeds; // symbol => feed address

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ADMIN_ROLE, admin);
    }

    function setPrice(bytes32 symbol, uint256 price) external onlyRole(ORACLE_ADMIN_ROLE) {
        _prices[symbol] = price;
        emit PriceUpdated(symbol, price, block.timestamp);
    }

    function getPrice(bytes32 symbol) external view returns (uint256) {
        return _prices[symbol];
    }

    function setFeed(bytes32 symbol, address feed) external onlyRole(ORACLE_ADMIN_ROLE) {
        _feeds[symbol] = feed;
        emit FeedSet(symbol, feed);
    }

    function getFeed(bytes32 symbol) external view returns (address) {
        return _feeds[symbol];
    }
}