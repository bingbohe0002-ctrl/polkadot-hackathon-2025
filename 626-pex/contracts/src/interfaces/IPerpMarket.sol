// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPerpMarket
 * @notice Interface for perpetual futures market contract
 */
interface IPerpMarket {
    enum PositionSide { LONG, SHORT }

    struct Position {
        address trader;
        uint256 marketId;
        PositionSide side;
        uint256 size;
        uint256 entryPrice;
        uint256 leverage;
        uint256 margin;
        uint256 timestamp;
        int256 unrealizedPnl;
        uint256 lastFundingPayment;
    }

    struct Market {
        uint256 id;
        string symbol;
        string baseAsset;
        string quoteAsset;
        uint256 maxLeverage;
        uint256 minOrderSize;
        uint256 tickSize;
        uint256 fundingRate;
        uint256 lastFundingTime;
        uint256 openInterest;
        bool isActive;
    }

    struct FundingInfo {
        int256 fundingRate;
        uint256 fundingTime;
        uint256 nextFundingTime;
        int256 cumulativeFunding;
    }

    // Events
    event PositionOpened(
        address indexed trader,
        uint256 indexed marketId,
        PositionSide side,
        uint256 size,
        uint256 entryPrice,
        uint256 leverage,
        uint256 margin
    );

    event PositionClosed(
        address indexed trader,
        uint256 indexed marketId,
        uint256 size,
        uint256 exitPrice,
        int256 pnl
    );

    event PositionLiquidated(
        address indexed trader,
        address indexed liquidator,
        uint256 indexed marketId,
        uint256 size,
        uint256 liquidationPrice,
        uint256 liquidationFee
    );

    event FundingPayment(
        address indexed trader,
        uint256 indexed marketId,
        int256 fundingPayment,
        uint256 timestamp
    );

    event MarketCreated(
        uint256 indexed marketId,
        string symbol,
        string baseAsset,
        string quoteAsset
    );

    // Core Functions
    function openPosition(
        uint256 marketId,
        PositionSide side,
        uint256 size,
        uint256 leverage,
        uint256 acceptablePrice
    ) external returns (uint256 positionId);

    // Match engine hook: open position on behalf of trader
    function openPositionFor(
        address trader,
        uint256 marketId,
        PositionSide side,
        uint256 size,
        uint256 leverage,
        uint256 entryPrice
    ) external returns (uint256 positionId);

    function closePosition(
        uint256 positionId,
        uint256 size,
        uint256 acceptablePrice
    ) external returns (int256 pnl);

    function liquidatePosition(
        uint256 positionId
    ) external returns (uint256 liquidationReward);

    function updateFunding(uint256 marketId) external;

    function collectFunding(uint256 positionId) external returns (int256 fundingPayment);

    // View Functions
    function getPosition(uint256 positionId) external view returns (Position memory);

    function getPositionsByTrader(address trader) external view returns (uint256[] memory);

    function getMarket(uint256 marketId) external view returns (Market memory);

    function getAllMarkets() external view returns (Market[] memory);

    function calculateUnrealizedPnl(uint256 positionId, uint256 currentPrice) 
        external view returns (int256);

    function calculateLiquidationPrice(uint256 positionId) 
        external view returns (uint256);

    function calculateRequiredMargin(
        uint256 marketId,
        uint256 size,
        uint256 leverage
    ) external view returns (uint256);

    function getFundingInfo(uint256 marketId) external view returns (FundingInfo memory);

    function getOpenInterest(uint256 marketId) external view returns (uint256);

    function isPositionLiquidatable(uint256 positionId, uint256 currentPrice) 
        external view returns (bool);

    // Wiring
    function setMatchEngine(address matchEngine) external;
}