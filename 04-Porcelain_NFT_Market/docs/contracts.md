# 智能合约文档

## YourCollectible.sol

主要的 NFT 合约,实现了多个功能模块。

### 核心功能

#### 铸造功能
```solidity
function mintItem(address to, string memory tokenURI) public returns (uint256)
```
- 描述: 铸造新的 NFT
- 参数:
  - `to`: 接收者地址
  - `tokenURI`: NFT 元数据 URI
- 返回: 新铸造的 NFT 的 tokenId

#### 交易功能
```solidity
function listNFT(uint256 tokenId, uint256 price) public
```
- 描述: 上架 NFT 到市场
- 参数:
  - `tokenId`: NFT ID
  - `price`: 上架价格(wei)

```solidity
function buyNFT(uint256 tokenId) public payable
```
- 描述: 购买上架的 NFT
- 参数:
  - `tokenId`: 要购买的 NFT ID

#### 租赁功能 (ERC4907)
```solidity
function setUser(uint256 tokenId, address user, uint64 expires) public
```
- 描述: 设置 NFT 的租赁用户
- 参数:
  - `tokenId`: NFT ID
  - `user`: 租用者地址
  - `expires`: 租约到期时间

#### 碎片化功能
```solidity
function fractionalize(uint256 tokenId, uint256 totalShares) public
```
- 描述: 将 NFT 碎片化
- 参数:
  - `tokenId`: 要碎片化的 NFT ID
  - `totalShares`: 总碎片数量

#### 空投功能
```solidity
function setMerkleRoot(bytes32 merkleRoot) public onlyOwner
```
- 描述: 设置空投白名单 Merkle 树根
- 参数:
  - `merkleRoot`: Merkle 树根哈希

```solidity
function claimAirdrop(uint256 tokenId, bytes32[] calldata merkleProof) public
```
- 描述: 认领空投 NFT
- 参数:
  - `tokenId`: NFT ID
  - `merkleProof`: Merkle 证明

#### 忠诚度奖励
```solidity
function claimLoyaltyReward(uint256 tokenId) public
```
- 描述: 领取持有 NFT 的忠诚度奖励
- 参数:
  - `tokenId`: NFT ID

### 事件

```solidity
event NFTListed(uint256 indexed tokenId, address seller, uint256 price);
event NFTSold(uint256 indexed tokenId, address seller, address buyer, uint256 price);
event NFTFractionalized(uint256 indexed tokenId, uint256 totalShares);
event LoyaltyRewardClaimed(uint256 indexed tokenId, address holder, uint256 amount);
```

### 数据结构

```solidity
struct NFTItem {
    uint256 tokenId;
    uint256 price;
    address payable owner;
    bool isListed;
    string tokenUri;
}

struct Fraction {
    uint256 amount;
    bool isForSale;
    uint256 price;
}

struct LoyaltyInfo {
    uint256 holdingStartTime;
    bool rewardClaimed;
    uint256 lastRewardTime;
}
```

## IERC4907.sol

NFT 租赁标准接口。

### 租赁接口定义

```solidity
interface IERC4907 {
    event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires);
    
    function setUser(uint256 tokenId, address user, uint64 expires) external;
    function userOf(uint256 tokenId) external view returns(address);
    function userExpires(uint256 tokenId) external view returns(uint256);
}
```

### 事件
- `UpdateUser`: 当 NFT 的用户或过期时间被更新时触发

### 方法
- `setUser`: 设置 NFT 的用户和过期时间
- `userOf`: 获取 NFT 的当前用户
- `userExpires`: 获取 NFT 的用户过期时间 