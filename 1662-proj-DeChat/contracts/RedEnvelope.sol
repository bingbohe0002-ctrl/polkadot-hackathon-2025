// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TieredNFT.sol"; // 引用你的 NFT 合约

contract TieredRedPacket is Ownable, ReentrancyGuard {
    enum PacketType { Normal, Advanced, Super }

    struct RedPacket {
        address creator;
        PacketType packetType;
        uint256 totalAmount;
        uint256 balance;
        uint256 totalShares;
        uint256 claimedShares;
        uint256 createdAt;
        bool active;
        mapping(address => bool) claimed;
    }

    mapping(uint256 => RedPacket) public packets;
    uint256 public nextPacketId;
    TieredNFT public nftContract;

    event PacketCreated(uint256 indexed packetId, address indexed creator, PacketType packetType, uint256 amount);
    event PacketClaimed(uint256 indexed packetId, address indexed claimer, uint256 amount);
    event PacketRefunded(uint256 indexed packetId, address indexed creator, uint256 amount);

    constructor(address _nftAddress) Ownable(msg.sender) {
        nftContract = TieredNFT(_nftAddress);
    }

    // ============= 创建红包 =============
    function createRedPacket(PacketType packetType, uint256 totalShares) external payable returns (uint256) {
        require(msg.value > 0, "No ETH sent");
        require(totalShares > 0, "Shares must > 0");

        uint256 packetId = nextPacketId++;
        RedPacket storage p = packets[packetId];
        p.creator = msg.sender;
        p.packetType = packetType;
        p.totalAmount = msg.value;
        p.balance = msg.value;
        p.totalShares = totalShares;
        p.createdAt = block.timestamp;
        p.active = true;

        emit PacketCreated(packetId, msg.sender, packetType, msg.value);
        return packetId;
    }

    // ============= 抢红包 =============
    function claim(uint256 packetId, uint256 tokenId) external nonReentrant {
        RedPacket storage p = packets[packetId];
        require(p.active, "Packet inactive");
        require(!p.claimed[msg.sender], "Already claimed");
        require(p.claimedShares < p.totalShares, "All claimed");

        // 检查资格
        _checkEligibility(p.packetType, msg.sender, tokenId);

        // 随机金额算法（可替换为更复杂的）
        uint256 amount = p.balance / (p.totalShares - p.claimedShares);
        p.balance -= amount;
        p.claimedShares++;
        p.claimed[msg.sender] = true;

        payable(msg.sender).transfer(amount);

        emit PacketClaimed(packetId, msg.sender, amount);

        // 红包领完自动失效
        if (p.claimedShares >= p.totalShares || p.balance == 0) {
            p.active = false;
        }
    }

    // ============= 检查资格 =============
    function _checkEligibility(PacketType packetType, address user, uint256 tokenId) internal view {
        // Normal：任何人都可
        if (packetType == PacketType.Normal) return;

        // 检查用户是否拥有该NFT
        require(nftContract.ownerOf(tokenId) == user, "Not NFT owner");

        TieredNFT.Tier tier = nftContract.tokenTier(tokenId);

        if (packetType == PacketType.Advanced) {
            require(uint8(tier) >= uint8(TieredNFT.Tier.Silver), "Need Silver or Gold");
        } else if (packetType == PacketType.Super) {
            require(tier == TieredNFT.Tier.Gold, "Need Gold");
        }
    }

    // ============= 退回未领完余额 =============
    function refund(uint256 packetId) external nonReentrant {
        RedPacket storage p = packets[packetId];
        require(msg.sender == p.creator, "Not creator");
        require(p.active, "Packet inactive");

        uint256 refundAmount = p.balance;
        p.balance = 0;
        p.active = false;

        payable(p.creator).transfer(refundAmount);
        emit PacketRefunded(packetId, msg.sender, refundAmount);
    }

    // ============= 工具函数 =============
    function getPacketInfo(uint256 packetId)
        external
        view
        returns (
            address creator,
            PacketType packetType,
            uint256 totalAmount,
            uint256 balance,
            uint256 totalShares,
            uint256 claimedShares,
            bool active
        )
    {
        RedPacket storage p = packets[packetId];
        return (p.creator, p.packetType, p.totalAmount, p.balance, p.totalShares, p.claimedShares, p.active);
    }
}
