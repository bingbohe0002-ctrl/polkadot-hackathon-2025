"use client";

import type { NextPage } from "next";
import { motion } from "framer-motion";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { EventSection } from "./_components/EventSection";
import { AnimatedBackground } from "./_components/AnimatedBackground";
import { FooterDecoration } from "./_components/FooterDecoration";
import { TradeRecords } from "./_components/TradeRecords";
import { LeaseRecords } from "./_components/LeaseRecords";
import { RewardRecords } from "./_components/RewardRecords";
import { FractionRecords } from "./_components/FractionRecords";
import { MysteryBoxRecords } from "./_components/MysteryBoxRecords";
import { AirdropRecords } from "./_components/AirdropRecords";

const Transfers: NextPage = () => {
  // NFT 交易事件查询
  const { data: buyEvents, isLoading: isBuyLoading, error: buyError } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "NftBought",
    fromBlock: 0n,
    blockData: true,
  });

  // NFT 租赁事件查询
  const { data: leaseEvents, isLoading: isLeaseLoading, error: leaseError } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "UpdateUser",
    fromBlock: 0n,
    blockData: true,
  });

  // 忠诚度奖励事件查询
  const { data: rewardEvents, isLoading: isRewardLoading, error: rewardError } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "LoyaltyRewardClaimed",
    fromBlock: 0n,
    blockData: true,
  });

  // 碎片交易事件查询
  const { data: fractionEvents, isLoading: isFractionLoading, error: fractionError } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "FractionBought",
    fromBlock: 0n,
    blockData: true,
  });

  // 盲盒购买事件查询
  const { data: mysteryBoxEvents, isLoading: isMysteryBoxLoading, error: mysteryBoxError } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "MysteryBoxPurchased",
    fromBlock: 0n,
    blockData: true,
  });

  // 空投领取事件查询
  const { data: airdropEvents, isLoading: isAirdropLoading, error: airdropError } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "AirdropClaimed",
    fromBlock: 0n,
    blockData: true,
  });

  // 检查是否所有查询都在加载中
  const isAllLoading = isBuyLoading || isLeaseLoading || isRewardLoading || 
                      isFractionLoading || isMysteryBoxLoading || isAirdropLoading;

  // 收集所有错误
  const errors = [
    { type: "交易记录", error: buyError },
    { type: "租赁记录", error: leaseError },
    { type: "忠诚度奖励", error: rewardError },
    { type: "碎片交易", error: fractionError },
    { type: "盲盒购买", error: mysteryBoxError },
    { type: "空投领取", error: airdropError },
  ].filter(e => e.error);

  // 背景动画配置
  const particles = Array.from({ length: 30 }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  const floatingIcons = [
    { icon: "💫", delay: 0 },
    { icon: "📊", delay: 1 },
    { icon: "🔄", delay: 2 },
    { icon: "📈", delay: 3 },
    { icon: "✨", delay: 4 },
  ];

  // 加载状态显示
  if (isAllLoading) {
    return (
      <div className="min-h-screen  flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>
          <p className="mt-4 text-lg">加载所有记录中...</p>
        </motion.div>
      </div>
    );
  }

  // 错误状态显示
  if (errors.length > 0) {
    return (
      <div className="min-h-screen  flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error/20 text-error p-8 rounded-3xl text-center max-w-2xl"
        >
          <h2 className="text-2xl font-bold mb-4">加载记录时发生错误</h2>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <p key={index} className="text-sm">
                {error.type}: {error.error ? String(error.error) : "未知错误"}
              </p>
            ))}
          </div>
          <div className="mt-6">
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-error btn-sm"
            >
              刷新页面
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* 背景动画 */}
      <AnimatedBackground particles={particles} floatingIcons={floatingIcons} />

      {/* 主要内容区域 */}
      <motion.div
        className="relative z-10 container mx-auto px-6 py-10"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="visible"
      >
        {/* 交易记录部分 */}
        <EventSection {...TradeRecords({ events: buyEvents || [] })} />
        
        {/* 租赁记录部分 */}
        <EventSection {...LeaseRecords({ events: leaseEvents || [] })} />
        
        {/* 忠诚度奖励记录部分 */}
        <EventSection {...RewardRecords({ events: rewardEvents || [] })} />
        
        {/* 碎片交易记录部分 */}
        <EventSection {...FractionRecords({ events: fractionEvents || [] })} />
        
        {/* 盲盒购买记录部分 */}
        <EventSection {...MysteryBoxRecords({ events: mysteryBoxEvents || [] })} />
        
        {/* 空投领取记录部分 */}
        <EventSection {...AirdropRecords({ events: airdropEvents || [] })} />

        {/* 底部装饰 */}
        <FooterDecoration />
      </motion.div>
    </div>
  );
};

export default Transfers;
