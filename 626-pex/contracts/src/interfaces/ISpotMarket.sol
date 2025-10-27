// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISpotMarket {
    struct Market {
        uint256 id;
        address baseToken;
        address quoteToken;
        string symbol; // e.g. "PEX/USDC"
        bool isActive;
        uint8 baseDecimals;
        uint8 quoteDecimals;
        bool baseIsNative;
        bool quoteIsNative;
    }

    event MarketAdded(uint256 indexed id, address baseToken, address quoteToken, string symbol);
    event MarketActivated(uint256 indexed id);

    function addMarket(address baseToken, address quoteToken, string memory symbol, bool baseIsNative, bool quoteIsNative) external returns (uint256);
    function activateMarket(uint256 marketId) external;
    function getMarket(uint256 marketId) external view returns (Market memory);
    function getAllMarkets() external view returns (Market[] memory);
    function isMarketActive(uint256 marketId) external view returns (bool);
}