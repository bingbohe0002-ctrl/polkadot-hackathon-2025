"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract, useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { FractionOperations } from "./FractionOperations";
import { LoyaltyRewards } from "./LoyaltyRewards";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
  price?: string;
  isFractionalized?: boolean;
  isRented?: boolean;
  rentedTo?: string;
  rentExpiry?: number;
  isRentedByMe?: boolean;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // 每页显示3个NFT

  // 过滤掉碎片化的 NFT
  const nonFractionalizedNFTs = myAllCollectibles.filter(nft => !nft.isFractionalized);
  const totalPages = Math.ceil(nonFractionalizedNFTs.length / itemsPerPage);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { data: myTotalBalance } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  const handleNFTUpdate = () => {
    setRefresh(prev => !prev);
  };

  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      if (myTotalBalance === undefined || yourCollectibleContract === undefined || connectedAddress === undefined)
        return;

      setAllCollectiblesLoading(true);
      const collectibleUpdate: Collectible[] = [];
      
      try {
        // 1. 获取用户拥有的 NFT
        const totalBalance = parseInt(myTotalBalance.toString());
        
        for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
          const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([
            connectedAddress,
            BigInt(tokenIndex),
          ]);

          const isFractionalized = await yourCollectibleContract.read.isNFTFractionalized([tokenId]);
          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURI as string);

          const userInfo = await yourCollectibleContract.read.userOf([tokenId]);
          const rentedTo = userInfo === "0x0000000000000000000000000000000000000000" ? undefined : userInfo;

          let rentExpiry;
          if (rentedTo) {
            const expiryTimestamp = await yourCollectibleContract.read.userExpires([tokenId]);
            rentExpiry = Number(expiryTimestamp);
          }

          collectibleUpdate.push({
            id: parseInt(tokenId.toString()),
            uri: tokenURI,
            owner: connectedAddress,
            isFractionalized: isFractionalized,
            isRented: !!rentedTo,
            rentedTo: rentedTo,
            rentExpiry: rentExpiry,
            ...nftMetadata,
          });
        }

        // 2. 获取用户租赁的 NFT
        const totalSupply = await yourCollectibleContract.read.totalSupply();
        
        // 遍历所有 NFT
        for (let i = 1; i <= Number(totalSupply); i++) {
          try {
            const tokenId = BigInt(i);
            const userInfo = await yourCollectibleContract.read.userOf([tokenId]);
            
            // 如果当前用户是租赁者
            if (userInfo.toLowerCase() === connectedAddress.toLowerCase()) {
              // 检查这个 NFT 是否已经在列表中（避免重复）
              const isAlreadyIncluded = collectibleUpdate.some(nft => nft.id === i);
              
              if (!isAlreadyIncluded) {
                const owner = await yourCollectibleContract.read.ownerOf([tokenId]);
                const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
                const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURI as string);
                const expiryTimestamp = await yourCollectibleContract.read.userExpires([tokenId]);
                const isFractionalized = await yourCollectibleContract.read.isNFTFractionalized([tokenId]);

                // 检查是否已经过期
                const currentTime = Math.floor(Date.now() / 1000);
                if (Number(expiryTimestamp) > currentTime) {
                  collectibleUpdate.push({
                    id: Number(i),
                    uri: tokenURI,
                    owner: owner,
                    isFractionalized: isFractionalized,
                    isRented: true,
                    rentedTo: connectedAddress,
                    rentExpiry: Number(expiryTimestamp),
                    isRentedByMe: true, // 标记这是租赁来的 NFT
                    ...nftMetadata,
                  });
                }
              }
            }
          } catch (error) {
            console.error(`Error processing token ${i}:`, error);
            continue; // 继续处理下一个 token
          }
        }

        console.log("Final collectibleUpdate============", collectibleUpdate);
        
        collectibleUpdate.sort((a, b) => a.id - b.id);
        setMyAllCollectibles(collectibleUpdate);
        setAllCollectiblesLoading(false);
      } catch (e) {
        notification.error("Error fetching collectibles");
        console.error(e);
        setAllCollectiblesLoading(false);
      }
    };

    updateMyCollectibles();
  }, [connectedAddress, myTotalBalance, refresh]);

  // 获取当前页的NFT并计算布局类
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const items = nonFractionalizedNFTs.slice(startIndex, endIndex);
    
    // 根据items长度决定布局类
    let gridClassName = "grid gap-6 p-6 ";
    if (items.length === 1) {
      gridClassName += "grid-cols-1 max-w-md mx-auto"; // 一个NFT时居中显示
    } else if (items.length === 2) {
      gridClassName += "grid-cols-2 max-w-3xl mx-auto"; // 两个NFT时居中显示
    } else {
      gridClassName += "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"; // 三个或更多时使用完整宽度
    }

    return {
      items,
      gridClassName,
    };
  };

  // 页面导航函数
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 当数据更新时，确保当前页码有效
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  if (allCollectiblesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const { items, gridClassName } = getCurrentPageItems();

  return (
    <div className="space-y-8">
      {/* NFT 展示区域 */}
      <div className="relative">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl -z-10" />

        {/* NFT 网格 - 使用动态类名 */}
        <div className={gridClassName}>
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col items-center"
            >
              <NFTCard
                nft={item}
                onNFTUpdate={handleNFTUpdate}
              />
              <LoyaltyRewards
                tokenId={item.id}
                onRewardClaimed={handleNFTUpdate}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 分页控件 - 简化 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-6">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一页
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                className={`btn btn-sm ${
                  currentPage === pageNum
                    ? 'btn-primary'
                    : 'btn-ghost hover:btn-primary/20'
                }`}
                onClick={() => goToPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* NFT 统计信息 */}
      <div className="bg-base-100/50 backdrop-blur-md rounded-2xl p-4 text-center shadow-lg border border-base-300/50">
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-base-content/70">
            总共 {nonFractionalizedNFTs.length} 个非碎片化 数藏
          </span>
        </div>
      </div>

      {/* 碎片操作组件 */}
      <div>
        <FractionOperations onOperationComplete={handleNFTUpdate} />
      </div>
    </div>
  );
};
