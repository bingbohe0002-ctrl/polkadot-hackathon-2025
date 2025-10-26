// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IGovernance
 * @notice Interface for protocol governance over parameters and roles
 */
interface IGovernance {
    event ParameterUpdated(bytes32 indexed key, uint256 oldValue, uint256 newValue);
    event AddressParameterUpdated(bytes32 indexed key, address indexed oldAddr, address indexed newAddr);

    function setParameter(bytes32 key, uint256 value) external;
    function getParameter(bytes32 key) external view returns (uint256);

    function setAddress(bytes32 key, address addr) external;
    function getAddress(bytes32 key) external view returns (address);
}