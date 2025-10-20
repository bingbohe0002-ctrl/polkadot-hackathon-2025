// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TieredNFTPlus is ERC721, Ownable {
    enum Tier { Bronze, Silver, Gold }

    mapping(uint256 => Tier) public tokenTier;
    mapping(uint256 => string) private _tokenURIs;

    // 新增：地址 => 拥有的 tokenId 列表
    mapping(address => uint256[]) private _ownedTokens;

    uint256 private _nextTokenId = 1;

    event Minted(address indexed to, uint256 indexed tokenId, Tier tier);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    // mint 时手动记录 tokenId
    function mint(address to, Tier tier, string calldata uri) public onlyOwner returns (uint256) {
        uint256 id = _nextTokenId++;
        _safeMint(to, id);
        tokenTier[id] = tier;
        _tokenURIs[id] = uri;
        _ownedTokens[to].push(id);
        emit Minted(to, id, tier);
        return id;
    }

    // 🚀 新增：查询某个地址拥有的所有 NFT 信息
    function getFirstTokenOfOwner(address owner) external view returns (
    uint256 tokenId,
    Tier tier,
    string memory uri
    ) {
    uint256[] storage list = _ownedTokens[owner];
    uint256 id = list[0]; // 直接取第一个（不做长度或 owner 校验）
    return (id, tokenTier[id], _tokenURIs[id]);
    }
}