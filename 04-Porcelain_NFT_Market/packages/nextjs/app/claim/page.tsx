"use client";

import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { /*saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";

type ProofInfo = {
  address: string;
  tokenId: number;
  proof: string[];
};

export default function ClaimPage() {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const [proof, setProof] = useState<string[]>([]);
  const [tokenId, setTokenId] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 粒子动画配置
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  // 在 ClaimPage 组件内添加新的动画配置
  const floatingIcons = [
    { icon: "🎁", delay: 0 },
    { icon: "✨", delay: 1 },
    { icon: "🌟", delay: 2 },
    { icon: "💫", delay: 3 },
    { icon: "🎨", delay: 4 },
  ];

  const statsData = [
    { label: "已空投", value: "1,234", icon: "🎯" },
    { label: "已认领", value: "956", icon: "✅" },
    { label: "剩余", value: "278", icon: "⏳" },
  ];

  // 处理证明文件上传
  const handleProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const proofs = JSON.parse(e.target?.result as string) as ProofInfo[];
          const userProof = proofs.find((p) => 
            p.address.toLowerCase() === connectedAddress?.toLowerCase()
          );
          if (userProof) {
            setProof(userProof.proof);
            setTokenId(userProof.tokenId);
            notification.success("证明加载成功！");
          } else {
            notification.error("未找到您地址的证明");
          }
        } catch (error) {
          console.error("解析证明文件错误:", error);
          notification.error("无效的证明文件格式");
        }
      };
      reader.readAsText(file);
    }
  };

  // 领取空投
  const handleClaim = async () => {
    try {
      if (!proof.length) {
        notification.error("请先上传您的证明");
        return;
      }

      setLoading(true);
      const tx = await writeContractAsync({
        functionName: "claimAirdrop",
        args: [BigInt(tokenId), proof as `0x${string}`[]],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt.transactionHash,
      //   method_name: "claimAirdrop",
      //   gas_used: receipt.gasUsed.toString(),
      //   gas_price: receipt.effectiveGasPrice.toString(),
      //   total_cost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
      //   user_address: address,
      //   block_number: receipt.blockNumber.toString(),
      // });
      notification.success("数藏领取成功！");
    } catch (error) {
      console.error("领取数藏错误:", error);
      notification.error("领取数藏失败");
    } finally {
      setLoading(false);
    }
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* 标题部分 */}
          <motion.div className="text-center relative">
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
                领取空投数藏
              </span>
            </h1>
            <p className="text-xl text-base-content/70">
              上传您的证明文件，领取专属数藏
            </p>
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

          {/* 添加提示卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="text-lg font-bold mb-2">温馨提示</h3>
                <ul className="space-y-2 text-base-content/70">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    请确保您的钱包地址在空投名单中
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    上传正确的证明文件（JSON格式）
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    领取成功后，数藏 将直接发送到您的钱包
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* 用户信息卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                <p className="text-sm text-base-content/70 mb-1">您的地址</p>
                <Address address={connectedAddress as `0x${string}`} format="long" />
              </div>
            </div>
          </motion.div>

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧上传区域 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5
                hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
              whileHover={{ scale: 1.01 }}
            >
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                上传证明
              </h2>
              <div className="space-y-6">
                <div className="relative group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleProofUpload}
                    className="file-input file-input-bordered w-full bg-base-200/50 backdrop-blur-sm
                      focus:bg-base-100 transition-all duration-300 border-primary/20 focus:border-primary"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg opacity-0 
                    group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`btn btn-primary w-full bg-gradient-to-r from-primary to-secondary 
                    hover:from-primary/80 hover:to-secondary/80 transition-all duration-300 ${loading ? "loading" : ""}`}
                  onClick={handleClaim}
                  disabled={!proof.length || tokenId === 0 || loading}
                >
                  领取 数藏
                </motion.button>
              </div>
            </motion.div>

            {/* 右侧信息显示 */}
            <AnimatePresence>
              {(tokenId > 0 || proof.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5
                    hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    证明信息
                  </h2>
                  
                  {tokenId > 0 && (
                    <div className="mb-6 bg-base-200/50 rounded-xl p-4">
                      <p className="text-sm text-base-content/70 mb-2">您的代币 ID</p>
                      <p className="text-2xl font-bold text-primary">{tokenId}</p>
                    </div>
                  )}

                  {proof.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-base-content/70">默克尔证明</p>
                      <div className="bg-base-200/50 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                        <pre className="text-sm font-mono break-all whitespace-pre-wrap">
                          {JSON.stringify(proof, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

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
        <p className="text-sm">享受 数藏 带来的无限可能</p>
      </motion.div>
    </div>
  );
}