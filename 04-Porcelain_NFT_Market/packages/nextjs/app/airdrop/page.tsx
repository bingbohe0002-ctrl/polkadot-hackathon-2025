"use client";

import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { generateMerkleTree } from "~~/utils/merkleTree";
import { notification } from "~~/utils/scaffold-eth";
import { /*saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";

type AirdropInfo = {
  address: string;
  tokenId: number;
};

type AirdropEntry = {
  address: string;
  tokenId: string;
  isValid: boolean;
  error?: string;
};

export default function AirdropPage() {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const [airdropEntries, setAirdropEntries] = useState<AirdropEntry[]>([{ address: "", tokenId: "", isValid: true }]);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [proofs, setProofs] = useState<Array<{ address: string; tokenId: number; proof: string[] }>>([]);
  const [loading, setLoading] = useState(false);

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 添加/删除输入行
  const handleAddEntry = () => {
    setAirdropEntries([...airdropEntries, { address: "", tokenId: "", isValid: true }]);
  };

  const handleRemoveEntry = (index: number) => {
    if (airdropEntries.length > 1) {
      setAirdropEntries(airdropEntries.filter((_, i) => i !== index));
    }
  };

  // 更新输入值
  const handleUpdateEntry = (index: number, field: "address" | "tokenId", value: string) => {
    const newEntries = [...airdropEntries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value,
      isValid: true,
      error: undefined,
    };
    setAirdropEntries(newEntries);
  };

  // 验证输入
  const validateEntry = (entry: AirdropEntry): boolean => {
    if (!entry.address || !entry.tokenId) {
      entry.error = "地址和代币ID都不能为空";
      entry.isValid = false;
      return false;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(entry.address)) {
      entry.error = "无效的地址格式";
      entry.isValid = false;
      return false;
    }
    if (!/^\d+$/.test(entry.tokenId) || parseInt(entry.tokenId) < 0) {
      entry.error = "无效的代币ID";
      entry.isValid = false;
      return false;
    }
    return true;
  };

  // 修改生成默克尔树函数
  const handleGenerateMerkleTree = () => {
    try {
      const validatedEntries = [...airdropEntries];
      const isValid = validatedEntries.every(entry => validateEntry(entry));
      setAirdropEntries(validatedEntries);

      if (!isValid) {
        throw new Error("请修正输入错误");
      }

      const airdropList: AirdropInfo[] = validatedEntries.map(entry => ({
        address: entry.address,
        tokenId: parseInt(entry.tokenId),
      }));

      const { root, proofs } = generateMerkleTree(airdropList);
      setMerkleRoot(root);
      setProofs(proofs);
      
      notification.success("默克尔树生成成功！");
    } catch (error) {
      console.error("生成默克尔树错误:", error);
      notification.error(error instanceof Error ? error.message : "生成默克尔树失败");
    }
  };

  // 设置默克尔树根
  const handleSetMerkleRoot = async () => {
    try {
      setLoading(true);
      const tx = await writeContractAsync({
        functionName: "setMerkleRoot",
        args: [merkleRoot as `0x${string}`],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt.transactionHash,
      //   method_name: "batchMintItems",
      //   gas_used: receipt.gasUsed.toString(),
      //   gas_price: receipt.effectiveGasPrice.toString(),
      //   total_cost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
      //   user_address: address,
      //   block_number: receipt.blockNumber.toString(),
      // });
      notification.success("默克尔根设置成功！");
    } catch (error) {
      console.error("设置默克尔根错误:", error);
      notification.error("设置默克尔根失败");
    } finally {
      setLoading(false);
    }
  };

  // 下载证明
  const handleDownloadProofs = () => {
    const proofsJson = JSON.stringify(proofs, null, 2);
    const blob = new Blob([proofsJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merkle-proofs.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 容器动画
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

  // 粒子动画配置
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  // 添加装饰性配置
  const floatingIcons = [
    { icon: "🎯", delay: 0 },
    { icon: "🎁", delay: 1 },
    { icon: "✨", delay: 2 },
    { icon: "💫", delay: 3 },
    { icon: "🌟", delay: 4 },
  ];

  const statsData = [
    { label: "已创建空投", value: airdropEntries.length.toString(), icon: "📦" },
    { label: "已生成证明", value: proofs.length.toString(), icon: "🔑" },
    { label: "默克尔根状态", value: merkleRoot ? "已生成" : "未生成", icon: "🌳" },
  ];

  const tips = [
    "每行输入一个空投地址和代币ID",
    "确保地址格式正确（0x开头）",
    "代币ID必须为正整数",
    "生成后请及时保存证明文件",
  ];

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
        <div className="absolute w-[500px] h-[500px] -top-48 -left-48 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute w-[500px] h-[500px] -bottom-48 -right-48 bg-secondary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* 添加浮动图标 */}
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

      <div className="relative z-10 container mx-auto px-6 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* 标题部分 */}
          <motion.div 
            variants={itemVariants} 
            className="text-center relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl"
            />
            <h1 className="text-6xl font-bold mb-4 relative">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent 
                drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                瓷艺空投管理
              </span>
            </h1>
            <p className="text-xl text-base-content/70">
              轻松管理您的瓷艺空投计划
            </p>
          </motion.div>

          {/* 用户信息卡片 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5
              hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
          >
            <div className="flex items-center gap-6">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center
                  shadow-lg relative overflow-hidden"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse" />
                <svg
                  className="w-8 h-8 text-primary relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </motion.div>
              <div>
                <p className="text-sm text-base-content/70 mb-1">管理员地址</p>
                <Address address={connectedAddress as `0x${string}`} format="long" />
              </div>
            </div>
          </motion.div>

          {/* 添加统计卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {statsData.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-base-100/50 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-base-content/5
                  hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{stat.icon}</div>
                  <div>
                    <p className="text-sm text-base-content/70">{stat.label}</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 添加操作提示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="text-lg font-bold mb-2">操作指南</h3>
                <ul className="space-y-2 text-base-content/70">
                  {tips.map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-primary">•</span>
                      {tip}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* 主要内容区域 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* 左侧输入区域 */}
            <motion.div 
              className="bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5
                hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  空投列表
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-circle btn-ghost btn-sm"
                  onClick={handleAddEntry}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {airdropEntries.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="relative group"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="钱包地址 (0x...)"
                          value={entry.address}
                          onChange={(e) => handleUpdateEntry(index, "address", e.target.value)}
                          className={`input input-bordered w-full bg-base-200/50 backdrop-blur-sm
                            focus:bg-base-100 transition-all duration-300 border-primary/20 focus:border-primary
                            ${!entry.isValid && entry.error ? 'input-error' : ''}`}
                        />
                        <input
                          type="text"
                          placeholder="代币ID"
                          value={entry.tokenId}
                          onChange={(e) => handleUpdateEntry(index, "tokenId", e.target.value)}
                          className={`input input-bordered w-full bg-base-200/50 backdrop-blur-sm
                            focus:bg-base-100 transition-all duration-300 border-primary/20 focus:border-primary
                            ${!entry.isValid && entry.error ? 'input-error' : ''}`}
                        />
                      </div>
                      {airdropEntries.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="btn btn-circle btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveEntry(index)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      )}
                    </div>
                    {!entry.isValid && entry.error && (
                      <p className="text-error text-sm mt-1">{entry.error}</p>
                    )}
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80
                  transition-all duration-300"
                onClick={handleGenerateMerkleTree}
              >
                生成默克尔树
              </motion.button>
            </motion.div>

            {/* 右侧结果显示区域 */}
            <AnimatePresence>
              {merkleRoot && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5
                    hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <h2 className="text-2xl font-bold mb-4">默克尔树信息</h2>
                  <div className="space-y-4">
                    <div className="bg-base-200/50 p-4 rounded-xl">
                      <p className="text-sm text-base-content/70 mb-2">默克尔根</p>
                      <p className="font-mono text-sm break-all">{merkleRoot}</p>
                    </div>
                    <div className="flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`btn btn-primary flex-1 ${loading ? "loading" : ""}`}
                        onClick={handleSetMerkleRoot}
                        disabled={loading}
                      >
                        设置默克尔根
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-secondary flex-1"
                        onClick={handleDownloadProofs}
                      >
                        下载证明
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 证明列表 */}
          <AnimatePresence>
          {proofs.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5
                  hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  默克尔证明列表
                </h2>
                <div className="overflow-x-auto rounded-xl">
                <table className="table w-full">
                  <thead>
                    <tr>
                        <th className="bg-base-200/50 first:rounded-tl-xl last:rounded-tr-xl">地址</th>
                        <th className="bg-base-200/50">代币 ID</th>
                        <th className="bg-base-200/50">证明</th>
                    </tr>
                  </thead>
                  <tbody>
                      <AnimatePresence>
                    {proofs.map((item, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="hover:bg-base-200/30 transition-colors duration-200"
                          >
                        <td className="font-mono">{item.address}</td>
                        <td>{item.tokenId}</td>
                        <td className="font-mono break-all">
                              <div className="max-h-20 overflow-y-auto">
                          {JSON.stringify(item.proof)}
                              </div>
                        </td>
                          </motion.tr>
                    ))}
                      </AnimatePresence>
                  </tbody>
                </table>
              </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 添加底部装饰 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center text-base-content/50"
          >
            <div className="flex justify-center gap-4 mb-4">
              {["🎨", "🎭", "🎪", "🎢", "🎡"].map((emoji, index) => (
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
            <p className="text-sm">轻松管理您的瓷艺空投计划</p>
          </motion.div>

          {/* 添加成功动画效果 */}
          <AnimatePresence>
            {merkleRoot && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed bottom-8 right-8 text-6xl"
              >
                ✨
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
    </div>
  );
}