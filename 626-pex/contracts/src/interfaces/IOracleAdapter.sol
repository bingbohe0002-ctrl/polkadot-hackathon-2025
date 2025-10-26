// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IOracleAdapter
 * @notice Interface for unified oracle access (Chainlink/DIA/Band)
 */
interface IOracleAdapter {
    event PriceUpdated(bytes32 indexed symbol, uint256 price, uint256 timestamp);
    event FeedSet(bytes32 indexed symbol, address indexed feed);

    function setPrice(bytes32 symbol, uint256 price) external;
    function getPrice(bytes32 symbol) external view returns (uint256);

    function setFeed(bytes32 symbol, address feed) external;
    function getFeed(bytes32 symbol) external view returns (address);
}