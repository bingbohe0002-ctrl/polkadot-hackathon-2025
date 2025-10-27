import { useEffect, useState } from "react";
import { useScaffoldWriteContract, useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useAccount, usePublicClient } from "wagmi";
import { /*saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";

interface LoyaltyInfo {
  holdingStartTime: number;
  rewardClaimed: boolean;
  lastRewardTime: number;
  nextRewardTime: number;
}

interface LoyaltyRewardsProps {
  tokenId: number;
  onRewardClaimed?: () => void;
}

export const LoyaltyRewards = ({ tokenId, onRewardClaimed }: LoyaltyRewardsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [waitTime, setWaitTime] = useState<number>(0);
  const publicClient = usePublicClient();
  const { address: connectedAddress } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 使用 useScaffoldContractRead 替代直接的合约调用
  const { data: loyaltyInfoData, refetch: refetchLoyaltyInfo } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getLoyaltyInfo",
    args: [BigInt(tokenId)],
  });

  const { data: canClaimData, refetch: refetchCanClaim } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "checkClaimLoyaltyReward",
    args: [BigInt(tokenId)],
  });

  // 解析合约数据
  const loyaltyInfo: LoyaltyInfo | null = loyaltyInfoData ? {
    holdingStartTime: Number(loyaltyInfoData[0]),
    rewardClaimed: loyaltyInfoData[1],
    lastRewardTime: Number(loyaltyInfoData[2]),
    nextRewardTime: Number(loyaltyInfoData[3]),
  } : null;

  // 更新等待时间（纯前端计算）
  const updateWaitTime = () => {
    if (loyaltyInfo && loyaltyInfo.nextRewardTime > Date.now() / 1000) {
      const timeLeft = Math.ceil(loyaltyInfo.nextRewardTime - Date.now() / 1000);
      setWaitTime(timeLeft);
      
      // 如果剩余时间小于60秒，刷新合约数据
      if (timeLeft <= 60) {
        refetchLoyaltyInfo();
        refetchCanClaim();
      }
    } else {
      setWaitTime(0);
      refetchLoyaltyInfo();
      refetchCanClaim();
    }
  };

  // 倒计时更新
  useEffect(() => {
    updateWaitTime();
    const timer = setInterval(updateWaitTime, 1000); // 每秒更新一次
    return () => clearInterval(timer);
  }, [loyaltyInfo]);

  const handleClaimReward = async () => {
    try {
      setIsLoading(true);
      const tx = await writeContractAsync({
        functionName: "claimLoyaltyReward",
        args: [BigInt(tokenId)],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient?.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt.transactionHash,
      //   method_name: "claimReward",
      //   gas_used: receipt.gasUsed.toString(),
      //   gas_price: receipt.effectiveGasPrice.toString(),
      //   total_cost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
      //   user_address: address,
      //   block_number: receipt.blockNumber.toString(),
      // });
      notification.success("奖励领取成功！");
      onRewardClaimed?.();
      // 领取成功后刷新数据
      refetchLoyaltyInfo();
      refetchCanClaim();
    } catch (error) {
      console.error("Error claiming reward:", error);
      notification.error("领取奖励失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化等待时间
  const formatWaitTime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];

    if (days > 0) {
      parts.push(`${days} 天`);
    }
    if (hours > 0) {
      parts.push(`${hours} 小时`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} 分`);
    }
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds} 秒`);
    }

    return parts.slice(0, 2).join(' ');
  };

  if (!loyaltyInfo) return null;

  return (
    <div className="bg-base-200 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-bold mb-3">忠诚度奖励信息</h3>
      <div className="space-y-2">
        <p>持有开始时间: {new Date(loyaltyInfo.holdingStartTime * 1000).toLocaleString()}</p>
        <p>上次领取时间: {
          loyaltyInfo.lastRewardTime === 0 
            ? "尚未领取" 
            : new Date(loyaltyInfo.lastRewardTime * 1000).toLocaleString()
        }</p>
        <p>下次可领取时间: {new Date(loyaltyInfo.nextRewardTime * 1000).toLocaleString()}</p>
        
        {canClaimData && (
          <button
            className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
            onClick={handleClaimReward}
            disabled={isLoading}
          >
            {isLoading ? "领取中..." : "领取忠诚度奖励"}
          </button>
        )}
        
        {!canClaimData && waitTime > 0 && (
          <div className="text-sm text-gray-500 mt-2">
            距离下次可领取还需等待: {formatWaitTime(waitTime)}
          </div>
        )}
      </div>
    </div>
  );
};