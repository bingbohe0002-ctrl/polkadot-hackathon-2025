"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { useAccount, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { formatEther } from "viem";
import { useRouter } from "next/navigation";
import { /*saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";

const Fractionalize: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const publicClient = usePublicClient();
  const [fractionDetails, setFractionDetails] = useState<{ tokenId: number; amount: number }[]>([]);
  const [clientAddress, setClientAddress] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyAmount, setBuyAmount] = useState("");
  const [selectedTokenIdForBuy, setSelectedTokenIdForBuy] = useState<number | null>(null);
  const [selectedOwnerForBuy, setSelectedOwnerForBuy] = useState<string | null>(null);
  const [selectedPriceForBuy, setSelectedPriceForBuy] = useState<bigint | null>(null);

  const { writeContractAsync: writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // Define the read contract hook to call getFractionsByAddress
  const { data: fractionsData, refetch: fetchFractions } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAllFractionsForSale",
  });

  const router = useRouter();

  useEffect(() => {
    if (connectedAddress && fractionsData) {
      const tokenIds = fractionsData[0]; // 第一个返回的数组
      const owners = fractionsData[1]; // 第二个返回的数组
      const fractions = fractionsData[2]; // 第三个返回的数组

      // 将数据转换为对象数组以便于渲染
      const parsedData = tokenIds.map((tokenId: any, index: number) => ({
        tokenId: Number(tokenId),
        owner: owners[index],
        amount: Number(fractions[index].amount),
        isForSale: fractions[index].isForSale,
        price: fractions[index].price,
      }));

      setFractionDetails(parsedData);
    }
  }, [connectedAddress, fractionsData]);

  useEffect(() => {
    // 在客户端渲染���置地址
    if (isConnected) {
      setClientAddress(connectedAddress);
    }
  }, [connectedAddress, isConnected]);

  // 购买碎片
  const handleBuyFraction = async () => {
    if (!selectedTokenIdForBuy || !selectedOwnerForBuy || !buyAmount || !selectedPriceForBuy) {
      notification.error("Please fill out all fields.");
      return;
    }

    try {
      setLoading(true);

      // 计算总价格
      const totalPriceWei = selectedPriceForBuy * BigInt(parseInt(buyAmount, 10));
      console.log("Total Price (Wei):", totalPriceWei);

      const tx = await writeContractAsync({
        functionName: "buyFraction",
        args: [selectedTokenIdForBuy, selectedOwnerForBuy, parseInt(buyAmount, 10)],
        value: totalPriceWei,
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt?.transactionHash,
      //   method_name: 'buyFraction',
      //   gas_used: receipt?.gasUsed,
      //   gas_price: receipt?.effectiveGasPrice,
      //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
      //   user_address: connectedAddress as string,
      //   block_number: receipt?.blockNumber
      // });

      notification.success("Fraction purchase successful!");
      fetchFractions(); // 更新页面数据
      setShowBuyModal(false); // 关闭模态框
    } catch (error) {
      console.error(error);
      notification.error("Fraction purchase failed!");
    } finally {
      setLoading(false);
    }
  };

  // 下架碎片
  const handleCancelSale = async (tokenId: number) => {
    try {
      setLoading(true);
      const tx = await writeContractAsync({
        functionName: "cancelFractionSale",
        args: [tokenId],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt.transactionHash,
      //   method_name: "cancelFractionSale",
      //   gas_used: receipt.gasUsed.toString(),
      //   gas_price: receipt.effectiveGasPrice.toString(),
      //   total_cost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
      //   user_address: connectedAddress,
      //   block_number: receipt.blockNumber.toString(),
      // });
      notification.success("Fraction sale cancelled!");
      fetchFractions(); // 更新页面数据
    } catch (error) {
      console.error(error);
      notification.error("Failed to cancel sale.");
    } finally {
      setLoading(false);
    }
  };

  // 添加查看详情函数
  const handleViewDetails = (tokenId: number) => {
    router.push(`/market/nftDetail/${tokenId}`);
  };

  // 添加装饰性配置
  const floatingIcons = [
    { icon: "💎", delay: 0 },
    { icon: "🔄", delay: 1 },
    { icon: "✨", delay: 2 },
    { icon: "📈", delay: 3 },
    { icon: "🌟", delay: 4 },
  ];

  const particles = Array.from({ length: 30 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  // 动画变体配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* 动态粒子背景 */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          animate={{
            x: ["0%", `${particle.x}%`, "0%"],
            y: ["0%", `${particle.y}%`, "0%"],
            opacity: [0, 1, 0],
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

      {/* 渐变光晕背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] -top-48 -left-48 bg-primary/10 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] -bottom-48 -right-48 bg-secondary/10 rounded-full blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* 浮动图标 */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl"
          initial={{ opacity: 0, y: 100 }}
          animate={{
            opacity: [0, 1, 0],
            y: [-20, -100, -20],
            x: [Math.random() * 100, Math.random() * -100, Math.random() * 100],
          }}
          transition={{
            duration: 5,
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

      <motion.div
        className="relative z-10 container mx-auto px-6 py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 标题部分 */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 relative">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent
            drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
              数藏 碎片化交易
            </span>
          </h1>
          <p className="text-xl text-base-content/70">
            将您的 数藏 转化为可交易的碎片份额
          </p>
        </motion.div>

        {/* 操作指南卡片 */}
        <motion.div
          variants={itemVariants}
          className="mb-8 bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="text-lg font-bold mb-2">交易指南</h3>
              <ul className="space-y-2 text-base-content/70">
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-primary">•</span>
                  选择要交易的 数藏 碎片
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-primary">•</span>
                  输入交易数量和价格
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-primary">•</span>
                  确认交易并等待完成
                </motion.li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* 主要内容区域 */}
        <motion.div
          variants={itemVariants}
          className="space-y-8"
        >
          {/* 碎片列表 */}
          <motion.div
            className="bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5
              hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
            whileHover={{ scale: 1.01 }}
          >
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              可交易碎片列表
            </h2>
            
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="bg-base-200/50">Token ID</th>
                    <th className="bg-base-200/50">拥有者</th>
                    <th className="bg-base-200/50">数量</th>
                    <th className="bg-base-200/50">价格</th>
                    <th className="bg-base-200/50">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {fractionDetails.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={5} className="text-center py-8">
                          <p className="text-base-content/70">暂无可交易的碎片</p>
                        </td>
                      </motion.tr>
                    ) : (
                      fractionDetails.map((fraction, index) => (
                        <motion.tr
                          key={`${fraction.tokenId}-${fraction.owner}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-base-200/50"
                        >
                          <td>{fraction.tokenId}</td>
                          <td>
                            <Address address={fraction.owner as `0x${string}`} />
                          </td>
                          <td>{fraction.amount}</td>
                          <td>{formatEther(fraction.price)} ETH</td>
                          <td>
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setSelectedTokenIdForBuy(fraction.tokenId);
                                  setSelectedOwnerForBuy(fraction.owner);
                                  setSelectedPriceForBuy(fraction.price);
                                  setShowBuyModal(true);
                                }}
                              >
                                购买
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleViewDetails(fraction.tokenId)}
                              >
                                详情
                              </motion.button>
                              {fraction.owner === clientAddress && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="btn btn-error btn-sm"
                                  onClick={() => handleCancelSale(fraction.tokenId)}
                                >
                                  下架
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* 购买模态框 */}
          {showBuyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-base-100 rounded-3xl p-6 shadow-xl max-w-md w-full mx-4"
              >
                <h3 className="text-xl font-bold mb-4">购买碎片</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">购买数量</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="mt-6 flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`btn btn-primary flex-1 ${loading ? "loading" : ""}`}
                    onClick={handleBuyFraction}
                    disabled={loading}
                  >
                    确认购买
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-ghost flex-1"
                    onClick={() => setShowBuyModal(false)}
                  >
                    取消
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center text-base-content/50"
        >
          <div className="flex justify-center gap-4 mb-4">
            {["💎", "🔄", "📈", "✨", "🌟"].map((emoji, index) => (
              <motion.span
                key={index}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  delay: index * 0.2,
                  repeat: Infinity,
                }}
                className="text-2xl"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
          <p className="text-sm">开启 数藏 碎片化交易新时代</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Fractionalize;
