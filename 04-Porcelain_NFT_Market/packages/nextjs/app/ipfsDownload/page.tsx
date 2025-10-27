"use client";

import { lazy, useEffect, useState } from "react";
import type { NextPage } from "next";
import { motion, AnimatePresence } from "framer-motion";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

const LazyReactJson = lazy(() => import("react-json-view"));

const IpfsDownload: NextPage = () => {
  const [yourJSON, setYourJSON] = useState({});
  const [ipfsPath, setIpfsPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleIpfsDownload = async () => {
    if (!ipfsPath.trim()) {
      notification.error("请输入 IPFS 路径");
      return;
    }

    setLoading(true);
    const notificationId = notification.loading("正在从 IPFS 获取数据...");
    try {
      const metaData = await getMetadataFromIPFS(ipfsPath);
      notification.remove(notificationId);
      notification.success("成功从 IPFS 下载数据");
      setYourJSON(metaData);
    } catch (error) {
      notification.remove(notificationId);
      notification.error(`从 IPFS 下载失败: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 动画配置
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
    <div className="min-h-screen bg-gradient-to-b from-base-300 to-base-100 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 -top-48 -left-48 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-96 h-96 -bottom-48 -right-48 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-6 py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 标题部分 */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent 
              drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
              IPFS 数据查询
            </span>
          </h1>
          <p className="text-xl text-base-content/70">
            输入 IPFS 路径，获取存储的元数据
          </p>
        </motion.div>

        {/* 输入区域 */}
        <motion.div
          variants={itemVariants}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="bg-base-100/70 backdrop-blur-md rounded-3xl p-8 shadow-xl">
            <div className="form-control">
              <div className="relative">
                <input
                  className="input input-bordered w-full pr-16 text-lg h-14"
                  placeholder="输入 IPFS tokenURI"
                  value={ipfsPath}
                  onChange={e => setIpfsPath(e.target.value)}
                  autoComplete="off"
                />
                <motion.button
                  className={`btn btn-primary absolute right-0 top-0 rounded-l-none h-14 px-6 ${loading ? "loading" : ""}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                  onClick={handleIpfsDownload}
                >
                  {loading ? "获取中..." : "获取数据"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* JSON 显示区域 */}
        <AnimatePresence mode="wait">
          {mounted && Object.keys(yourJSON).length > 0 && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-base-100/70 backdrop-blur-md rounded-3xl p-8 shadow-xl">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">元数据内容</h2>
                  <div className="divider" />
                </div>
                <div className="overflow-x-auto">
                  <LazyReactJson
                    style={{
                      padding: "1rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                    src={yourJSON}
                    theme="solarized"
                    enableClipboard={false}
                    onEdit={edit => {
                      setYourJSON(edit.updated_src);
                    }}
                    onAdd={add => {
                      setYourJSON(add.updated_src);
                    }}
                    onDelete={del => {
                      setYourJSON(del.updated_src);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default IpfsDownload;
