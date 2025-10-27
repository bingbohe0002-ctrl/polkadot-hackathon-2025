import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { moonbaseAlpha, polkadotHubTestnet } from "~~/scaffold.config";
import deployedContracts from "~~/contracts/deployedContracts";

export interface CrossChainNFT {
  tokenId: bigint;
  price: bigint;
  owner: string;
  isListed: boolean;
  tokenUri: string;
  chainId: number;
  chainName: string;
  contractAddress: string;
}

export const useCrossChainNFTs = () => {
  const [nfts, setNfts] = useState<CrossChainNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTsFromChain = async (chainId: number, chainName: string) => {
    try {
      // 获取链配置
      const chain = chainId === 1287 ? moonbaseAlpha : polkadotHubTestnet;
      
      // 创建公共客户端
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      // 获取合约配置
      const contractConfig = deployedContracts[chainId as keyof typeof deployedContracts]?.YourCollectible;
      
      if (!contractConfig) {
        console.warn(`No contract found for chain ${chainId}`);
        return [];
      }

      // 调用合约获取NFT列表
      const result = await publicClient.readContract({
        address: contractConfig.address as `0x${string}`,
        abi: contractConfig.abi,
        functionName: 'getAllListedItems',
      }) as any[];

      // 转换数据格式并添加链信息
      return result.map((nft: any) => ({
        tokenId: nft.tokenId,
        price: nft.price,
        owner: nft.owner,
        isListed: nft.isListed,
        tokenUri: nft.tokenUri,
        chainId,
        chainName,
        contractAddress: contractConfig.address,
      }));
    } catch (err) {
      console.error(`Error fetching NFTs from ${chainName}:`, err);
      return [];
    }
  };

  const fetchAllNFTs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 并行获取两个链的NFT数据
      const [moonbaseNFTs, polkadotNFTs] = await Promise.all([
        fetchNFTsFromChain(1287, "Moonbase Alpha"),
        fetchNFTsFromChain(420420422, "Polkadot Hub"),
      ]);

      // 合并所有NFT数据
      const allNFTs = [...moonbaseNFTs, ...polkadotNFTs];
      setNfts(allNFTs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cross-chain NFTs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNFTs();
    
    // 设置定时刷新（每30秒）
    const interval = setInterval(fetchAllNFTs, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    nfts,
    loading,
    error,
    refetch: fetchAllNFTs,
  };
};