"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http } from "viem";
import { moonbaseAlpha } from "viem/chains";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";

// 支持的链配置
const SUPPORTED_CHAINS = [
  {
    chainId: 1287,
    name: "Moonbase Alpha",
    config: moonbaseAlpha,
    rpcUrl: "https://rpc.api.moonbase.moonbeam.network",
    contractAddress: "0x62CF8Ed114C18f8aD4774a49F4a754a77Fa6a2cD" as `0x${string}`,
    xcmBridgeAddress: "0xDbd1ed48581d42295057754D9f268970aEA25c9B" as `0x${string}`,
  },
  {
    chainId: 420420422,
    name: "Polkadot Hub Testnet",
    config: {
      id: 420420422,
      name: "Polkadot Hub Testnet",
      network: "polkadot-hub-testnet",
      nativeCurrency: {
        decimals: 18,
        name: "DOT",
        symbol: "DOT",
      },
      rpcUrls: {
        default: {
          http: ["https://polkadot-hub-testnet.rpc.caldera.xyz/http"],
        },
        public: {
          http: ["https://polkadot-hub-testnet.rpc.caldera.xyz/http"],
        },
      },
    },
    rpcUrl: "https://polkadot-hub-testnet.rpc.caldera.xyz/http",
    contractAddress: "0x62CF8Ed114C18f8aD4774a49F4a754a77Fa6a2cD" as `0x${string}`,
    xcmBridgeAddress: "0x15dEBed7142159A331EBEa55bD48994B34F0c473" as `0x${string}`,
  },
];

