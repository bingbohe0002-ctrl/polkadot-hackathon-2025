"use client";

import { useState, useEffect, useCallback } from "react";
import type { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { uploadFileToIPFS, addToIPFS /*, saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

interface MysteryBoxInfo {
  price: bigint;
  isActive: boolean;
  totalOptions: bigint;
}

interface NFTFile {
  file: File;
  previewUrl: string;
  ipfsHash?: string;  // 添加ipfsHash字段存储上传后的hash
}

// 添加属性接口
interface Attribute {
  trait_type: string;
  value: string;
}

const MysteryBoxPage: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const publicClient = usePublicClient();
  const [price, setPrice] = useState("");
  const [royaltyFee, setRoyaltyFee] = useState(250); // 默认版税 2.5%
  const [nftFiles, setNftFiles] = useState<NFTFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 新增状态变量
  const [mysteryBoxInfo, setMysteryBoxInfo] = useState<MysteryBoxInfo | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [newUri, setNewUri] = useState("");
  const [newUriFile, setNewUriFile] = useState<File | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([
    { trait_type: "", value: "" }
  ]);

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 读取盲盒信息
  const { data: boxInfo, refetch: refetchBoxInfo } = useScaffoldReadContract({
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

  // 修改文件拖拽处理函数
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setNftFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  // 修改移除文件函数
  const removeFile = (index: number) => {
    setNftFiles(prevFiles => {
      URL.revokeObjectURL(prevFiles[index].previewUrl);
      return prevFiles.filter((_, i) => i !== index);
    });
  };

  // 添加上传单个文件到IPFS的函数
  const uploadSingleFile = async (file: NFTFile) => {
    if (file.ipfsHash) return; // 如果已经上传过，就跳过

    const uploadedFile = await uploadFileToIPFS(file.file);
    if (!uploadedFile?.IpfsHash) throw new Error("上传文件失败");

    return uploadedFile.IpfsHash;
  };

  // 添加上传所有文件到IPFS的函数
  const handleUploadFiles = async () => {
    if (nftFiles.length === 0) {
      notification.error("请先选择文件");
      return;
    }

    setIsUploading(true);
    const notificationId = notification.loading("正在上传文件到IPFS...");

    try {
      const updatedFiles = [...nftFiles];
      for (let i = 0; i < updatedFiles.length; i++) {
        if (!updatedFiles[i].ipfsHash) {
          const ipfsHash = await uploadSingleFile(updatedFiles[i]);
          updatedFiles[i] = { ...updatedFiles[i], ipfsHash };
        }
      }
      setNftFiles(updatedFiles);
      notification.remove(notificationId);
      notification.success("文件上传成功！");
    } catch (error) {
      console.error("上传文件失败:", error);
      notification.remove(notificationId);
      notification.error("上传文件失败");
    } finally {
      setIsUploading(false);
    }
  };

  // 添加属性处理函数
  const handleAttributeChange = (index: number, field: keyof Attribute, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  // 添加新属性
  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: "", value: "" }]);
  };

  // 删除属性
  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // 修改创建盲盒函数
  const handleCreateMysteryBox = async () => {
    if (!price || nftFiles.length === 0) {
      notification.error("请填写价格并上传至少一个数藏文件");
      return;
    }

    if (nftFiles.some(file => !file.ipfsHash)) {
      notification.error("请先上传所有文件到IPFS");
      return;
    }

    setIsLoading(true);
    const notificationId = notification.loading("正在创建盲盒...");

    try {
      // 上传元数据到IPFS
      const metadataPromises = nftFiles.map(async (file, index) => {
        const metadata = {
          name: `神秘数藏 #${index + 1}`,
          description: "一个盲盒中的神秘数藏",
          image: `https://aqua-famous-koala-370.mypinata.cloud/ipfs/${file.ipfsHash}`,
          attributes: attributes.filter(attr => attr.trait_type && attr.value) // 只包含非空属性
        };

        const metadataUpload = await addToIPFS(metadata);
        if (!metadataUpload?.IpfsHash) throw new Error("上传元数据失败");
        return metadataUpload.IpfsHash;
      });

      const uris = await Promise.all(metadataPromises);

      // 调用合约创建盲盒
      const tx = await writeContractAsync({
        functionName: "createMysteryBox",
        args: [parseEther(price), uris, BigInt(royaltyFee)],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx as `0x${string}`
      });

      // 保存gas记录
       // await saveGasRecord({
       //   tx_hash: receipt?.transactionHash,
       //   method_name: 'createMysteryBox',
       //   gas_used: receipt?.gasUsed,
       //   gas_price: receipt?.effectiveGasPrice,
       //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
       //   user_address: connectedAddress as string,
       //   block_number: receipt?.blockNumber
       // });

      notification.remove(notificationId);
      notification.success("盲盒创建成功！");

      // 清空表单
      setPrice("");
      setNftFiles([]);
    } catch (error) {
      console.error("创建盲盒失败:", error);
      notification.remove(notificationId);
      notification.error("创建盲盒失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 更新盲盒价格
  const handleUpdatePrice = async () => {
    if (!newPrice) {
      notification.error("请输入新价格");
      return;
    }

    try {
      const tx = await writeContractAsync({
        functionName: "updateMysteryBoxPrice",
        args: [parseEther(newPrice)],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx as `0x${string}`
      });

      // 保存gas记录
       // await saveGasRecord({
       //   tx_hash: receipt?.transactionHash,
       //   method_name: 'updateMysteryBoxPrice',
       //   gas_used: receipt?.gasUsed,
       //   gas_price: receipt?.effectiveGasPrice,
       //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
       //   user_address: connectedAddress as string,
       //   block_number: receipt?.blockNumber
       // });

      notification.success("价格更新成功！");
      setNewPrice("");
      refetchBoxInfo();
    } catch (error) {
      console.error("更新价格失败:", error);
      notification.error("更新价格失败");
    }
  };

  // 更改盲盒状态
  const handleToggleStatus = async () => {
    try {
      const tx = await writeContractAsync({
        functionName: "setMysteryBoxStatus",
        args: [!mysteryBoxInfo?.isActive],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx as `0x${string}`
      });

      // 保存gas记录
       // await saveGasRecord({
       //   tx_hash: receipt?.transactionHash,
       //   method_name: 'setMysteryBoxStatus',
       //   gas_used: receipt?.gasUsed,
       //   gas_price: receipt?.effectiveGasPrice,
       //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
       //   user_address: connectedAddress as string,
       //   block_number: receipt?.blockNumber
       // });

      notification.success(`盲盒已${mysteryBoxInfo?.isActive ? "停用" : "激活"}！`);
      refetchBoxInfo();
    } catch (error) {
      console.error("切换状态失败:", error);
      notification.error("切换状态失败");
    }
  };

  // 处理新URI文件上传
  const handleNewUriFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewUriFile(file);
    }
  };

  // 添加新URI到盲盒
  const handleAddNewUri = async () => {
    if (!newUriFile) {
      notification.error("请选择文件");
      return;
    }

    try {
      // 上传文件到IPFS
      const uploadedFile = await uploadFileToIPFS(newUriFile);
      if (!uploadedFile?.IpfsHash) throw new Error("上传文件失败");
      notification.success("上传文件成功");

      // 创建并上传元数据
      const metadata = {
        name: `神秘数藏 #${mysteryBoxInfo ? Number(mysteryBoxInfo.totalOptions) + 1 : 1}`,
        description: "一个盲盒中的神秘数藏",
        image: `https://aqua-famous-koala-370.mypinata.cloud/ipfs/${uploadedFile.IpfsHash}`,
        attributes: attributes.filter(attr => attr.trait_type && attr.value) // 只包含非空属性
      };

      // 上传元数据到IPFS
      const metadataUpload = await addToIPFS(metadata);
      if (!metadataUpload?.IpfsHash) throw new Error("上传元数据失败");
      notification.success("上传元数据成功");

      // 添加新URI到盲盒
      const tx = await writeContractAsync({
        functionName: "addURIToMysteryBox",
        args: [metadataUpload.IpfsHash],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx as `0x${string}`
      });

      // 保存gas记录
       // await saveGasRecord({
       //   tx_hash: receipt?.transactionHash,
       //   method_name: 'addURIToMysteryBox',
       //   gas_used: receipt?.gasUsed,
       //   gas_price: receipt?.effectiveGasPrice,
       //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
       //   user_address: connectedAddress as string,
       //   block_number: receipt?.blockNumber
       // });

      notification.success("新数藏添加成功！");
      setNewUri("");
      setNewUriFile(null);
      refetchBoxInfo();
    } catch (error) {
      console.error("添加URI失败:", error);
      notification.error("添加URI失败");
    }
  };

  // 添加装饰性配置
  const floatingIcons = [
    { icon: "🎁", delay: 0 },
    { icon: "🎲", delay: 1 },
    { icon: "🎨", delay: 2 },
    { icon: "🎭", delay: 3 },
    { icon: "✨", delay: 4 },
  ];

  const particles = Array.from({ length: 30 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  const statsData = mysteryBoxInfo ? [
    { label: "盲盒价格", value: `${formatEther(mysteryBoxInfo.price)} ETH`, icon: "💰" },
    { label: "盲盒状态", value: mysteryBoxInfo.isActive ? "已激活" : "未激活", icon: "🔮" },
    { label: "可选数藏", value: mysteryBoxInfo.totalOptions.toString(), icon: "🎯" },
  ] : [];

  const tips = [
    "上传优质的 数藏 图片文件",
    "设置合理的盲盒价格",
    "添加丰富的 数藏 属性",
    "激活盲盒开始销售",
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
                数藏 盲盒管理
              </span>
            </h1>
            <p className="text-xl text-base-content/70">
              创建和管理您的 数藏 盲盒
            </p>
          </motion.div>

          {/* 统计卡片 */}
          {mysteryBoxInfo && (
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
          )}

          {/* 操作提示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-base-content/5"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="text-lg font-bold mb-2">创建指南</h3>
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

          {/* 现有的主要内容区域，添加动画效果 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* 现有的盲盒信息部分，包装在动画容器中 */}
            {mysteryBoxInfo && (
              <motion.div
                className="w-full max-w-3xl mx-auto bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl 
                  border border-base-content/5 hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <h2 className="text-2xl font-bold mb-4">当前盲盒信息</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-lg">价格: {formatEther(mysteryBoxInfo.price)} ETH</p>
                    <p className="text-lg">状态: {mysteryBoxInfo.isActive ? "激活" : "未激活"}</p>
                    <p className="text-lg">可选数藏数量: {mysteryBoxInfo.totalOptions.toString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className={`btn ${mysteryBoxInfo.isActive ? "btn-error" : "btn-success"}`}
                      onClick={handleToggleStatus}
                    >
                      {mysteryBoxInfo.isActive ? "停用盲盒" : "激活盲盒"}
                    </button>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        className="input input-bordered flex-1"
                        placeholder="新价格 (ETH)"
                        step="0.01"
                      />
                      <button className="btn btn-primary" onClick={handleUpdatePrice}>
                        更新价格
                      </button>
                    </div>
                  </div>
                </div>

                {/* 添加新URI */}
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2">添加新数藏</h3>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      onChange={handleNewUriFileChange}
                      className="file-input file-input-bordered flex-1"
                      accept="image/*"
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={handleAddNewUri}
                      disabled={!newUriFile}
                    >
                      添加数藏
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 现有的创建新盲盒部分，包装在动画容器中 */}
            <motion.div
              className="w-full max-w-3xl mx-auto bg-base-100/50 backdrop-blur-md rounded-3xl p-6 shadow-xl 
                border border-base-content/5 hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
              whileHover={{ scale: 1.01 }}
            >
              <h2 className="text-2xl font-bold mb-4">创建新盲盒</h2>
              {/* 价格输入 */}
              <div className="mb-6">
                <label className="block text-lg mb-2">盲盒价格 (ETH)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="输入盲盒价格"
                  step="0.01"
                />
              </div>

              {/* 版税设置 */}
              <div className="mb-6">
                <label className="block text-lg mb-2">版税比例</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={royaltyFee / 100}
                    onChange={e => {
                      const value = Math.round(parseFloat(e.target.value) * 100);
                      if (!isNaN(value) && value >= 0 && value <= 1000) {
                        setRoyaltyFee(value);
                      }
                    }}
                    className="input input-bordered flex-1"
                    placeholder="输入版税比例"
                    step="any"
                    min="0"
                    max="10"
                  />
                  <span className="text-lg">%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  版税比例范围: 0% - 10%
                </p>
              </div>

              {/* 文件上传 */}
              <div className="mb-6">
                <label className="block text-lg mb-2">上传 数藏 文件</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                    }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className={`w-12 h-12 ${isDragActive ? 'text-primary' : 'text-gray-400'}`}
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-lg">
                      {isDragActive ? (
                        <p className="text-primary">拖放文件到这里 ...</p>
                      ) : (
                        <p>
                          <span className="text-primary">点击上传</span> 或拖放文件到这里
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">支持 JPG, PNG, GIF, WEBP 格式图片</p>
                  </div>
                </div>
              </div>

              {/* 预览区域增强 */}
              {nftFiles.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-lg">已选择的文件 ({nftFiles.length})</label>
                    <button
                      className={`btn btn-secondary ${isUploading ? "loading" : ""}`}
                      onClick={handleUploadFiles}
                      disabled={isUploading || nftFiles.every(f => f.ipfsHash)}
                    >
                      {isUploading ? "上传中..." : "上传到IPFS"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {nftFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={file.previewUrl}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg">
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-sm text-center mt-1">
                          <p>{file.file.name}</p>
                          {file.ipfsHash && (
                            <p className="text-green-500">已上传到IPFS</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 添加属性设置部分 */}
              <div className="w-full max-w-3xl border border-gray-300 p-6 rounded-xl shadow-lg mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">数藏 属性设置</h2>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={addAttribute}
                  >
                    添加属性
                  </button>
                </div>

                <div className="space-y-4">
                  {attributes.map((attr, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="form-control flex-1">
                        <label className="label">
                          <span className="label-text">属性名称</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={attr.trait_type}
                          onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                          placeholder="例如: 背景"
                        />
                      </div>

                      <div className="form-control flex-1">
                        <label className="label">
                          <span className="label-text">属性值</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                          placeholder="例如: 蓝色"
                        />
                      </div>

                      <button
                        className="btn btn-square btn-error btn-sm mt-9"
                        onClick={() => removeAttribute(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 创建按钮 */}
              <div className="flex justify-center">
                {!isConnected || isConnecting ? (
                  <RainbowKitCustomConnectButton />
                ) : (
                  <button
                    className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                    onClick={handleCreateMysteryBox}
                    disabled={isLoading}
                  >
                    {isLoading ? "创建中..." : "创建盲盒"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* 底部装饰 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center text-base-content/50"
          >
            <div className="flex justify-center gap-4 mb-4">
              {["🎲", "🎮", "🎯", "🎨", "🎭"].map((emoji, index) => (
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
            <p className="text-sm">创造独特的 数藏 盲盒体验</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MysteryBoxPage;