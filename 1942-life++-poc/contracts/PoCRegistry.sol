// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CognitiveAssetToken.sol";

// ============================================================================
// POC REGISTRY - Agent registration & CID management
// ============================================================================
contract PoCRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct Agent {
        address agentAddr;
        bytes32 agentMetaHash;
        uint256 registeredAt;
        bool active;
        uint256 stakeAmount;
    }
    
    mapping(bytes32 => Agent) public agents; // cid => Agent
    mapping(address => bytes32) public addressToCid;
    
    event AgentRegistered(bytes32 indexed cid, address indexed agentAddr, bytes32 agentMetaHash);
    event AgentRevoked(bytes32 indexed cid);
    event AgentStaked(bytes32 indexed cid, uint256 amount);
    
    CognitiveAssetToken public catkToken;
    
    constructor(address _catkToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        catkToken = CognitiveAssetToken(_catkToken);
    }
    
    function registerAgent(
        address agentAddr,
        bytes32 agentMetaHash,
        uint256 stakeAmount
    ) external returns (bytes32 cid) {
        require(addressToCid[agentAddr] == bytes32(0), "Agent already registered");
        require(stakeAmount > 0, "Stake required");
        
        // Transfer stake
        require(catkToken.transferFrom(msg.sender, address(this), stakeAmount), "Stake transfer failed");
        
        cid = keccak256(abi.encodePacked(agentAddr, agentMetaHash, block.timestamp));
        
        agents[cid] = Agent({
            agentAddr: agentAddr,
            agentMetaHash: agentMetaHash,
            registeredAt: block.timestamp,
            active: true,
            stakeAmount: stakeAmount
        });
        
        addressToCid[agentAddr] = cid;
        
        emit AgentRegistered(cid, agentAddr, agentMetaHash);
        emit AgentStaked(cid, stakeAmount);
        
        return cid;
    }
    
    function revokeAgent(bytes32 cid) external onlyRole(ADMIN_ROLE) {
        require(agents[cid].active, "Agent not active");
        agents[cid].active = false;
        emit AgentRevoked(cid);
    }
    
    function isAgentActive(bytes32 cid) external view returns (bool) {
        return agents[cid].active;
    }
    
    function getAgent(bytes32 cid) external view returns (Agent memory) {
        return agents[cid];
    }
}
