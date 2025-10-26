// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IRiskEngine
 * @notice Interface for risk management engine that handles liquidations and risk parameters
 */
interface IRiskEngine {
    struct RiskParameters {
        uint256 maintenanceMarginRatio; // e.g., 5% = 500 (basis points)
        uint256 initialMarginRatio;     // e.g., 10% = 1000 (basis points)
        uint256 liquidationFeeRatio;    // e.g., 2.5% = 250 (basis points)
        uint256 maxLeverage;            // e.g., 20x = 20
        uint256 maxPositionSize;        // Maximum position size in base asset
        uint256 maxOpenInterest;        // Maximum open interest for the market
    }

    struct LiquidationInfo {
        address trader;
        uint256 positionId;
        uint256 marketId;
        uint256 liquidationPrice;
        uint256 liquidationSize;
        uint256 liquidationFee;
        address liquidator;
        uint256 timestamp;
    }

    struct AccountRisk {
        address account;
        uint256 totalCollateral;
        uint256 totalMargin;
        uint256 maintenanceMargin;
        uint256 healthRatio;
        bool isLiquidatable;
        uint256[] liquidatablePositions;
    }

    // Events
    event RiskParametersUpdated(
        uint256 indexed marketId,
        uint256 maintenanceMarginRatio,
        uint256 initialMarginRatio,
        uint256 liquidationFeeRatio,
        uint256 maxLeverage
    );

    event LiquidationTriggered(
        address indexed trader,
        address indexed liquidator,
        uint256 indexed positionId,
        uint256 marketId,
        uint256 liquidationPrice,
        uint256 liquidationSize,
        uint256 liquidationFee
    );

    event AccountFlagged(
        address indexed account,
        uint256 healthRatio,
        uint256 timestamp
    );

    event EmergencyStop(
        uint256 indexed marketId,
        string reason,
        uint256 timestamp
    );

    // Core Functions
    function checkLiquidation(address trader, uint256 positionId) 
        external returns (bool shouldLiquidate);

    function executeLiquidation(
        address trader,
        uint256 positionId,
        address liquidator
    ) external returns (uint256 liquidationReward);

    function updateRiskParameters(
        uint256 marketId,
        RiskParameters calldata params
    ) external;

    function emergencyStop(uint256 marketId, string calldata reason) external;

    function resumeMarket(uint256 marketId) external;

    // View Functions
    function getRiskParameters(uint256 marketId) 
        external view returns (RiskParameters memory);

    function calculateHealthRatio(address trader) external view returns (uint256);

    function calculateMaintenanceMargin(address trader) external view returns (uint256);

    function calculateLiquidationPrice(uint256 positionId) external view returns (uint256);

    function isPositionLiquidatable(uint256 positionId) external view returns (bool);

    function getAccountRisk(address trader) external view returns (AccountRisk memory);

    function getLiquidatableAccounts() external view returns (address[] memory);

    function getLiquidationHistory(address trader) 
        external view returns (LiquidationInfo[] memory);

    function isMarketActive(uint256 marketId) external view returns (bool);

    function canOpenPosition(
        address trader,
        uint256 marketId,
        uint256 size,
        uint256 leverage
    ) external view returns (bool, string memory reason);

    function calculateRequiredMargin(
        uint256 marketId,
        uint256 size,
        uint256 leverage
    ) external view returns (uint256 initialMargin, uint256 maintenanceMargin);

    function getMaxAllowedLeverage(address trader, uint256 marketId) 
        external view returns (uint256);

    function getMaxPositionSize(address trader, uint256 marketId) 
        external view returns (uint256);

    // Liquidation Incentives
    function calculateLiquidationReward(uint256 positionId) 
        external view returns (uint256);

    function getLiquidationQueue() external view returns (uint256[] memory positionIds);

    // Risk Monitoring
    function getSystemRisk() external view returns (
        uint256 totalCollateral,
        uint256 totalOpenInterest,
        uint256 averageHealthRatio,
        uint256 liquidatableAccountsCount
    );
}