// YourCollectible合约ABI
const YOUR_COLLECTIBLE_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// XCM桥合约ABI
const XCM_BRIDGE_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "messageHash", type: "bytes32" }],
    name: "getCrossChainNFT",
    outputs: [
      {
        components: [
          { internalType: "address", name: "originalContract", type: "address" },
          { internalType: "uint256", name: "originalTokenId", type: "uint256" },
          { internalType: "address", name: "originalOwner", type: "address" },
          { internalType: "uint32", name: "sourceChainId", type: "uint32" },
          { internalType: "uint32", name: "destinationChainId", type: "uint32" },
          { internalType: "bool", name: "isLocked", type: "bool" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct XCMBridge.CrossChainNFT",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// 跨链NFT数据接口
export interface CrossChainCollectible extends NFTMetaData {
  id: number;
  uri: string;
  owner: string;
  chainId: number;
  chainName: string;
  isLocked?: boolean; // 是否在XCM桥中锁定
  sourceChainId?: number; // 原始链ID（如果是跨链转移的NFT）
}

// 主要的跨链NFT hook
export const useCrossChainMyNFTs = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<CrossChainCollectible[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTsFromChain = useCallback(async (chainConfig: typeof SUPPORTED_CHAINS[0]) => {
    if (!connectedAddress) return [];

    try {
      console.log(`🔍 正在查询 ${chainConfig.name} (${chainConfig.chainId}) 上的NFT...`);
      
      // 创建该链的公共客户端
      const publicClient = createPublicClient({
        chain: chainConfig.config,
        transport: http(chainConfig.rpcUrl),
      });

      // 获取用户在该链上的NFT余额
      const balance = await publicClient.readContract({
        address: chainConfig.contractAddress,
        abi: YOUR_COLLECTIBLE_ABI,
        functionName: "balanceOf",
        args: [connectedAddress],
      });

      const totalBalance = Number(balance);
      console.log(`📊 ${chainConfig.name} 上的NFT余额: ${totalBalance}`);
      
      const collectibles: CrossChainCollectible[] = [];

      // 获取每个NFT的详细信息
      for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
        try {
          // 获取tokenId
          const tokenId = await publicClient.readContract({
            address: chainConfig.contractAddress,
            abi: YOUR_COLLECTIBLE_ABI,
            functionName: "tokenOfOwnerByIndex",
            args: [connectedAddress, BigInt(tokenIndex)],
          });

          // 获取tokenURI
          const tokenURI = await publicClient.readContract({
            address: chainConfig.contractAddress,
            abi: YOUR_COLLECTIBLE_ABI,
            functionName: "tokenURI",
            args: [tokenId],
          });

          // 获取NFT元数据
          const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURI as string);

          const nftItem = {
            id: Number(tokenId),
            uri: tokenURI as string,
            owner: connectedAddress,
            chainId: chainConfig.chainId,
            chainName: chainConfig.name,
            isLocked: false,
            ...nftMetadata,
          };

          console.log(`✅ 找到NFT: ${chainConfig.name} - Token ${tokenId}`, nftItem);
          collectibles.push(nftItem);
        } catch (e) {
          console.error(`Error fetching NFT ${tokenIndex} from ${chainConfig.name}:`, e);
        }
      }

      return collectibles;
    } catch (error) {
      console.error(`❌ 查询 ${chainConfig.name} 失败:`, error);
      return [];
    }
  }, [connectedAddress]);

  // 查询XCM桥中锁定的NFT（这些NFT可能正在跨链转移中）
  const fetchLockedNFTsFromBridge = useCallback(async (chainConfig: typeof SUPPORTED_CHAINS[0]) => {
    if (!connectedAddress) return [];

    try {
      console.log(`🔒 正在查询 ${chainConfig.name} XCM桥中锁定的NFT...`);
      
      const publicClient = createPublicClient({
        chain: chainConfig.config,
        transport: http(chainConfig.rpcUrl),
      });

      // 这里我们需要查询NFTLocked事件来找到用户锁定的NFT
      // 由于事件查询可能很复杂，我们先实现基本功能
      // 在实际应用中，可能需要维护一个索引或使用Graph Protocol

      const lockedNFTs: CrossChainCollectible[] = [];
      
      // 注意：这里需要实现事件查询逻辑来找到用户锁定的NFT
      // 暂时返回空数组，后续可以完善
      
      return lockedNFTs;
    } catch (error) {
      console.error(`❌ 查询 ${chainConfig.name} XCM桥失败:`, error);
      return [];
    }
  }, [connectedAddress]);

  const fetchAllNFTs = useCallback(async () => {
    if (!connectedAddress) {
      setMyAllCollectibles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🚀 开始获取所有链上的NFT数据...");
      
      // 并行获取所有链上的NFT
      const allChainPromises = SUPPORTED_CHAINS.map(chainConfig => 
        fetchNFTsFromChain(chainConfig)
      );

      // 并行获取所有链上XCM桥中锁定的NFT
      const allLockedPromises = SUPPORTED_CHAINS.map(chainConfig => 
        fetchLockedNFTsFromBridge(chainConfig)
      );

      const [allChainResults, allLockedResults] = await Promise.all([
        Promise.all(allChainPromises),
        Promise.all(allLockedPromises)
      ]);
      
      // 合并所有链的结果
      const allCollectibles = [...allChainResults.flat(), ...allLockedResults.flat()];
      
      console.log("📋 所有链查询结果:", {
        totalNFTs: allCollectibles.length,
        byChain: allChainResults.map((result, index) => ({
          chain: SUPPORTED_CHAINS[index].name,
          count: result.length
        })),
        lockedNFTs: allLockedResults.flat().length
      });
      
      // 按tokenId排序
      allCollectibles.sort((a, b) => a.id - b.id);
      
      setMyAllCollectibles(allCollectibles);
    } catch (error) {
      console.error("Error fetching cross-chain NFTs:", error);
      setError("获取跨链NFT数据失败");
    } finally {
      setLoading(false);
    }
  }, [connectedAddress, fetchNFTsFromChain, fetchLockedNFTsFromBridge]);

  // 当连接地址变化时重新获取NFT
  useEffect(() => {
    fetchAllNFTs();
  }, [fetchAllNFTs]);

  return {
    nfts: myAllCollectibles,
    loading,
    error,
    refetch: fetchAllNFTs,
  };
};