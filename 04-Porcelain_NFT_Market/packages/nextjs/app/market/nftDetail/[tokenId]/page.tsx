"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";
import { format } from "date-fns";
import { formatEther, parseEther } from "viem";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { getMetadataFromIPFS, collectNFT, reportNFT, /*saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";
import { usePublicClient } from "wagmi";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, ContactShadows, useGLTF } from "@react-three/drei";

// 创建3D模型组件
function GLBModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return (
    <group>
      <primitive 
        object={scene} 
        scale={2} 
        position={[0, -1, 0]} 
        rotation={[0, 5, 0]}
      />
    </group>
  );
}

// 创建3D查看器组件
function ModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <Canvas
      camera={{ 
        position: [0, 0, 5],
        fov: 50,
        near: 0.1,
        far: 1000
      }}
      style={{ width: "100%", height: "500px" }}
    >
      <OrbitControls
        enablePan={true} // 允许平移
        enableZoom={true} // 允许缩放
        enableRotate={true} // 允许旋转
        minDistance={2} // 最小缩放距离
        maxDistance={10} // 最大缩放距离
        autoRotate={false} // 禁用自动旋转
        makeDefault
      />
      <Float
        rotationIntensity={0.2}
        floatIntensity={0.2}
        speed={1}
      >
        <GLBModel modelUrl={modelUrl} />
      </Float>

      <ContactShadows
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
        resolution={256}
        color="#000000"
        position={[0, -2, 0]}
      />

      {/* 环境光照 */}
      <ambientLight intensity={1.5} />
      
      {/* 主光源 - 调整以更好地照亮正面 */}
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} castShadow />
      <directionalLight position={[0, 5, 0]} intensity={1} castShadow /> // 添加顶部光源
      
      {/* 补光 - 调整以提供更好的环境光照 */}
      <pointLight position={[5, 0, 5]} intensity={0.4} color="#ffd93d" />
      <pointLight position={[-5, 0, -5]} intensity={0.4} color="#ffd93d" />
      <pointLight position={[0, 0, 5]} intensity={0.4} color="#ff6b6b" />
      <pointLight position={[0, 0, -5]} intensity={0.4} color="#ff6b6b" />

      {/* 环境氛围光 */}
      <hemisphereLight
        intensity={0.5}
        color="#ffffff"
        groundColor="#666666"
      />
    </Canvas>
  );
}

