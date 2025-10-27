// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VotingNFTReward
 * @dev 投票预测获奖者NFT奖励合约（简化版本）
 * 为预测正确的用户发放纪念NFT
 */
contract VotingNFTReward is ERC721, Ownable, Pausable {
    uint256 private _tokenIdCounter;

    // NFT元数据
    struct NFTMetadata {
        uint256 votingPeriodId;    // 投票期ID
        uint256 predictionYears;   // 预测年数
        uint256 ticketsUsed;       // 使用的投票券数量
        uint256 mintTime;         // 铸造时间
        string rarity;            // 稀有度
        bool isGenesis;          // 是否为创世NFT
    }

    // 稀有度映射
    mapping(string => uint256) public rarityCount;
    // TokenID到元数据的映射
    mapping(uint256 => NFTMetadata) public nftMetadata;
    // 投票期到NFT数量的映射
    mapping(uint256 => uint256) public votingPeriodNFTCount;

    // 基础URI
    string private _baseTokenURI;

    // 事件
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 votingPeriodId, string rarity);
    event BaseURIUpdated(string oldURI, string newURI);
    event GenesisNFTMinted(address indexed to, uint256 indexed tokenId);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = "https://api.votingnft.com/metadata/";
    }

    /**
     * @dev 铸造预测准确NFT
     * @param to 接收者地址
     * @param votingPeriodId 投票期ID
     * @param predictionYears 预测年数
     * @param ticketsUsed 使用的投票券数量
     */
    function mintCorrectPredictionNFT(
        address to,
        uint256 votingPeriodId,
        uint256 predictionYears,
        uint256 ticketsUsed
    ) external onlyOwner returns (uint256) {
        return _mintNFT(to, votingPeriodId, predictionYears, ticketsUsed, false);
    }

    /**
     * @dev 铸造创世NFT（特殊奖励）
     * @param to 接收者地址
     */
    function mintGenesisNFT(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        // 设置创世NFT元数据
        string memory rarity = "Legendary";
        nftMetadata[tokenId] = NFTMetadata({
            votingPeriodId: 0, // 创世NFT无投票期
            predictionYears: 0,
            ticketsUsed: 0,
            mintTime: block.timestamp,
            rarity: rarity,
            isGenesis: true
        });

        rarityCount[rarity]++;

        emit GenesisNFTMinted(to, tokenId);
        return tokenId;
    }

    /**
     * @dev 内部铸造函数
     */
    function _mintNFT(
        address to,
        uint256 votingPeriodId,
        uint256 predictionYears,
        uint256 ticketsUsed,
        bool isGenesis
    ) internal returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        // 确定稀有度
        string memory rarity = _determineRarity(ticketsUsed, predictionYears, votingPeriodId);

        // 设置元数据
        nftMetadata[tokenId] = NFTMetadata({
            votingPeriodId: votingPeriodId,
            predictionYears: predictionYears,
            ticketsUsed: ticketsUsed,
            mintTime: block.timestamp,
            rarity: rarity,
            isGenesis: isGenesis
        });

        rarityCount[rarity]++;
        votingPeriodNFTCount[votingPeriodId]++;

        emit NFTMinted(to, tokenId, votingPeriodId, rarity);
        return tokenId;
    }

    /**
     * @dev 确定NFT稀有度
     */
    function _determineRarity(
        uint256 ticketsUsed,
        uint256 predictionYears,
        uint256 votingPeriodId
    ) internal pure returns (string memory) {
        // 根据投票券数量和预测准确性确定稀有度
        if (ticketsUsed >= 1000) {
            return "Legendary";
        } else if (ticketsUsed >= 500) {
            return "Epic";
        } else if (ticketsUsed >= 100) {
            return "Rare";
        } else if (ticketsUsed >= 50) {
            return "Uncommon";
        } else {
            return "Common";
        }
    }

    /**
     * @dev 获取NFT元数据
     * @param tokenId Token ID
     */
    function getNFTMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return nftMetadata[tokenId];
    }

    /**
     * @dev 设置基础URI（仅管理员）
     * @param newBaseURI 新的基础URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        string memory oldURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;

        emit BaseURIUpdated(oldURI, newBaseURI);
    }

    /**
     * @dev 获取指定投票期的NFT数量
     * @param votingPeriodId 投票期ID
     */
    function getVotingPeriodNFTCount(uint256 votingPeriodId) external view returns (uint256) {
        return votingPeriodNFTCount[votingPeriodId];
    }

    /**
     * @dev 获取稀有度统计
     * @param rarity 稀有度
     */
    function getRarityCount(string calldata rarity) external view returns (uint256) {
        return rarityCount[rarity];
    }

    /**
     * @dev 生成Token URI
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        NFTMetadata memory metadata = nftMetadata[tokenId];
        string memory baseURI = _baseURI();

        // 生成动态元数据URI
        return string(abi.encodePacked(baseURI, _uint2str(tokenId)));
    }

    /**
     * @dev 重写_baseURI函数
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev 暂停合约（紧急情况）
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 获取合约铸造的NFT总数
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev 辅助函数：uint转string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }

        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }

        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }

        return string(bstr);
    }

    /**
     * @dev 重写转账函数以支持暂停功能
     */
    function _update(address to, uint256 tokenId, address auth) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}