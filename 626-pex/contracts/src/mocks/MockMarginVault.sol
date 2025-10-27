// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IMarginVault.sol";

/**
 * @title MockMarginVault
 * @notice Minimal mock implementation of IMarginVault for testing OrderBook
 */
contract MockMarginVault is IMarginVault {
    struct AccountSimple {
        MarginMode mode;
        uint256 totalCollateral;
        uint256 totalMargin;
        uint256 availableBalance;
        int256 unrealizedPnl;
    }

    mapping(address => AccountSimple) private accounts;
    mapping(address => mapping(address => uint256)) private tokenBalances;
    mapping(address => CollateralInfo) private collaterals;

    // --- Core Functions ---
    function deposit(address token, uint256 amount) external {
        tokenBalances[msg.sender][token] += amount;
        accounts[msg.sender].totalCollateral += amount;
        accounts[msg.sender].availableBalance += amount;
        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    function withdraw(address token, uint256 amount) external {
        require(tokenBalances[msg.sender][token] >= amount, "insufficient");
        tokenBalances[msg.sender][token] -= amount;
        accounts[msg.sender].totalCollateral -= amount;
        accounts[msg.sender].availableBalance -= amount;
        emit Withdraw(msg.sender, token, amount, block.timestamp);
    }

    function allocateMargin(
        address user,
        uint256 /*marketId*/,
        uint256 amount,
        MarginMode /*mode*/
    ) external {
        accounts[user].totalMargin += amount;
        if (accounts[user].availableBalance >= amount) {
            accounts[user].availableBalance -= amount;
        }
        emit MarginAllocated(user, 0, amount, accounts[user].mode);
    }

    function releaseMargin(
        address user,
        uint256 /*marketId*/,
        uint256 amount
    ) external {
        if (accounts[user].totalMargin >= amount) {
            accounts[user].totalMargin -= amount;
        }
        accounts[user].availableBalance += amount;
        emit MarginReleased(user, 0, amount);
    }

    function liquidateAccount(
        address /*user*/,
        uint256 /*marketId*/,
        uint256 /*liquidationAmount*/
    ) external pure returns (uint256 liquidationReward) {
        return 0;
    }

    function setMarginMode(MarginMode mode) external {
        MarginMode oldMode = accounts[msg.sender].mode;
        accounts[msg.sender].mode = mode;
        emit MarginModeChanged(msg.sender, oldMode, mode);
    }

    // --- View Functions ---
    function getAccountInfo(address user) external view returns (
        MarginMode marginMode,
        uint256 totalCollateral,
        uint256 totalMargin,
        uint256 availableBalance,
        int256 unrealizedPnl
    ) {
        AccountSimple memory a = accounts[user];
        return (a.mode, a.totalCollateral, a.totalMargin, a.availableBalance, a.unrealizedPnl);
    }

    function getTokenBalance(address user, address token) external view returns (uint256) {
        return tokenBalances[user][token];
    }

    function getMarketMargin(address /*user*/, uint256 /*marketId*/) external pure returns (uint256) {
        return 0;
    }

    function getCollateralInfo(address token) external view returns (CollateralInfo memory) {
        return collaterals[token];
    }

    function getAllCollaterals() external view returns (CollateralInfo[] memory) {
        // return empty for simplicity
        return new CollateralInfo[](0);
    }

    function calculateAccountValue(address user) external view returns (uint256) {
        AccountSimple memory a = accounts[user];
        if (a.unrealizedPnl < 0) {
            return a.totalCollateral + a.totalMargin;
        } else {
            return a.totalCollateral + a.totalMargin + uint256(a.unrealizedPnl);
        }
    }

    function calculateMaintenanceMargin(address /*user*/) external pure returns (uint256) {
        return 0;
    }

    function calculateAvailableBalance(address user) external view returns (uint256) {
        return accounts[user].availableBalance;
    }

    function isAccountLiquidatable(address /*user*/) external pure returns (bool) {
        return false;
    }

    function getAccountHealthRatio(address /*user*/) external pure returns (uint256) {
        return 1e18;
    }

    function canWithdraw(address user, address token, uint256 amount) external view returns (bool) {
        return tokenBalances[user][token] >= amount;
    }

    function getMaxWithdrawable(address user, address token) external view returns (uint256) {
        return tokenBalances[user][token];
    }

    // --- Admin Functions ---
    function addCollateral(address token, uint256 weight) external {
        collaterals[token] = CollateralInfo({ token: token, balance: 0, weight: weight, isActive: true });
        emit CollateralAdded(token, weight);
    }

    function updateCollateralWeight(address token, uint256 newWeight) external {
        uint256 oldWeight = collaterals[token].weight;
        collaterals[token].weight = newWeight;
        emit CollateralUpdated(token, oldWeight, newWeight);
    }

    function setCollateralStatus(address token, bool isActive) external {
        collaterals[token].isActive = isActive;
    }
}