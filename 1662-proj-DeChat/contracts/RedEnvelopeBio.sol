// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TieredNFT.sol"; // 你的 NFT 合约

interface IBifrostLiquidStaking {
    // 注意：实际 Bifrost 接口可能不同，请根据官方 ABI 调整
    function stake() external payable returns (uint256 vAmount);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract TieredRedPacketBio is Ownable, ReentrancyGuard {
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

    // 注意：不能声明为 public，因为 RedPacket 内含 mapping，编译器无法生成自动 getter
    mapping(uint256 => RedPacket) internal packets;
    uint256 public nextPacketId;

    TieredNFT public nftContract;
    IBifrostLiquidStaking public bifrostStaking;
    IERC20 public vToken; // vToken 的 ERC20 接口（例如 vDOT）

    // ============= Events =============
    event PacketCreated(
        uint256 indexed packetId,
        address indexed creator,
        PacketType packetType,
        uint256 amount
    );
    event PacketClaimed(
        uint256 indexed packetId,
        address indexed claimer,
        uint256 amount,
        bool asVToken
    );
    event PacketRefunded(
        uint256 indexed packetId,
        address indexed creator,
        uint256 amount
    );

    constructor(address _nftAddress) Ownable(msg.sender) {
        require(_nftAddress != address(0), "Invalid NFT address");
        nftContract = TieredNFT(_nftAddress);
    }

    // ============= 管理函数 =============
    function setBifrostStaking(address _bifrostStaking) external onlyOwner {
        bifrostStaking = IBifrostLiquidStaking(_bifrostStaking);
    }
    function setVTokenAddress(address _vToken) external onlyOwner {
        vToken = IERC20(_vToken);
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

    // ============= 领取红包 =============
    function claim(uint256 packetId, uint256 tokenId, bool stakeForVToken) external nonReentrant {
        RedPacket storage p = packets[packetId];
        require(p.active, "Packet inactive");
        require(!p.claimed[msg.sender], "Already claimed");
        require(p.claimedShares < p.totalShares, "All claimed");

        // 检查资格
        _checkEligibility(p.packetType, msg.sender, tokenId);

        // 计算本次领取金额：最后一份发完剩余（避免 dust）
        uint256 remainingShares = p.totalShares - p.claimedShares;
        uint256 amount;
        if (remainingShares == 1) {
            amount = p.balance; // 最后一份拿走剩余所有
        } else {
            amount = p.balance / remainingShares;
        }

        // 立即更新状态，防止重入
        p.balance -= amount;
        p.claimedShares++;
        p.claimed[msg.sender] = true;

        uint256 actualAmount;

        if (stakeForVToken) {
            require(address(bifrostStaking) != address(0), "Bifrost not set");
            // 调用质押合约。注意：大多数 staking 合约会把 vToken 打到调用者（本合约）地址
            actualAmount = bifrostStaking.stake{value: amount}();

            // 将 vToken 转给最终领取者（前提：staker 合约把 vToken 给了本合约）
            require(address(vToken) != address(0), "vToken address not set");
            bool ok = vToken.transfer(msg.sender, actualAmount);
            require(ok, "vToken transfer failed");
        } else {
            payable(msg.sender).transfer(amount);
            actualAmount = amount;
        }

        emit PacketClaimed(packetId, msg.sender, actualAmount, stakeForVToken);

        // 红包领完自动失效
        if (p.claimedShares >= p.totalShares || p.balance == 0) {
            p.active = false;
        }
    }

    // ============= 检查 NFT 权限 =============
    function _checkEligibility(PacketType packetType, address user, uint256 tokenId) internal view {
        if (packetType == PacketType.Normal) return;

        require(tokenId != 0, "TokenId required");
        require(nftContract.ownerOf(tokenId) == user, "Not NFT owner");
        TieredNFT.Tier tier = nftContract.tokenTier(tokenId);

        if (packetType == PacketType.Advanced) {
            require(uint8(tier) >= uint8(TieredNFT.Tier.Silver), "Need Silver or Gold");
        } else if (packetType == PacketType.Super) {
            require(tier == TieredNFT.Tier.Gold, "Need Gold");
        }
    }

    // ============= 退回未领完余额（仅限创建者） =============
    // 这里保留简单实现；可加入时间锁或其他条件
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

    // ============= 辅助查询函数 =============
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
        return (
            p.creator,
            p.packetType,
            p.totalAmount,
            p.balance,
            p.totalShares,
            p.claimedShares,
            p.active
        );
    }

    function hasClaimed(uint256 packetId, address user) external view returns (bool) {
        return packets[packetId].claimed[user];
    }
}