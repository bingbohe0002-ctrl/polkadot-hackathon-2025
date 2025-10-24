// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// ============================================================================
// LEGAL WRAPPER - Compliance & jurisdiction management
// ============================================================================
contract LegalWrapper is AccessControl {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    struct JurisdictionConfig {
        bool enabled;
        string jurisdiction;
        address[] whitelist;
        mapping(address => bool) isWhitelisted;
    }
    
    mapping(string => JurisdictionConfig) public jurisdictions;
    
    event JurisdictionEnabled(string jurisdiction);
    event AddressWhitelisted(string jurisdiction, address addr);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
    }
    
    function enableJurisdiction(string memory jurisdiction) external onlyRole(COMPLIANCE_ROLE) {
        jurisdictions[jurisdiction].enabled = true;
        jurisdictions[jurisdiction].jurisdiction = jurisdiction;
        emit JurisdictionEnabled(jurisdiction);
    }
    
    function whitelistAddress(
        string memory jurisdiction,
        address addr
    ) external onlyRole(COMPLIANCE_ROLE) {
        require(jurisdictions[jurisdiction].enabled, "Jurisdiction not enabled");
        jurisdictions[jurisdiction].isWhitelisted[addr] = true;
        jurisdictions[jurisdiction].whitelist.push(addr);
        emit AddressWhitelisted(jurisdiction, addr);
    }
    
    function isWhitelisted(
        string memory jurisdiction,
        address addr
    ) external view returns (bool) {
        return jurisdictions[jurisdiction].isWhitelisted[addr];
    }
}