const NFTDetailPage = ({ params }: { params: { tokenId: string } }) => {
    const { tokenId } = params;
    const router = useRouter();
    const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
    const publicClient = usePublicClient();
    const [nftMetadata, setNftMetadata] = useState<NFTMetaData | null>(null);
    const { address: connectedAddress } = useAccount();
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isFractionalizeModalOpen, setIsFractionalizeModalOpen] = useState(false);
    const [listingPrice, setListingPrice] = useState("");
    const [fractionCount, setFractionCount] = useState("");
    const [isCollected, setIsCollected] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [fileType, setFileType] = useState<string | null>(null);

    // 根据tokenId获取NFT合约存储的数据：tokenId, price, owner, isListed, tokenUri
    const { data: nftData, isLoading, error } = useScaffoldReadContract({
        contractName: "YourCollectible",
        functionName: "getNFTItemByTokenId",
        args: [BigInt(tokenId)],
    });

    // 检查NFT是否被碎片化
    const { data: isFractionalized } = useScaffoldReadContract({
        contractName: "YourCollectible",
        functionName: "isNFTFractionalized",
        args: [BigInt(tokenId)],
    });

    useEffect(() => {
        if (nftData?.tokenUri) {
            getMetadataFromIPFS(nftData.tokenUri).then((data) => {
                setNftMetadata(data);
            }).catch((err) => {
                console.error("Error fetching NFT metadata:", err);
                setNftMetadata(null);
            });
        }
    }, [nftData]);

    // 检查文件类型
    useEffect(() => {
        const fetchFileType = async () => {
            if (nftMetadata?.image) {
                try {
                    const response = await fetch(nftMetadata.image, { method: "HEAD" });
                    const contentType = response.headers.get("Content-Type");
                    setFileType(contentType);
                } catch (error) {
                    console.error("无法获取文件类型", error);
                }
            }
        };
        fetchFileType();
    }, [nftMetadata?.image]);

    // 购买NFT函数
    const handleBuyNFT = async (tokenId: number, price: number) => {
        const notificationId = notification.loading("Purchasing NFT...");
        const formattedPrice = BigInt(price);

        try {
            const tx = await writeContractAsync({
                functionName: "buyItem",
                args: [BigInt(tokenId)],
                value: formattedPrice,
            });

            // 等待交易被确认
            const receipt = await publicClient?.waitForTransactionReceipt({ 
                hash: tx as `0x${string}` 
            });

            // 保存gas记录
             // await saveGasRecord({
             //     tx_hash: receipt?.transactionHash as string,
             //     method_name: 'buyItem',
             //     gas_used: receipt?.gasUsed,
             //     gas_price: receipt?.effectiveGasPrice,
             //     total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
             //     user_address: connectedAddress as string,
             //     block_number: receipt?.blockNumber
             // });

            notification.success("NFT purchased successfully!");
        } catch (error) {
            notification.error("Failed to purchase NFT.");
            console.error(error);
        } finally {
            notification.remove(notificationId);
        }
    };

    // 下架NFT函数
    const handleDelistItem = async () => {
        try {
            const notificationId = notification.loading("正在下架...");
            const tx = await writeContractAsync({
                functionName: "delistItem",
                args: [BigInt(tokenId)],
            });

            // 等待交易被确认获取回执
            const receipt = await publicClient?.waitForTransactionReceipt({ 
                hash: tx as `0x${string}` 
            });

            // 保存gas记录
             // await saveGasRecord({
             //     tx_hash: receipt?.transactionHash,
             //     method_name: 'delistItem',
             //     gas_used: receipt?.gasUsed,
             //     gas_price: receipt?.effectiveGasPrice,
             //     total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
             //     user_address: connectedAddress as string,
             //     block_number: receipt?.blockNumber
             // });

            notification.remove(notificationId);
            notification.success("下架成功！");
        } catch (error) {
            notification.error("下架失败！");
            console.error(error);
        }
    };

    // 历史记录事件
    const { data: buyEvents } = useScaffoldEventHistory({
        contractName: "YourCollectible",
        eventName: "NftBought",
        // Specify the starting block number from which to read events, this is a bigint.
        fromBlock: 0n,
        filters: { tokenId: BigInt(tokenId) },
        blockData: true, // 获取区块数据以获取时间戳
        watch: true, // 轮询
    });

    // 添加画体
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
        },
    };

    // 添加上架处理函数
    const handleListNFT = async () => {
        if (!listingPrice || isNaN(Number(listingPrice)) || Number(listingPrice) <= 0) {
            notification.error("请输入有效的价格");
            return;
        }

        const priceWei = parseEther(listingPrice);
        const listingFee = parseEther("0.025"); // 0.025 ETH 手续费

        try {
            const tx = await writeContractAsync({
                functionName: "listItem",
                args: [BigInt(tokenId), priceWei],
                value: listingFee,
            });

            // 等待交易被确认并获取回执
            const receipt = await publicClient?.waitForTransactionReceipt({ 
                hash: tx as `0x${string}` 
            });

            // 保存gas记录
             // await saveGasRecord({
             //     tx_hash: receipt?.transactionHash,
             //     method_name: 'listItem',
             //     gas_used: receipt?.gasUsed,
             //     gas_price: receipt?.effectiveGasPrice,
             //     total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
             //     user_address: connectedAddress as string,
             //     block_number: receipt?.blockNumber
             // });

            notification.success("NFT上架成功！");
            setIsListModalOpen(false);
        } catch (error) {
            notification.error("上架失败！");
            console.error(error);
        }
    };

    // 添加碎片化处理函数
    const handleFractionalize = async () => {
        if (!fractionCount || isNaN(Number(fractionCount)) || Number(fractionCount) <= 0) {
            notification.error("请输入有效的碎片数量");
            return;
        }

        try {
            const tx = await writeContractAsync({
                functionName: "fractionalizeNFT",
                args: [BigInt(tokenId), BigInt(fractionCount)],
            });

            // 等待交易被确认并获取回执
            const receipt = await publicClient?.waitForTransactionReceipt({ 
                hash: tx as `0x${string}` 
            });

            // 保存gas记录
             // await saveGasRecord({
             //     tx_hash: receipt?.transactionHash,
             //     method_name: 'fractionalizeNFT',
             //     gas_used: receipt?.gasUsed,
             //     gas_price: receipt?.effectiveGasPrice,
             //     total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
             //     user_address: connectedAddress as string,
             //     block_number: receipt?.blockNumber
             // });

            notification.success("NFT碎片化成功！");
            setIsFractionalizeModalOpen(false);
        } catch (error) {
            notification.error("碎片化失败！");
            console.error(error);
        }
    };

    // 修改收藏处理函数
    const handleCollect = async () => {
        if (!connectedAddress) {
            notification.error("请先连接钱包");
            return;
        }

        try {
            const response = await collectNFT({
                nft_id: tokenId,
                user_address: connectedAddress,
                collected_at: new Date().toISOString()
            });

            if (response.success) {
                setIsCollected(!isCollected);
                notification.success(isCollected ? "取消收藏成功" : "收藏成功");
            } else {
                notification.error(response.error || "操作失败");
            }
        } catch (error) {
            console.error("收藏操作失败:", error);
            notification.error("操作失败");
        }
    };

    // 修改举报处理函数
    const handleReport = async () => {
        if (!connectedAddress) {
            notification.error("请先连接钱包");
            return;
        }

        try {
            const response = await reportNFT({
                nft_id: tokenId,
                reporter_address: connectedAddress,
                reason: reportReason,
                reported_at: new Date().toISOString()
            });

            if (response.success) {
                notification.success("举报成功");
                setIsReportModalOpen(false);
                setReportReason("");
            } else {
                notification.error(response.error || "举报失败");
            }
        } catch (error) {
            console.error("举报失败:", error);
            notification.error("举报失败");
        }
    };

    if (isLoading)
        return (
            <div className="flex justify-center items-center mt-10">
                <span className="loading loading-spinner loading-xl">正在加载中.......</span>
            </div>
        );

    if (error)
        return (
            <div className="text-red-500 text-center mt-10">
                出错了......
            </div>
        )

    return (
        <div className="min-h-screen bg-gradient-to-b from-base-300 to-base-100 relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 -top-48 -left-48 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-secondary/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto pt-10 pb-20 px-6 relative z-10">
                <motion.button
                    className="btn btn-primary btn-sm mb-8"
                    onClick={() => router.back()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    返回
                </motion.button>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12"
                >
                    {/* NFT 详情卡片 */}
                    <motion.div variants={itemVariants} className="bg-base-100/70 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                            {/* 图片部分 */}
                            <div className="relative group">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl"
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
                                <motion.div
                                    className="relative rounded-2xl overflow-hidden"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {fileType && fileType.includes("model/gltf-binary") ? (
                                        // 3D模型展示
                                        <div className="aspect-square">
                                            <ModelViewer modelUrl={nftMetadata?.image || ""} />
                                        </div>
                                    ) : (
                                        // 普通图片展示
                                        <div className="aspect-square">
                                            <img
                                                src={nftMetadata?.image}
                                                alt={nftMetadata?.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* 详细信息部分 */}
                            <div className="flex flex-col justify-between">
                                <div className="space-y-6">
                                    <motion.div variants={itemVariants}>
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                            {nftMetadata?.name ?? "Loading..."}
                                        </h1>
                                        <p className="text-base-content/70 mt-2">
                                            {nftMetadata?.description}
                                        </p>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                                        <div className="stat bg-base-200/50 rounded-xl">
                                            <div className="stat-title">Token ID</div>
                                            <div className="stat-value text-primary">{tokenId}</div>
                                        </div>
                                        <div className="stat bg-base-200/50 rounded-xl">
                                            <div className="stat-title">价格</div>
                                            <div className="stat-value text-secondary">
                                                {formatEther(nftData?.price ?? 0n)} ETH
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <h3 className="text-lg font-semibold mb-3">拥有者</h3>
                                        {isFractionalized ? (
                                            <div className="text-warning">该数藏已被碎片化，无法查看拥有者</div>
                                        ) : (
                                            <Address address={nftData?.owner} />
                                        )}
                                    </motion.div>

                                    {/* 属性展示 */}
                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <h3 className="text-lg font-semibold">属性</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {nftMetadata?.attributes?.map((attribute, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="bg-base-200/50 rounded-xl p-4 hover:bg-base-200 transition-colors"
                                                    whileHover={{ scale: 1.02 }}
                                                >
                                                    <div className="text-sm text-base-content/70">{attribute.trait_type}</div>
                                                    <div className="font-semibold">{attribute.value}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* 操作按钮 */}
                                <motion.div variants={itemVariants} className="flex gap-4 mt-6">
                                    {nftData?.isListed ? (
                                        <>
                                            <motion.button
                                                className="btn btn-primary flex-1"
                                                onClick={() => handleBuyNFT(Number(tokenId), Number(nftData?.price))}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                disabled={nftData?.owner === connectedAddress}
                                            >
                                                {nftData?.owner === connectedAddress ? "这是你的数藏" : "购买数藏"}
                                            </motion.button>
                                            {nftData?.owner === connectedAddress && (
                                                <motion.button
                                                    className="btn btn-error flex-1"
                                                    onClick={handleDelistItem}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    下架
                                                </motion.button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {nftData?.owner === connectedAddress && !nftData?.isListed && (
                                                <div className="flex gap-4 w-full">
                                                    {!isFractionalized && (
                                                        <motion.button
                                                            className="btn btn-primary flex-1"
                                                            onClick={() => setIsListModalOpen(true)}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            上架出售
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        className="btn btn-secondary flex-1"
                                                        onClick={() => setIsFractionalizeModalOpen(true)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        disabled={isFractionalized}
                                                    >
                                                        {isFractionalized ? "已碎片化" : "碎片化"}
                                                    </motion.button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <motion.button
                                        className={`btn ${isCollected ? 'btn-secondary' : 'btn-outline'}`}
                                        onClick={handleCollect}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {isCollected ? '取消收藏' : '收藏'}
                                    </motion.button>
                                    <motion.button
                                        className="btn btn-outline btn-error"
                                        onClick={() => setIsReportModalOpen(true)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        举报
                                    </motion.button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 交易历史 */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-base-100/70 backdrop-blur-md rounded-3xl shadow-xl p-8"
                    >
                        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            交易历史
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Token ID</th>
                                        <th>卖家</th>
                                        <th>买家</th>
                                        <th>价格 (ETH)</th>
                                        <th>时间</th>
                                        <th>版税收取人</th>
                                        <th>版税 (ETH)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {buyEvents?.map((event, index) => {
                                            const priceInEth = formatEther(event.args.price ?? 0n);
                                            const timestamp = event.block?.timestamp
                                                ? format(new Date(Number(event.block.timestamp) * 1000), "yyyy-MM-dd HH:mm:ss")
                                                : "N/A";
                                            const royaltyAmountInEth = formatEther(event.args.royaltyAmount ?? 0n);

                                            return (
                                                <motion.tr
                                                    key={index}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="hover:bg-base-200/50"
                                                >
                                                    <td>{event.args.tokenId?.toString()}</td>
                                                    <td><Address address={event.args.seller as `0x${string}` | undefined} /></td>
                                                    <td><Address address={event.args.buyer as `0x${string}` | undefined} /></td>
                                                    <td>{priceInEth}</td>
                                                    <td>{timestamp}</td>
                                                    <td><Address address={event.args.royaltyReceiver as `0x${string}` | undefined} /></td>
                                                    <td>{royaltyAmountInEth}</td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* 上架弹窗 */}
            <dialog className={`modal ${isListModalOpen ? "modal-open" : ""}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">上架数藏</h3>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">设置价格 (ETH)</span>
                        </label>
                        <input
                            type="number"
                            step="0.001"
                            value={listingPrice}
                            onChange={(e) => setListingPrice(e.target.value)}
                            placeholder="输入价格"
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div className="modal-action">
                        <button className="btn" onClick={() => setIsListModalOpen(false)}>
                            取消
                        </button>
                        <button className="btn btn-primary" onClick={handleListNFT}>
                            确认上架
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsListModalOpen(false)}>关闭</button>
                </form>
            </dialog>

            {/* 碎片化弹窗 */}
            <dialog className={`modal ${isFractionalizeModalOpen ? "modal-open" : ""}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">碎片化数藏</h3>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">设置碎片数量</span>
                        </label>
                        <input
                            type="number"
                            min="2"
                            step="1"
                            value={fractionCount}
                            onChange={(e) => setFractionCount(e.target.value)}
                            placeholder="输入碎片数量"
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div className="modal-action">
                        <button className="btn" onClick={() => setIsFractionalizeModalOpen(false)}>
                            取消
                        </button>
                        <button className="btn btn-primary" onClick={handleFractionalize}>
                            确认碎片化
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsFractionalizeModalOpen(false)}>关闭</button>
                </form>
            </dialog>

            {/* 举报弹窗 */}
            <dialog className={`modal ${isReportModalOpen ? "modal-open" : ""}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">举报 数藏</h3>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">举报原因</span>
                        </label>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="请输入举报原因"
                            className="textarea textarea-bordered h-24"
                        />
                    </div>
                    <div className="modal-action">
                        <button className="btn" onClick={() => setIsReportModalOpen(false)}>
                            取消
                        </button>
                        <button className="btn btn-error" onClick={handleReport}>
                            确认举报
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsReportModalOpen(false)}>关闭</button>
                </form>
            </dialog>
        </div>
    );
};

export default NFTDetailPage;