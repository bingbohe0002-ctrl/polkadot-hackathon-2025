// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
contract TieredNFT is ERC721, Ownable {
    enum Tier { Bronze, Silver, Gold }

    // tokenId -> Tier
    mapping(uint256 => Tier) public tokenTier;
    // tokenId -> metadata URI
    mapping(uint256 => string) private _tokenURIs;

    uint256 private _nextTokenId = 1;

    event Minted(address indexed to, uint256 indexed tokenId, Tier tier);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    // 管理员 mint，指定 tier 和 tokenURI
    function mint(address to, Tier tier, string calldata uri) public onlyOwner returns (uint256) {
        uint256 id = _nextTokenId++;
        _safeMint(to, id);
        tokenTier[id] = tier;
        _tokenURIs[id] = uri;
        emit Minted(to, id, tier);
        return id;
    }

    // tokenURI 覆盖
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "not exist");
        return _tokenURIs[tokenId];
    }

    // 方便外部查询某 token 的 tier（枚举转 uint8）
    function tierOf(uint256 tokenId) external view returns (Tier) {
        require(_ownerOf(tokenId) != address(0), "not exist");
        return tokenTier[tokenId];
    }
}
