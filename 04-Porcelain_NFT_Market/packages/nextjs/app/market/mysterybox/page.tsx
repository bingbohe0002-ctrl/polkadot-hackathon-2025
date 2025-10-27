"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldContract, useScaffoldReadContract , useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS, /*saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";
import { MysteryBox3D } from "~~/components/mystery-box/MysteryBox3D";

const styles = {
  perspective1000: {
    perspective: "1000px",
  },
  transformStyle3d: {
    transformStyle: "preserve-3d",
  },
  backfaceHidden: {
    backfaceVisibility: "hidden",
  },
} as const;

interface MysteryBoxInfo {
  price: bigint;
  isActive: boolean;
  totalOptions: bigint;
}

// 在文件开头添加装饰性配置
const decorativeConfig = {
  // 浮动图标配置
  floatingIcons: [
    { icon: "🎁", delay: 0, size: "text-4xl" },
    { icon: "🎲", delay: 1.2, size: "text-3xl" },
    { icon: "✨", delay: 0.8, size: "text-2xl" },
    { icon: "🎭", delay: 2, size: "text-4xl" },
    { icon: "🌟", delay: 1.5, size: "text-3xl" },
    { icon: "🎨", delay: 2.5, size: "text-2xl" },
    { icon: "🎪", delay: 1.8, size: "text-4xl" },
    { icon: "💫", delay: 0.5, size: "text-3xl" }
  ],
  
  // 粒子效果配置
  particles: Array.from({ length: 50 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 2,
    color: Math.random() > 0.5 ? "primary" : "secondary",
  })),

  // 光效配置
  glowEffects: [
    { color: "from-primary/20", position: "-top-40 -left-40", size: "w-96 h-96" },
    { color: "from-secondary/20", position: "-bottom-40 -right-40", size: "w-96 h-96" },
    { color: "from-accent/20", position: "top-1/2 left-1/2", size: "w-80 h-80" }
  ]
};

