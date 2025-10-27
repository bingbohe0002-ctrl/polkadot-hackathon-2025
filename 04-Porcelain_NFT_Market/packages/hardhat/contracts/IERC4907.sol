// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IERC4907 {    
    /// @notice 当NFT的用户或过期时间被更新时触发
    event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires);
    
    /// @notice 设置NFT的用户和过期时间
    /// @param tokenId 要设置用户的NFT的ID
    /// @param user 用户的地址
    /// @param expires 用户权限的过期时间戳
    function setUser(uint256 tokenId, address user, uint64 expires) external;
    
    /// @notice 获取NFT的当前用户
    /// @param tokenId 要查询的NFT的ID
    /// @return 用户的地址，如果没有用户则返回零地址
    function userOf(uint256 tokenId) external view returns(address);
    
    /// @notice 获取NFT的用户过期时间
    /// @param tokenId 要查询的NFT的ID
    /// @return 用户权限的过期时间戳
    function userExpires(uint256 tokenId) external view returns(uint256);
} 