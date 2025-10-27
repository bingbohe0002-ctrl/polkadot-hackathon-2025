// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IFeeCollector
 * @notice Interface for collecting and distributing protocol fees
 */
interface IFeeCollector {
    event FeesAccrued(
        uint256 indexed marketId,
        address indexed token,
        uint256 makerFee,
        uint256 takerFee
    );

    event FeesDistributed(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    function accrueMakerFee(uint256 marketId, address token, uint256 amount) external;

    function accrueTakerFee(uint256 marketId, address token, uint256 amount) external;

    function distribute(address token, address to, uint256 amount) external;

    function getFeeBalance(address token) external view returns (uint256);

    function setTreasury(address newTreasury) external;
}