const MysteryBoxMarket: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [mysteryBoxInfo, setMysteryBoxInfo] = useState<MysteryBoxInfo | null>(null);
  const [nftImages, setNftImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 读取盲盒信息
  const { data: boxInfo } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getMysteryBoxInfo",
    watch: true,
  });

  // 更新盲盒信息
  useEffect(() => {
    if (boxInfo) {
      setMysteryBoxInfo({
        price: boxInfo[0],
        isActive: boxInfo[1],
        totalOptions: boxInfo[2],
      });
    }
  }, [boxInfo]);

  // 购买盲盒
  const handlePurchase = async () => {
    if (!mysteryBoxInfo?.isActive) {
      notification.error("盲盒未激活");
      return;
    }

    if (!mysteryBoxInfo?.totalOptions) {
      notification.error("盲盒已售罄");
      return;
    }

    setIsLoading(true);
    const notificationId = notification.loading("正在购买盲盒...");

    try {
      const tx = await writeContractAsync({
        functionName: "purchaseMysteryBox",
        value: mysteryBoxInfo.price,
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
       // await saveGasRecord({
       //   tx_hash: receipt.transactionHash,
       //   method_name: "buyMysteryBox",
       //   gas_used: receipt.gasUsed.toString(),
       //   gas_price: receipt.effectiveGasPrice.toString(),
       //   total_cost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
       //   user_address: address,
       //   block_number: receipt.blockNumber.toString(),
       // });
       // await saveGasRecord({
       //   tx_hash: receipt?.transactionHash,
       //   method_name: 'purchaseMysteryBox',
       //   gas_used: receipt?.gasUsed,
       //   gas_price: receipt?.effectiveGasPrice,
       //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
       //   user_address: connectedAddress as string,
       //   block_number: receipt?.blockNumber
       // });

      notification.remove(notificationId);
      notification.success("购买成功！");
    } catch (error) {
      console.error("购买失败:", error);
      notification.remove(notificationId);
      notification.error("购买失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 创建盲盒数据
  const mysteryBox = mysteryBoxInfo ? {
    id: 1,
    price: mysteryBoxInfo.price,
    remaining: Number(mysteryBoxInfo.totalOptions),
    isActive: mysteryBoxInfo.isActive,
  } : null;

  // 添加函数来获取所有 URI 对应的图片
  const fetchNFTImages = async () => {
    if (!mysteryBoxInfo?.totalOptions) return;
    
    setIsLoadingImages(true);
    try {
      const images = [];
      // 循环获取每个 URI 对应的图片
      for (let i = 0; i < Number(mysteryBoxInfo.totalOptions); i++) {
        const uri = await yourCollectibleContract?.read?.getMysteryBoxURI([BigInt(i)])
        
        if (uri) {
          const metadata = await getMetadataFromIPFS(`https://aqua-famous-koala-370.mypinata.cloud/ipfs/${uri}`);
          if (metadata?.image) {
            images.push(metadata.image);
          }
        }
      }
      setNftImages(images);
    } catch (error) {
      console.error("获取数藏图片失败:", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // 在 mysteryBoxInfo 更新时获取图片
  useEffect(() => {
    if (mysteryBoxInfo?.totalOptions) {
      fetchNFTImages();
    }
  }, [mysteryBoxInfo?.totalOptions]);

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* 粒子背景 */}
      {decorativeConfig.particles.map((particle, i) => (
        <motion.div
          key={`particle-${i}`}
          className={`absolute w-${particle.size} h-${particle.size} bg-${particle.color}/30 rounded-full blur-sm`}
          animate={{
            x: ["0%", `${particle.x}%`, "0%"],
            y: ["0%", `${particle.y}%`, "0%"],
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 浮动图标 */}
      {decorativeConfig.floatingIcons.map((item, index) => (
        <motion.div
          key={`icon-${index}`}
          className={`absolute ${item.size} pointer-events-none`}
          initial={{ opacity: 0, y: 100 }}
          animate={{
            opacity: [0, 1, 0],
            y: [20, -100, 20],
            x: [
              Math.random() * 100 - 50,
              Math.random() * 100 - 50,
              Math.random() * 100 - 50
            ],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          {item.icon}
        </motion.div>
      ))}

      {/* 光效背景 */}
      {decorativeConfig.glowEffects.map((effect, index) => (
        <motion.div
          key={`glow-${index}`}
          className={`absolute ${effect.size} ${effect.position} bg-gradient-radial ${effect.color} to-transparent rounded-full blur-3xl opacity-50`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 主要内容容器 */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题区域 */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold mb-6 relative inline-block">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              神秘盲盒
            </span>
            <motion.div
              className="absolute -z-10 inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed">
            探索数字艺术的无限可能，每个盲盒都是一次独特的艺术之旅
          </p>
        </motion.div>

        {/* 盲盒展示和购买区域 */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* 左侧：3D 盲盒展示 */}
          <motion.div
            className="relative aspect-square max-w-md mx-auto"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full h-full">
              <MysteryBox3D />
            </div>
          </motion.div>

          {/* 右侧：购买信息 */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {mysteryBox && (
              <div className="bg-base-200/50 backdrop-blur-lg rounded-3xl p-8 border border-base-content/5">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      限量发售
                    </h3>
                    <span className="px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold">
                      {mysteryBox.remaining} 个可用
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{formatEther(mysteryBox.price)}</span>
                    <span className="text-xl text-base-content/70">ETH</span>
                  </div>

                  {!isConnected || isConnecting ? (
                    <RainbowKitCustomConnectButton />
                  ) : (
                    <motion.button
                      className={`btn btn-primary w-full h-16 text-lg font-bold ${isLoading ? "loading" : ""}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePurchase}
                      disabled={isLoading || !mysteryBox.isActive || mysteryBox.remaining === 0}
                    >
                      {isLoading ? "购买中..." : "立即购买"}
                    </motion.button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* NFT 展示区域 */}
        <div className="mt-32 mb-20">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                稀有藏品展示
              </span>
            </h2>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
              解锁任意一款独特 数藏，开启您的数字艺术收藏之旅
            </p>
          </motion.div>

          {isLoadingImages ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <motion.div
                  className="absolute inset-0 bg-primary/20 blur-xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <p className="mt-6 text-lg text-base-content/60 animate-pulse">
                正在加载珍藏内容...
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* 装饰性背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl blur-xl -z-10" />
              
              {/* NFT 网格展示 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-8">
                {nftImages.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    className="group relative bg-base-200/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    {/* 闪光效果 */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse" />
                    </div>

                    {/* 图片容器 */}
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={image}
                        alt={`数藏 ${index + 1}`}
                        className="w-full h-full object-cover transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-3"
                      />
                    </div>

                    {/* 信息遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-white font-bold text-lg mb-2">
                          神秘 数藏 #{index + 1}
                        </p>
                        <p className="text-white/80 text-sm">
                          独特的数字艺术珍藏
                        </p>
                      </div>
                    </div>

                    {/* 装饰性图标 */}
                    <motion.div
                      className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                      whileHover={{ rotate: 180 }}
                    >
                      <span className="text-white text-xl">✨</span>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* 底部装饰 */}
              <motion.div
                className="mt-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="inline-flex items-center gap-4 px-6 py-3 bg-base-200/50 backdrop-blur-sm rounded-full">
                  <span className="text-xl">✨</span>
                  <p className="text-base text-base-content/80">
                    每个盲盒都是独特的艺术珍藏
                  </p>
                  <span className="text-xl">✨</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MysteryBoxMarket;