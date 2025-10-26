// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IMarginVault.sol";

/**
 * @title MarginVault
 * @notice Manages user collateral and margin allocations
 */
contract MarginVault is IMarginVault, AccessControl, ReentrancyGuard {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // User balances per token
    mapping(address => mapping(address => uint256)) private _balances; // user => token => balance
    // Margin allocations per market
    mapping(address => mapping(uint256 => uint256)) private _marketMargins; // user => marketId => margin
    // Aggregate total margin per user
    mapping(address => uint256) private _totalMargin; // user => total allocated margin
    // Margin mode per user
    mapping(address => MarginMode) private _marginMode;

    // Collateral configuration
    mapping(address => CollateralInfo) private _collaterals; // token => info
    address[] private _collateralList;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    // Core Functions
    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        _balances[msg.sender][token] += amount;
        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        require(_balances[msg.sender][token] >= amount, "insufficient");
        _balances[msg.sender][token] -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdraw(msg.sender, token, amount, block.timestamp);
    }

    function allocateMargin(
        address user,
        uint256 marketId,
        uint256 amount,
        MarginMode mode
    ) external {
        _marketMargins[user][marketId] += amount;
        _totalMargin[user] += amount;
        _marginMode[user] = mode;
        emit MarginAllocated(user, marketId, amount, mode);
    }

    function releaseMargin(
        address user,
        uint256 marketId,
        uint256 amount
    ) external {
        uint256 m = _marketMargins[user][marketId];
        require(m >= amount, "insufficient margin");
        _marketMargins[user][marketId] = m - amount;
        _totalMargin[user] -= amount;
        emit MarginReleased(user, marketId, amount);
    }

    function liquidateAccount(
        address /*user*/,
        uint256 /*marketId*/,
        uint256 /*liquidationAmount*/
    ) external pure returns (uint256 liquidationReward) {
        return 0;
    }

    function setMarginMode(MarginMode mode) external {
        MarginMode old = _marginMode[msg.sender];
        _marginMode[msg.sender] = mode;
        emit MarginModeChanged(msg.sender, old, mode);
    }

    // View Functions
    function getAccountInfo(address user) external view returns (
        MarginMode marginMode,
        uint256 totalCollateral,
        uint256 totalMargin,
        uint256 availableBalance,
        int256 unrealizedPnl
    ) {
        marginMode = _marginMode[user];
        // Aggregate balances from known collaterals
        for (uint256 i = 0; i < _collateralList.length; i++) {
            address t = _collateralList[i];
            totalCollateral += _balances[user][t];
        }
        // Aggregate margin across markets
        totalMargin = _totalMargin[user];
        availableBalance = totalCollateral > totalMargin ? (totalCollateral - totalMargin) : 0;
        unrealizedPnl = 0;
    }

    function getTokenBalance(address user, address token) external view returns (uint256) {
        return _balances[user][token];
    }

    function getMarketMargin(address user, uint256 marketId) external view returns (uint256) {
        return _marketMargins[user][marketId];
    }

    function getCollateralInfo(address token) external view returns (CollateralInfo memory) {
        return _collaterals[token];
    }

    function getAllCollaterals() external view returns (CollateralInfo[] memory list) {
        list = new CollateralInfo[](_collateralList.length);
        for (uint256 i = 0; i < _collateralList.length; i++) {
            list[i] = _collaterals[_collateralList[i]];
        }
    }

    function calculateAccountValue(address user) external view returns (uint256) {
        ( , uint256 totalCollateral, uint256 totalMargin, , ) = this.getAccountInfo(user);
        return totalCollateral > totalMargin ? (totalCollateral - totalMargin) : 0;
    }

    function calculateMaintenanceMargin(address /*user*/) external pure returns (uint256) {
        return 0;
    }

    function calculateAvailableBalance(address user) external view returns (uint256) {
        ( , , , uint256 available, ) = this.getAccountInfo(user);
        return available;
    }

    function isAccountLiquidatable(address /*user*/) external pure returns (bool) {
        return false;
    }

    function getAccountHealthRatio(address /*user*/) external pure returns (uint256) {
        return 0;
    }

    function canWithdraw(address user, address token, uint256 amount) external view returns (bool) {
        return _balances[user][token] >= amount;
    }

    function getMaxWithdrawable(address user, address token) external view returns (uint256) {
        return _balances[user][token];
    }

    // Admin Functions
    function addCollateral(address token, uint256 weight) external onlyRole(GOVERNANCE_ROLE) {
        CollateralInfo storage info = _collaterals[token];
        if (info.token == address(0)) {
            _collateralList.push(token);
            info.token = token;
        }
        info.weight = weight;
        info.isActive = true;
        emit CollateralAdded(token, weight);
    }

    function updateCollateralWeight(address token, uint256 newWeight) external onlyRole(GOVERNANCE_ROLE) {
        CollateralInfo storage info = _collaterals[token];
        uint256 old = info.weight;
        info.weight = newWeight;
        emit CollateralUpdated(token, old, newWeight);
    }

    function setCollateralStatus(address token, bool isActive) external onlyRole(GOVERNANCE_ROLE) {
        _collaterals[token].isActive = isActive;
    }
}