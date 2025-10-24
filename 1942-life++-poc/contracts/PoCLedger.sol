// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PoCRegistry.sol";
import "./ActionProofNFT.sol";

// ============================================================================
// POC LEDGER - Submit & verify cognitive proofs
// ============================================================================
contract PoCLedger is AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    enum ProofStatus { PENDING, VERIFIED, REJECTED }
    
    struct Proof {
        bytes32 cid;
        bytes32 inputHash;
        bytes32 reasoningHash;
        bytes32 outputHash;
        string metadataCID; // IPFS CID
        uint256 timestamp;
        ProofStatus status;
        address[] attestedBy;
        uint256 chainRank;
    }
    
    mapping(bytes32 => Proof) public proofs; // proofId => Proof
    mapping(bytes32 => mapping(address => bool)) public hasAttested; // proofId => validator => bool
    
    uint256 public requiredAttestations = 3;
    uint256 public submissionTimeWindow = 120; // seconds
    
    PoCRegistry public registry;
    ActionProofNFT public aNFT;
    
    event ProofSubmitted(bytes32 indexed proofId, bytes32 indexed cid, string metadataCID);
    event ProofAttested(bytes32 indexed proofId, address indexed validator);
    event ProofVerified(bytes32 indexed proofId, uint256 nftTokenId);
    event ProofRejected(bytes32 indexed proofId);
    event ChainRankUpdated(bytes32 indexed cid, uint256 chainRank);
    
    constructor(address _registry, address _aNFT) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        registry = PoCRegistry(_registry);
        aNFT = ActionProofNFT(_aNFT);
    }
    
    function submitProof(
        bytes32 cid,
        bytes32 inputHash,
        bytes32 reasoningHash,
        bytes32 outputHash,
        string memory metadataCID
    ) external returns (bytes32 proofId) {
        require(registry.isAgentActive(cid), "Agent not active");
        
        proofId = keccak256(abi.encodePacked(
            cid,
            inputHash,
            reasoningHash,
            outputHash,
            block.timestamp
        ));
        
        require(proofs[proofId].timestamp == 0, "Proof already exists");
        
        proofs[proofId] = Proof({
            cid: cid,
            inputHash: inputHash,
            reasoningHash: reasoningHash,
            outputHash: outputHash,
            metadataCID: metadataCID,
            timestamp: block.timestamp,
            status: ProofStatus.PENDING,
            attestedBy: new address[](0),
            chainRank: 0
        });
        
        emit ProofSubmitted(proofId, cid, metadataCID);
        return proofId;
    }
    
    function attestProof(
        bytes32 proofId,
        bool approve
    ) external onlyRole(VALIDATOR_ROLE) {
        Proof storage proof = proofs[proofId];
        require(proof.timestamp > 0, "Proof does not exist");
        require(proof.status == ProofStatus.PENDING, "Proof already finalized");
        require(!hasAttested[proofId][msg.sender], "Already attested");
        require(
            block.timestamp <= proof.timestamp + submissionTimeWindow,
            "Attestation window closed"
        );
        
        hasAttested[proofId][msg.sender] = true;
        
        if (approve) {
            proof.attestedBy.push(msg.sender);
            emit ProofAttested(proofId, msg.sender);
            
            // Check if threshold reached
            if (proof.attestedBy.length >= requiredAttestations) {
                proof.status = ProofStatus.VERIFIED;
                
                // Mint aNFT
                PoCRegistry.Agent memory agent = registry.getAgent(proof.cid);
                uint256 tokenId = aNFT.mintProofNFT(
                    agent.agentAddr,
                    proofId,
                    proof.cid,
                    proof.metadataCID
                );
                
                emit ProofVerified(proofId, tokenId);
            }
        } else {
            proof.status = ProofStatus.REJECTED;
            emit ProofRejected(proofId);
        }
    }
    
    function updateChainRank(bytes32 cid, uint256 newRank) external onlyRole(ORACLE_ROLE) {
        // Oracle updates ChainRank for an agent
        emit ChainRankUpdated(cid, newRank);
    }
    
    function getProof(bytes32 proofId) external view returns (Proof memory) {
        return proofs[proofId];
    }
    
    function setRequiredAttestations(uint256 _required) external onlyRole(DEFAULT_ADMIN_ROLE) {
        requiredAttestations = _required;
    }
    
    function setSubmissionTimeWindow(uint256 _window) external onlyRole(DEFAULT_ADMIN_ROLE) {
        submissionTimeWindow = _window;
    }
}
