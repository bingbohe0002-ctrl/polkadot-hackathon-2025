// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// ============================================================================
// ACTION PROOF NFT (aNFT) - ERC721 for cognitive action certificates
// ============================================================================
contract ActionProofNFT is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _tokenIds;
    
    struct ProofMetadata {
        bytes32 proofId;
        bytes32 cid;
        uint256 timestamp;
        string metadataURI; // IPFS CID
    }
    
    mapping(uint256 => ProofMetadata) public proofMetadata;
    
    constructor() ERC721("Action Proof NFT", "aNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    function mintProofNFT(
        address to,
        bytes32 proofId,
        bytes32 cid,
        string memory metadataURI
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        proofMetadata[newTokenId] = ProofMetadata({
            proofId: proofId,
            cid: cid,
            timestamp: block.timestamp,
            metadataURI: metadataURI
        });
        
        return newTokenId;
    }
    
    function getProofMetadata(uint256 tokenId) external view returns (ProofMetadata memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return proofMetadata[tokenId];
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
