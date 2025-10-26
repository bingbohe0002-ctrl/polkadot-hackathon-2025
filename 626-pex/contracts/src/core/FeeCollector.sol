// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IFeeCollector.sol";

/**
 * @title FeeCollector
 * @notice Collects maker/taker fees and distributes to treasury/DAO
 */
contract FeeCollector is IFeeCollector, AccessControl, ReentrancyGuard {
    bytes32 public constant TREASURY_MANAGER_ROLE = keccak256("TREASURY_MANAGER_ROLE");

    address public treasury;

    // token => total fees
    mapping(address => uint256) private _feeBalances;

    constructor(address admin, address treasury_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURY_MANAGER_ROLE, admin);
        treasury = treasury_;
    }

    function accrueMakerFee(uint256 marketId, address token, uint256 amount) external {
        _feeBalances[token] += amount;
        emit FeesAccrued(marketId, token, amount, 0);
    }

    function accrueTakerFee(uint256 marketId, address token, uint256 amount) external {
        _feeBalances[token] += amount;
        emit FeesAccrued(marketId, token, 0, amount);
    }

    function distribute(address token, address to, uint256 amount) external nonReentrant onlyRole(TREASURY_MANAGER_ROLE) {
        require(_feeBalances[token] >= amount, "insufficient fees");
        _feeBalances[token] -= amount;
        IERC20(token).transfer(to, amount);
        emit FeesDistributed(token, to, amount);
    }

    function getFeeBalance(address token) external view returns (uint256) {
        return _feeBalances[token];
    }

    function setTreasury(address newTreasury) external onlyRole(TREASURY_MANAGER_ROLE) {
        address old = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(old, newTreasury);
    }
}