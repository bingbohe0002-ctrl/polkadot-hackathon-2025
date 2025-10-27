"use client";

import { lazy, useEffect, useState } from "react";
import type { NextPage } from "next";
import { motion, AnimatePresence } from "framer-motion";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import nftsMetadata from "~~/utils/simpleNFT/nftsMetadata";

const LazyReactJson = lazy(() => import("react-json-view"));

const IpfsUpload: NextPage = () => {
  const [yourJSON, setYourJSON] = useState<object>(nftsMetadata[0]);
  const [loading, setLoading] = useState(false);
  const [uploadedIpfsPath, setUploadedIpfsPath] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleIpfsUpload = async () => {
    setLoading(true);
    const notificationId = notification.loading("正在上传到 IPFS...");
    try {
      const uploadedItem = await addToIPFS(yourJSON);
      notification.remove(notificationId);
      notification.success("成功上传到 IPFS");
      setUploadedIpfsPath(uploadedItem.IpfsHash);
    } catch (error) {
      notification.remove(notificationId);
      notification.error(`上传到 IPFS 失败: ${error.message}`);
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
              IPFS 数据上传
            </span>
          </h1>
          <p className="text-xl text-base-content/70">
            编辑并上传元数据到 IPFS
          </p>
        </motion.div>

        {/* JSON 编辑器区域 */}
        <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-8">
          <div className="bg-base-100/70 backdrop-blur-md rounded-3xl p-8 shadow-xl">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">元数据编辑器</h2>
              <motion.button
                className={`btn btn-primary ${loading ? "loading" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                onClick={handleIpfsUpload}
              >
                {loading ? "上传中..." : "上传到 IPFS"}
              </motion.button>
            </div>
            <div className="divider" />
            {mounted && (
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
            )}
          </div>
        </motion.div>

        {/* 上传结果显示 */}
        <AnimatePresence>
          {uploadedIpfsPath && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-base-100/70 backdrop-blur-md rounded-3xl p-8 shadow-xl">
                <h3 className="text-xl font-bold mb-4">上传成功</h3>
                <div className="bg-base-200/50 rounded-xl p-4 break-all">
                  <p className="text-sm text-base-content/70 mb-2">IPFS 链接：</p>
                  <a
                    href={`https://aqua-famous-koala-370.mypinata.cloud/ipfs/${uploadedIpfsPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary-focus transition-colors"
                  >
                    {`https://aqua-famous-koala-370.mypinata.cloud/ipfs/${uploadedIpfsPath}`}
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default IpfsUpload;
