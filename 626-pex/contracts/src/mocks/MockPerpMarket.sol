// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IPerpMarket.sol";

/**
 * @title MockPerpMarket
 * @notice Minimal mock implementation of IPerpMarket for testing OrderBook
 */
contract MockPerpMarket is IPerpMarket {
    // storage
    mapping(uint256 => Market) private markets;
    uint256[] private marketIds;
    address public matchEngine;

    // helper to create or update a market with active flag
    function setMarketActive(uint256 id, bool active) external {
        Market storage m = markets[id];
        if (m.id == 0) {
            m.id = id;
            m.symbol = "TST";
            marketIds.push(id);
        }
        m.baseAsset = "BASE";
        m.quoteAsset = "QUOTE";
        m.maxLeverage = 100;
        m.minOrderSize = 1;
        m.tickSize = 1;
        m.fundingRate = 0;
        m.lastFundingTime = block.timestamp;
        m.openInterest = 0;
        m.isActive = active;
    }

    // --- Core functions (stubs) ---
    function openPosition(
        uint256,
        PositionSide,
        uint256,
        uint256,
        uint256
    ) external pure returns (uint256 positionId) {
        return 1;
    }

    function openPositionFor(
        address,
        uint256,
        PositionSide,
        uint256,
        uint256,
        uint256
    ) external pure returns (uint256 positionId) {
        return 1;
    }

    function closePosition(
        uint256,
        uint256,
        uint256
    ) external pure returns (int256 pnl) {
        return 0;
    }

    function liquidatePosition(
        uint256
    ) external pure returns (uint256 liquidationReward) {
        return 0;
    }

    function updateFunding(uint256) external pure {}

    function collectFunding(uint256) external pure returns (int256 fundingPayment) {
        return 0;
    }

    // --- View functions ---
    function getPosition(uint256) external pure returns (Position memory) {
        return Position({
            trader: address(0),
            marketId: 0,
            side: PositionSide.LONG,
            size: 0,
            entryPrice: 0,
            leverage: 0,
            margin: 0,
            timestamp: 0,
            unrealizedPnl: 0,
            lastFundingPayment: 0
        });
    }

    function getPositionsByTrader(address) external pure returns (uint256[] memory) {
        return new uint256[](0);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        Market memory m = markets[marketId];
        return m;
    }

    function getAllMarkets() external view returns (Market[] memory) {
        Market[] memory arr = new Market[](marketIds.length);
        for (uint256 i = 0; i < marketIds.length; i++) {
            arr[i] = markets[marketIds[i]];
        }
        return arr;
    }

    function calculateUnrealizedPnl(uint256, uint256) external pure returns (int256) {
        return 0;
    }

    function calculateLiquidationPrice(uint256) external pure returns (uint256) {
        return 0;
    }

    function calculateRequiredMargin(
        uint256,
        uint256,
        uint256
    ) external pure returns (uint256) {
        return 0;
    }

    function getFundingInfo(uint256) external pure returns (FundingInfo memory) {
        return FundingInfo({
            fundingRate: 0,
            fundingTime: 0,
            nextFundingTime: 0,
            cumulativeFunding: 0
        });
    }

    function getOpenInterest(uint256) external pure returns (uint256) {
        return 0;
    }

    function isPositionLiquidatable(uint256, uint256) external pure returns (bool) {
        return false;
    }

    function setMatchEngine(address _engine) external {
        matchEngine = _engine;
    }
}