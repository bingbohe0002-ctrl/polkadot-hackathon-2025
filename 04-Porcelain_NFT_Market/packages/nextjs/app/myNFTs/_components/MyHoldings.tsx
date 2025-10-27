"use client";

import { NFTCard } from "./NFTCard";
import { useCrossChainMyNFTs } from "~~/hooks/useCrossChainMyNFTs";

export const MyHoldings = () => {
  // 使用跨链NFT hook
  const { nfts: myAllCollectibles, loading: allCollectiblesLoading, error, refetch } = useCrossChainMyNFTs();

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      {error && (
        <div className="flex justify-center items-center mt-10">
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="btn btn-sm" onClick={refetch}>重试</button>
          </div>
        </div>
      )}
      
      {myAllCollectibles.length === 0 && !allCollectiblesLoading && !error ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">没有找到数藏</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {myAllCollectibles.map(item => (
            <div key={`${item.chainId}-${item.id}`} className="relative">
              <NFTCard nft={item} />
              {/* 链标识 */}
              <div className="absolute top-2 right-2 z-10">
                <span className={`badge text-xs ${item.chainId === 1287 ? 'badge-info' : 'badge-warning'}`}>
                  {item.chainName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
