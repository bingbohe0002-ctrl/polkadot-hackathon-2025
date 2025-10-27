"use client";

import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { MyHoldings } from "./_components";
import { Address } from "~~/components/scaffold-eth";

const ProfilePage = () => {
  const { address, isConnected } = useAccount();

  // 简化装饰性配置
  const floatingIcons = [
    { icon: "👤", delay: 0 },
    { icon: "🎨", delay: 1 },
  ];

  const particles = Array.from({ length: 8 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 4,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 简化的粒子背景 */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
          />
        ))}
      </div>

      {/* 简化的渐变背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] -top-48 -left-48 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute w-[600px] h-[600px] -bottom-48 -right-48 bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 w-full px-4 py-10">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              个人中心
            </span>
          </h1>
          <p className="text-xl text-base-content/70">
            管理您的 数藏 资产
          </p>
        </div>

        {isConnected ? (
          <div className="w-[98%] max-w-[2000px] mx-auto space-y-8">
            {/* 用户信息卡片 */}
            <div className="bg-base-100/50 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-base-content/5
              hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300">
              <div className="flex items-center gap-6">
                <div className="avatar placeholder">
                  <div className="bg-gradient-to-br from-primary to-secondary text-base-100 rounded-full w-20 h-20 
                    flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {address?.substring(0, 4).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    欢迎回来
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <Address address={address} format="long" />
                  </div>
                </div>
              </div>
            </div>

            {/* NFT 展示区域 */}
            <div className="bg-base-100/50 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-base-content/5
              hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                我的 数藏
              </h2>
              <MyHoldings />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            <div className="bg-base-100/50 backdrop-blur-md rounded-3xl p-8 shadow-xl text-center max-w-lg mx-auto 
              border border-base-content/5 hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300">
              <p className="text-xl text-base-content/70 mb-6">
                请连接钱包以查看您的个人信息
              </p>
              <div>
                <RainbowKitCustomConnectButton />
              </div>
            </div>
          </div>
        )}

        {/* 底部 */}
        <div className="mt-12 text-center text-base-content/50">
          <p className="text-sm">探索您的 数藏 资产世界</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 