"use client";

import { useEffect, useState, Suspense } from "react";
import type { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useCrossChainNFTs, CrossChainNFT } from "~~/hooks/scaffold-eth/usecrosschainnfts";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS, /*saveGasRecord*/ } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, ContactShadows, useGLTF } from "@react-three/drei";

// GLB模型组件
function GLBModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return (
    <group>
      <primitive 
        object={scene} 
        scale={1.5} 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

// 3D模型查看器组件
function ModelViewer({ modelUrl }: { modelUrl: string }) {
  const [hovering, setHovering] = useState(false);
  
  if (!modelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-base-200">
        <p className="text-base-content/70">无效的3D模型</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full relative" 
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {hovering && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded-md z-10 backdrop-blur-sm pointer-events-none">
          <p>👆 拖动: 旋转模型</p>
          <p>🖱️ 滚轮: 放大/缩小</p>
          <p>👉 右键拖动: 平移视图</p>
        </div>
      )}
      <Canvas
        camera={{ 
          position: [0, 0, 3],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
          autoRotate={!hovering}
          autoRotateSpeed={1.5}
          rotateSpeed={1.2}
          zoomSpeed={1.2}
          panSpeed={1.2}
          makeDefault
        />
        <Float
          rotationIntensity={0.2}
          floatIntensity={0.2}
          speed={1}
        >
          <Suspense fallback={
            <mesh>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="gray" wireframe />
            </mesh>
          }>
            <GLBModel modelUrl={modelUrl} />
          </Suspense>
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
        
        {/* 主光源 */}
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.8} castShadow />
        <directionalLight position={[0, 5, 0]} intensity={1} castShadow />
        
        {/* 补光 */}
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
    </div>
  );
}

const ListNFTsPage: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [nftDetails, setNftDetails] = useState<Record<number, NFTMetaData | null>>({});
  const router = useRouter();
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: Infinity });
  const [filteredNFTs, setFilteredNFTs] = useState<CrossChainNFT[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(10); // 初始最大价格
  const [traits, setTraits] = useState<Record<string, Set<string>>>({});
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 3;
  const publicClient = usePublicClient();
  const [fileTypes, setFileTypes] = useState<Record<number, string | null>>({});

  // 使用跨链NFT hook
  const { nfts: crossChainNFTs, loading: crossChainLoading, error: crossChainError, refetch } = useCrossChainNFTs();

  // 获取所有上架的 NFT (保留原有逻辑作为备用)
  const { data: onSaleNfts } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAllListedItems",
    watch: true,
  });
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 初始化跨链NFT数据和最大价格
  useEffect(() => {
    if (crossChainNFTs && crossChainNFTs.length > 0) {
      // 获取每个NFT的详细信息
      crossChainNFTs.forEach((nft) => {
        if (nft.tokenUri) {
          fetchNFTDetails(nft.tokenUri, Number(nft.tokenId));
        }
      });

      // 计算最大价格
      const prices = crossChainNFTs.map((nft) => Number(formatEther(nft.price)));
      const maxPrice = Math.max(...prices, 10); // 至少为10，避免0的情况
      setMaxPrice(maxPrice);
    }
  }, [crossChainNFTs]);

  // 根据价格和属性筛选跨链NFT
  useEffect(() => {
    if (!crossChainNFTs) {
      setFilteredNFTs([]);
      return;
    }

    const filtered = crossChainNFTs.filter((nft) => {
      const priceETH = Number(formatEther(nft.price));

      // 筛选符合价格范围和选择属性的 NFT
      const matchesTraits = Object.entries(selectedTraits).every(([traitType, value]) => {
        const metadata = nftDetails[Number(nft.tokenId)];
        if (!metadata?.attributes) return false;
        return metadata.attributes.some(attr => attr.trait_type === traitType && attr.value === value);
      });

      return priceETH >= priceRange.min && priceETH <= priceRange.max && matchesTraits;
    });
    setFilteredNFTs(filtered);
  }, [crossChainNFTs, priceRange, selectedTraits, nftDetails]);

  // 获取 NFT 详细信息的函数
  const fetchNFTDetails = async (tokenUri: string, tokenId: number) => {
    try {
      const metadata = await getMetadataFromIPFS(tokenUri); // 通过 IPFS 获取 NFT 元数据
      setNftDetails((prevDetails) => ({
        ...prevDetails,
        [tokenId]: metadata,
      }));

      // 检查文件类型
      if (metadata?.image) {
        try {
          const response = await fetch(metadata.image, { method: "HEAD" });
          const contentType = response.headers.get("Content-Type");
          setFileTypes(prev => ({ ...prev, [tokenId]: contentType }));
        } catch (error) {
          console.error(`无法获取文件类型: ${metadata.image}`, error);
          // 如果HEAD请求失败，尝试通过文件扩展名判断
          if (metadata.image.endsWith('.glb')) {
            setFileTypes(prev => ({ ...prev, [tokenId]: "model/gltf-binary" }));
          }
        }
      }

      // 动态提取属性
      metadata?.attributes?.forEach((attr: { trait_type: string; value: string | number }) => {
        setTraits(prev => {
          const newTraits = { ...prev };
          if (!newTraits[attr.trait_type]) {
            newTraits[attr.trait_type] = new Set();
          }
          newTraits[attr.trait_type].add(String(attr.value));
          return newTraits;
        });
      });
    } catch (error) {
      console.error(`Failed to fetch metadata for token ${tokenId}`, error);
      setNftDetails((prevDetails) => ({
        ...prevDetails,
        [tokenId]: null,
      }));
    }
  };

  // 更新选择的属性
  const handleTraitChange = (traitType: string, value: string) => {
    setSelectedTraits(prev => ({
      ...prev,
      [traitType]: value,
    }));
  };

  // 跨链购买NFT处理函数
  const handleBuyNFT = async (nft: CrossChainNFT) => {
    if (!isConnected) {
      notification.error("请先连接钱包");
      return;
    }

    const notificationId = notification.loading("检查网络连接...");

    try {
      // 获取当前连接的链ID
      const currentChainId = await publicClient?.getChainId();
      const nftChainId = nft.chainId;
      
      console.log("Current chain:", currentChainId, "NFT chain:", nftChainId);

      // 检查是否为跨链购买
      if (currentChainId !== nftChainId) {
        notification.remove(notificationId);
        
        // 跨链购买流程
        notification.info(
          `正在从 ${nftChainId === 1287 ? 'Moonbase Alpha' : 'Polkadot Hub'} 购买NFT到当前链`,
          { duration: 5000 }
        );

        // 调用跨链购买合约
        await handleCrossChainPurchase(nft, currentChainId);
      } else {
        notification.remove(notificationId);
        
        // 同链购买流程
        notification.info("正在处理同链购买...", { duration: 3000 });
        await handleSameChainPurchase(nft);
      }
    } catch (error: any) {
      notification.remove(notificationId);
      console.error("购买NFT失败:", error);
      
      if (error.message?.includes("User rejected")) {
        notification.error("用户取消了交易");
      } else if (error.message?.includes("insufficient funds")) {
        notification.error("余额不足，请检查您的账户余额");
      } else if (error.message?.includes("NFT is not listed")) {
        notification.error(
          "NFT未上架或已被购买。请刷新页面查看最新状态。",
          { duration: 5000 }
        );
      } else {
        notification.error(`购买失败: ${error?.message || "未知错误"}`);
      }
    }
  };

  // 处理跨链购买
  const handleCrossChainPurchase = async (nft: CrossChainNFT, destinationChainId: number) => {
    try {
      console.log("NFT 完整数据:", nft);
      console.log("NFT 源链 ID:", nft.chainId);
      console.log("当前链 ID:", await publicClient?.getChainId());
      console.log("目标链 ID:", destinationChainId);

      // 跨链购买需要在源链上执行，而不是目标链
      const sourceChainId = nft.chainId; // NFT 所在的链
      const currentChainId = await publicClient?.getChainId();
      
      // 确保我们在源链上执行跨链购买
      if (currentChainId !== sourceChainId) {
        throw new Error(`请切换到源链 (Chain ID: ${sourceChainId}) 来执行跨链购买`);
      }

      // 根据源链选择正确的 CrossChainMarketplace 合约地址
      const contractAddresses: Record<number, string> = {
        1287: "0x62CF8Ed114C18f8aD4774a49F4a754a77Fa6a2cD", // Moonbase Alpha CrossChainMarketplace
        420420422: "0xA594a3FF1448af756D4814a48F07EBc06FD76861" // Polkadot Hub Testnet CrossChainMarketplace
      };
      
      const contractAddress = contractAddresses[sourceChainId];
      
      if (!contractAddress) {
        throw new Error("不支持的源链");
      }

      // 在当前链（源链）上查询 NFTListed 事件来找到正确的 listingId
      let correctListingId = null;
       
      try {
        // 获取当前区块号
        const currentBlock = await publicClient!.getBlockNumber();
        
        // 分批查询以避免区块范围过大的错误
        const batchSize = 500n; // 每批查询 500 个区块
        const maxBatches = 20; // 总共 10000 个区块
        let foundListing = false;
        
        for (let i = 0; i < maxBatches && !foundListing; i++) {
          const fromBlock = currentBlock - BigInt(i + 1) * batchSize;
          const toBlock = currentBlock - BigInt(i) * batchSize;
          
          console.log(`查询区块范围: ${fromBlock} - ${toBlock}`);
          
          try {
            // 查询 CrossChainMarketplace 的 NFTListed 事件
            const logs = await publicClient!.getLogs({
              address: contractAddress as `0x${string}`,
              event: {
                   type: 'event',
                   name: 'NFTListed',
                   inputs: [
                     { name: 'listingId', type: 'bytes32', indexed: true },
                     { name: 'seller', type: 'address', indexed: true },
                     { name: 'nftContract', type: 'address', indexed: true },
                     { name: 'tokenId', type: 'uint256', indexed: false },
                     { name: 'price', type: 'uint256', indexed: false },
                     { name: 'paymentToken', type: 'address', indexed: false },
                     { name: 'isCrossChain', type: 'bool', indexed: false }
                   ]
                 },
              fromBlock: fromBlock,
              toBlock: toBlock
            });

            console.log(`批次 ${i + 1} 找到的 NFTListed 事件:`, logs);
            
            // 查找匹配的 tokenId 的跨链 listing
            const matchingLog = logs.find(log => {
              const args = log.args as any;
              return args.tokenId?.toString() === nft.tokenId.toString() && args.isCrossChain === true;
            });

            if (matchingLog) {
              // 从事件中获取 listingId
              const listingIdFromEvent = matchingLog.topics[1]; // 第一个索引参数是 listingId
              correctListingId = listingIdFromEvent;
              console.log("找到匹配的跨链 listing，listingId:", correctListingId);
              foundListing = true;
              
              // 验证 listing 状态
              try {
                const listingInfo = await publicClient!.readContract({
                  address: contractAddress as `0x${string}`,
                  abi: [
                    {
                      "inputs": [{"name": "listingId", "type": "bytes32"}],
                      "name": "getListing",
                      "outputs": [
                        {
                          "components": [
                            {"name": "seller", "type": "address"},
                            {"name": "nftContract", "type": "address"},
                            {"name": "tokenId", "type": "uint256"},
                            {"name": "price", "type": "uint256"},
                            {"name": "paymentToken", "type": "address"},
                            {"name": "sourceChainId", "type": "uint32"},
                            {"name": "isActive", "type": "bool"},
                            {"name": "isCrossChain", "type": "bool"},
                            {"name": "timestamp", "type": "uint256"}
                          ],
                          "internalType": "struct CrossChainMarketplace.Listing",
                          "name": "",
                          "type": "tuple"
                        }
                      ],
                      "stateMutability": "view",
                      "type": "function"
                    }
                  ],
                  functionName: 'getListing',
                  args: [correctListingId as `0x${string}`]
                });

                console.log("Listing 信息:", listingInfo);
                
                if (listingInfo) {
                  const listing = listingInfo as any;
                  if (!listing.isActive) {
                    throw new Error(`ListingId ${correctListingId} 未激活`);
                  }
                  if (!listing.isCrossChain) {
                    throw new Error(`ListingId ${correctListingId} 不是跨链 listing`);
                  }
                }
              } catch (verifyError) {
                console.warn("验证 listing 状态失败:", verifyError);
                // 继续执行，不阻止购买流程
              }
              break; // 找到了，退出循环
            }
          } catch (batchError) {
            console.warn(`批次 ${i + 1} 查询失败:`, batchError);
            // 继续下一批查询
          }
        }
        
        if (!foundListing) {
          throw new Error(`未找到 tokenId ${nft.tokenId} 的跨链 listing，已搜索 ${maxBatches * 500} 个区块`);
        }
      } catch (eventError) {
        console.error("查询事件失败:", eventError);
        throw eventError;
      }

      if (!correctListingId) {
        throw new Error("无法找到有效的跨链 listing ID");
      }

      const purchaseNotificationId = notification.loading("正在发起跨链购买...");

      // 在源链上发送跨链购买交易
      const tx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"name": "listingId", "type": "bytes32"},
              {"name": "destinationChainId", "type": "uint32"}
            ],
            "name": "initiateCrossChainPurchase",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        functionName: "initiateCrossChainPurchase",
        args: [correctListingId as `0x${string}`, BigInt(destinationChainId)],
        value: parseEther(nft.price.toString()),
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: tx as `0x${string}` 
        });
        
        notification.remove(purchaseNotificationId);
        
        if (receipt.status === "success") {
          notification.success(
            "跨链购买成功！NFT 已通过 XCM 协议锁定，将在几分钟内转移到您的目标链账户",
            {
              duration: 8000,
            }
          );
          
          // 刷新NFT列表
          refetch();
        } else {
          throw new Error("交易失败");
        }
      }
      
    } catch (error: any) {
      console.error("跨链购买失败:", error);
      notification.error(`跨链购买失败: ${error.message}`);
    }
  };

  // 处理同链购买
  const handleSameChainPurchase = async (nft: CrossChainNFT) => {
    try {
      const purchaseNotificationId = notification.loading("正在购买NFT...");

      const tx = await writeContractAsync({
        functionName: "buyItem",
        args: [nft.tokenId],
        value: nft.price,
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: tx as `0x${string}` 
        });
        
        notification.remove(purchaseNotificationId);
        
        if (receipt.status === "success") {
          notification.success("NFT购买成功！");
          
          // 刷新NFT列表
          refetch();
        } else {
          throw new Error("交易失败");
        }
      }
      
    } catch (error: any) {
      console.error("同链购买失败:", error);
      throw error;
    }
  };

  // 原有的购买函数（保留作为备用）
  const handleBuyNFTLegacy = async (tokenId: number, price: number) => {
    const notificationId = notification.loading("Purchasing NFT...");
    const formattedPrice = BigInt(price);

    try {
      const tx = await writeContractAsync({
        functionName: "buyItem",
        args: [BigInt(tokenId)],
        value: formattedPrice,
      });

      // 等待交易被确认并获取回执
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: tx as `0x${string}` 
        });

        // 保存gas记录
         // await saveGasRecord({
         //   tx_hash: receipt?.transactionHash,
         //   method_name: 'buyItem',
         //   gas_used: receipt?.gasUsed,
         //   gas_price: receipt?.effectiveGasPrice,
         //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
         //   user_address: connectedAddress as string,
         //   block_number: receipt?.blockNumber
         // });
      }

      notification.success("NFT purchased successfully!");
    } catch (error) {
      notification.error("Failed to purchase NFT.");
      console.error(error);
    } finally {
      notification.remove(notificationId);
    }
  };

  // 跳转到详情页
  const handleViewNFTDetails = (tokenId: number) => {
    router.push(`/market/nftDetail/${tokenId}`);
  };

  // 计算当前页的NFT
  const indexOfLastNFT = currentPage * itemsPerPage;
  const indexOfFirstNFT = indexOfLastNFT - itemsPerPage;
  const currentNFTs = filteredNFTs.slice(indexOfFirstNFT, indexOfLastNFT);

  // 处理页码更改
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 增强粒子动画配置
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  // 添加浮动图标配置
  const floatingIcons = [
    { icon: "🛍️", delay: 0 },
    { icon: "💎", delay: 1 },
    { icon: "🎨", delay: 2 },
    { icon: "✨", delay: 3 },
    { icon: "🌟", delay: 4 },
  ];

  // 卡片动画配置
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* 渐变光晕背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] -top-48 -left-48 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute w-[500px] h-[500px] -bottom-48 -right-48 bg-secondary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent/10 rounded-full blur-[100px] animate-pulse" />
      </div>

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

      <div className="flex flex-col items-center pt-10 px-6 relative z-10">
        {/* 标题部分增强 */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12 relative"
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
          <h1 className="text-5xl font-bold mb-4 relative">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent 
              drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
              数藏 市场
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-base-content/80"
          >
            发现、收藏独特的数字艺术品
          </motion.p>
        </motion.div>

        {/* 跨链加载状态和错误处理 */}
        {crossChainLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-8 p-6 bg-base-200/50 backdrop-blur-sm rounded-3xl shadow-xl 
              border border-base-content/5 text-center"
          >
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-lg font-semibold">正在加载跨链NFT数据...</p>
            <p className="text-sm text-base-content/70 mt-2">从 Moonbase Alpha 和 Polkadot Hub 获取数据</p>
          </motion.div>
        )}

        {crossChainError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-8 p-6 bg-error/10 backdrop-blur-sm rounded-3xl shadow-xl 
              border border-error/20 text-center"
          >
            <div className="text-error text-4xl mb-4">⚠️</div>
            <p className="text-lg font-semibold text-error">跨链数据加载失败</p>
            <p className="text-sm text-base-content/70 mt-2">{crossChainError}</p>
            <button 
              className="btn btn-error btn-sm mt-4"
              onClick={() => refetch()}
            >
              重新加载
            </button>
          </motion.div>
        )}

        {/* 无NFT数据时的显示 */}
        {!crossChainLoading && !crossChainError && crossChainNFTs && crossChainNFTs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-8 p-6 bg-base-200/50 backdrop-blur-sm rounded-3xl shadow-xl 
              border border-base-content/5 text-center"
          >
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-lg font-semibold">暂无NFT数据</p>
            <p className="text-sm text-base-content/70 mt-2">请稍后再试或检查网络连接</p>
          </motion.div>
        )}

        {/* 筛选器区域增强 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-4xl mb-8 p-6 bg-base-200/50 backdrop-blur-sm rounded-3xl shadow-xl 
            border border-base-content/5 hover:shadow-2xl transition-all duration-300"
          whileHover={{ scale: 1.01 }}
        >
          {/* 价格筛选 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4">价格范围 (ETH)</h3>
            <Slider
              range
              min={0}
              max={maxPrice}
              defaultValue={[0, maxPrice]}
              onChange={(value: any) => {
                // 明确指定value类型为数组，避免类型错误
                if (Array.isArray(value)) {
                  setPriceRange({ min: value[0], max: value[1] });
                }
              }}
              className="mb-2"
            />
            <div className="flex justify-between mt-2 text-sm">
              <span>{priceRange.min} ETH</span>
              <span>{priceRange.max} ETH</span>
            </div>
          </div>

          {/* 属性筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(traits).map(traitType => (
              <motion.div
                key={traitType}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <label className="block mb-2 font-semibold">{traitType}</label>
                <select
                  className="select select-bordered w-full bg-base-100/50 backdrop-blur-sm"
                  onChange={(e) => handleTraitChange(traitType, e.target.value)}
                >
                  <option value="">全部</option>
                  {Array.from(traits[traitType]).map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* NFT 卡片列表增强 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
          <AnimatePresence>
            {currentNFTs.map((nft, index) => {
              const metadata = nftDetails[Number(nft.tokenId)];
              const priceETH = formatEther(nft.price);
              
              // 检查是否为GLB模型
              const isGLBModel = fileTypes[Number(nft.tokenId)] === "model/gltf-binary" || 
                (metadata?.image && metadata.image.endsWith('.glb'));

              return (
                <motion.div
                  key={`${nft.chainId}-${nft.tokenId}`}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  whileHover={{ scale: 1.02 }}
                  className="card bg-base-100/50 backdrop-blur-md shadow-xl border border-base-content/5
                    hover:shadow-2xl hover:bg-base-100/60 transition-all duration-300"
                >
                  <figure className="relative aspect-square overflow-hidden">
                    {/* 链标识徽章 */}
                    <div className="absolute top-2 left-2 z-20">
                      <span className={`badge text-xs font-bold px-2 py-1 ${
                        nft.chainId === 1287 
                          ? 'badge-primary bg-blue-500 text-white' 
                          : 'badge-secondary bg-purple-500 text-white'
                      }`}>
                        {nft.chainName}
                      </span>
                    </div>
                    
                    {isGLBModel ? (
                      // 3D模型展示
                      <div className="w-full h-full">
                        <ModelViewer modelUrl={metadata?.image || ""} />
                      </div>
                    ) : (
                      // 普通图片展示
                      <motion.img
                        src={metadata?.image || "/placeholder.png"}
                        alt={metadata?.name || "NFT Image"}
                        className="w-full h-full object-cover transform-gpu"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </figure>

                  <div className="card-body relative z-10">
                    <h2 className="card-title text-xl font-bold">
                      {metadata?.name || "未命名数藏"}
                      {isGLBModel && <span className="badge badge-primary ml-2">3D 模型</span>}
                      {/* 显示NFT所在链的标识 */}
                      <span className={`badge ml-2 ${nft.chainId === 1287 ? 'badge-info' : 'badge-warning'}`}>
                        {nft.chainId === 1287 ? "Moonbase Alpha" : "Polkadot Hub"}
                      </span>
                    </h2>
                    <p className="text-2xl font-semibold text-primary">
                      {Number(priceETH)} ETH
                    </p>

                    {/* 属性标签 */}
                    <div className="flex flex-wrap gap-2 my-2">
                      {metadata?.attributes?.slice(0, 3).map((attr, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium"
                        >
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>

                    <div className="card-actions justify-end mt-4">
                      {!isConnected || isConnecting ? (
                        <RainbowKitCustomConnectButton />
                      ) : (
                        <div className="space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-secondary"
                            onClick={() => handleViewNFTDetails(Number(nft.tokenId))}
                          >
                            查看详情
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-primary relative"
                            onClick={() => handleBuyNFT(nft)}
                          >
                            立即购买
                            {/* 显示NFT所在链的标识 */}
                            <span className="absolute -top-1 -right-1 bg-accent text-accent-content text-xs px-1 py-0.5 rounded-full">
                              {nft.chainId === 1287 ? "MBA" : "PHT"}
                            </span>
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 分页控件增强 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-8 space-x-2"
        >
          {Array.from({ length: Math.ceil(filteredNFTs.length / itemsPerPage) }, (_, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`btn ${currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </motion.button>
          ))}
        </motion.div>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center text-base-content/50"
        >
          <div className="flex justify-center gap-4 mb-4">
            {["🛍️", "💎", "🎨", "✨", "🌟"].map((emoji, index) => (
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
          <p className="text-sm">探索无限可能的 数藏 世界</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ListNFTsPage;
