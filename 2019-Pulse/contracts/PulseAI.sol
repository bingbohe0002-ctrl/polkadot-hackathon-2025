//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title PulseAI
 * @dev NFT-gated AI assistant access for PulseChat
 * Users must mint an AI NFT to access AI features
 */
contract PulseAI {
    // NFT structure
    struct AINFTInfo {
        uint256 tokenId;
        address owner;
        uint256 mintedAt;
        bool isActive;
    }

    // State variables
    uint256 public tokenCounter;
    uint256 public mintPrice;
    mapping(uint256 => AINFTInfo) public nftInfo;
    mapping(address => uint256[]) public userNFTs;
    mapping(address => bool) public hasAIAccess;
    address public contractOwner;

    // Events
    event AINFTMinted(address indexed owner, uint256 indexed tokenId, uint256 timestamp);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor() {
        contractOwner = msg.sender;
        mintPrice = 10 ether; // 10 PAS to mint AI NFT
        tokenCounter = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only owner can call this");
        _;
    }

    /**
     * @dev Mint an AI NFT to access AI features
     */
    function mintAINFT() public payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        
        tokenCounter++;
        uint256 newTokenId = tokenCounter;

        nftInfo[newTokenId] = AINFTInfo({
            tokenId: newTokenId,
            owner: msg.sender,
            mintedAt: block.timestamp,
            isActive: true
        });

        userNFTs[msg.sender].push(newTokenId);
        hasAIAccess[msg.sender] = true;

        emit AINFTMinted(msg.sender, newTokenId, block.timestamp);

        return newTokenId;
    }

    /**
     * @dev Check if user has AI access
     * @param _user User's address
     */
    function checkAIAccess(address _user) public view returns (bool) {
        return hasAIAccess[_user];
    }

    /**
     * @dev Get user's AI NFTs
     * @param _user User's address
     */
    function getUserNFTs(address _user) public view returns (uint256[] memory) {
        return userNFTs[_user];
    }

    /**
     * @dev Get NFT information
     * @param _tokenId Token ID
     */
    function getNFTInfo(uint256 _tokenId) 
        public 
        view 
        returns (
            uint256 tokenId,
            address owner,
            uint256 mintedAt,
            bool isActive
        ) 
    {
        AINFTInfo memory info = nftInfo[_tokenId];
        return (
            info.tokenId,
            info.owner,
            info.mintedAt,
            info.isActive
        );
    }

    /**
     * @dev Get total NFTs minted
     */
    function getTotalNFTs() public view returns (uint256) {
        return tokenCounter;
    }

    /**
     * @dev Update mint price (only owner)
     * @param _newPrice New mint price
     */
    function updateMintPrice(uint256 _newPrice) public onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = _newPrice;
        emit MintPriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(contractOwner).transfer(balance);
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

