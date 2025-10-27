// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMarginVault
 * @notice Interface for margin vault that manages user collateral and margin requirements
 */
interface IMarginVault {
    enum MarginMode { ISOLATED, CROSS }

    struct Account {
        address owner;
        MarginMode marginMode;
        uint256 totalCollateral;
        uint256 totalMargin;
        uint256 availableBalance;
        uint256 unrealizedPnl;
        mapping(address => uint256) tokenBalances;
        mapping(uint256 => uint256) marketMargins; // marketId => margin
    }

    struct CollateralInfo {
        address token;
        uint256 balance;
        uint256 weight; // Collateral weight (e.g., 0.8 for 80%)
        bool isActive;
    }

    // Events
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event Withdraw(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event MarginAllocated(
        address indexed user,
        uint256 indexed marketId,
        uint256 amount,
        MarginMode mode
    );

    event MarginReleased(
        address indexed user,
        uint256 indexed marketId,
        uint256 amount
    );

    event MarginModeChanged(
        address indexed user,
        MarginMode oldMode,
        MarginMode newMode
    );

    event CollateralAdded(
        address indexed token,
        uint256 weight
    );

    event CollateralUpdated(
        address indexed token,
        uint256 oldWeight,
        uint256 newWeight
    );

    // Core Functions
    function deposit(address token, uint256 amount) external;

    function withdraw(address token, uint256 amount) external;

    function allocateMargin(
        address user,
        uint256 marketId,
        uint256 amount,
        MarginMode mode
    ) external;

    function releaseMargin(
        address user,
        uint256 marketId,
        uint256 amount
    ) external;

    function liquidateAccount(
        address user,
        uint256 marketId,
        uint256 liquidationAmount
    ) external returns (uint256 liquidationReward);

    function setMarginMode(MarginMode mode) external;

    // View Functions
    function getAccountInfo(address user) external view returns (
        MarginMode marginMode,
        uint256 totalCollateral,
        uint256 totalMargin,
        uint256 availableBalance,
        int256 unrealizedPnl
    );

    function getTokenBalance(address user, address token) external view returns (uint256);

    function getMarketMargin(address user, uint256 marketId) external view returns (uint256);

    function getCollateralInfo(address token) external view returns (CollateralInfo memory);

    function getAllCollaterals() external view returns (CollateralInfo[] memory);

    function calculateAccountValue(address user) external view returns (uint256);

    function calculateMaintenanceMargin(address user) external view returns (uint256);

    function calculateAvailableBalance(address user) external view returns (uint256);

    function isAccountLiquidatable(address user) external view returns (bool);

    function getAccountHealthRatio(address user) external view returns (uint256);

    function canWithdraw(address user, address token, uint256 amount) external view returns (bool);

    function getMaxWithdrawable(address user, address token) external view returns (uint256);

    // Admin Functions
    function addCollateral(address token, uint256 weight) external;

    function updateCollateralWeight(address token, uint256 newWeight) external;

    function setCollateralStatus(address token, bool isActive) external;
}