// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IGovernance.sol";

/**
 * @title Governance
 * @notice Minimal governance storage for protocol parameters
 */
contract Governance is IGovernance, AccessControl {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    mapping(bytes32 => uint256) private _uintParams;
    mapping(bytes32 => address) private _addressParams;

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    function setParameter(bytes32 key, uint256 value) external onlyRole(GOVERNANCE_ROLE) {
        uint256 old = _uintParams[key];
        _uintParams[key] = value;
        emit ParameterUpdated(key, old, value);
    }

    function getParameter(bytes32 key) external view returns (uint256) {
        return _uintParams[key];
    }

    function setAddress(bytes32 key, address addr) external onlyRole(GOVERNANCE_ROLE) {
        address old = _addressParams[key];
        _addressParams[key] = addr;
        emit AddressParameterUpdated(key, old, addr);
    }

    function getAddress(bytes32 key) external view returns (address) {
        return _addressParams[key];
    }
}