import { useState, useEffect, useCallback } from "react";
import { Collectible } from "./MyHoldings";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { parseEther, formatEther } from "viem";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, ContactShadows, useGLTF } from "@react-three/drei";
import { /*saveGasRecord,*/ getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

// 创建3D模型组件
function GLBModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return (
    <group>
      <primitive 
        object={scene} 
        scale={2} 
        position={[0, 0, 0]} 
        rotation={[0, 5, 0]}
      />
    </group>
  );
}

// 创建3D查看器组件 - 优化性能
function ModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <Canvas
      camera={{ 
        position: [0, 0, 5],
        fov: 50,
        near: 0.1,
        far: 1000
      }}
      style={{ width: "100%", height: "240px" }}
      frameloop="demand" // 只在需要时渲染帧，减少CPU/GPU消耗
      dpr={[1, 1.5]} // 限制最大像素比，避免在高分辨率设备上过度渲染
    >
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={10}
        autoRotate={false}
        makeDefault
      />
      <GLBModel modelUrl={modelUrl} />

      {/* 简化光照系统 */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <hemisphereLight
        intensity={0.5}
        color="#ffffff"
        groundColor="#666666"
      />
    </Canvas>
  );
}

export const NFTCard = ({ nft, onNFTUpdate }: { nft: Collectible, onNFTUpdate: () => void }) => {
  const { address: connectedAddress } = useAccount();
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isListed, setIsListed] = useState(false);
  const [price, setPrice] = useState<string>(""); // 用于存储用户输入的价格
  const [loading, setLoading] = useState(false); // 控制上架按钮的加载状态
  const [isSecondHand, setIsSecondHand] = useState(false); // 检查是否二手交易
  const [royaltyAmount, setRoyaltyAmount] = useState<string>("0"); // 版税费用
  const [fractionCount, setFractionCount] = useState<string>(""); // 碎片化数量
  const [fileType, setFileType] = useState<string | null>(null); // 文件类型
  const [rentalPrice, setRentalPrice] = useState<string>(""); // 租赁价格
  const [expiryDate, setExpiryDate] = useState<string>(""); // 到期时间
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [rentalAddress, setRentalAddress] = useState("");
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isFractionalizeModalOpen, setIsFractionalizeModalOpen] = useState(false);

  const router = useRouter();

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { data: nftItem } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getNFTItemByTokenId",
    args: [BigInt(nft.id.toString())],
    watch: true,
  });

  const { data: mintedBy } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getMintedBy",
    args: [BigInt(nft.id.toString())],
  });

  const publicClient = usePublicClient();

  useEffect(() => {
    if (nftItem) {
      console.log("nftItem==============", nftItem);
      console.log("nft==============", nft)
      setIsListed(nftItem.isListed as boolean);
      setPrice(BigInt(nftItem.price).toString());
    } else {
      setIsListed(false);
      setPrice("");
    }

    // 检查是否是二手交易
    if (mintedBy && mintedBy !== nft.owner) {
      setIsSecondHand(true); // 如果铸造者与当前拥有者不同，则视为二手交易
    } else {
      setIsSecondHand(false);
    }
  }, [nftItem, mintedBy]);

  useEffect(() => {
    // 获取文件类型
    const fetchFileType = async () => {
      try {
        const response = await fetch(nft.image, { method: "HEAD" });
        const contentType = response.headers.get("Content-Type");
        console.log("contentType==============", contentType)
        setFileType(contentType);
      } catch (error) {
        console.error("无法获取文件类型", error);
      }
    };
    fetchFileType();
  }, [nft.image]);

  // 计算版税金额
  const calculateRoyalty = async (price: string) => {
    if (isSecondHand) {
      const priceWei = parseEther(price);
      console.log("tokenId:", nft.id)
      console.log("价格 wei:", priceWei)
      try {
        // 调用 yourCollectibleContract 合约的 royaltyInfo 方法来获取版税信息
        const royaltyInfoResult = await yourCollectibleContract?.read.royaltyInfo([BigInt(nft.id), priceWei]);

        if (royaltyInfoResult) {
          // 将 readonly 数组转换为普通数组，然后解构
          const [royaltyReceiver, royaltyAmount] = Array.from(royaltyInfoResult);

          console.log("royaltyReceiver:", royaltyReceiver);
          console.log("royaltyAmount:", royaltyAmount);

          setRoyaltyAmount(royaltyAmount.toString());
        }
      } catch (error) {
        console.error("获取版税信息失败:", error);
      }
    } else {
      setRoyaltyAmount("0");
    }
  };

  // 上架
  const handleListNFT = async () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      notification.error("Please enter a valid price");
      return;
    }

    const priceWei = parseEther(price);
    // 0.025 ETH 手续费，使用 parseEther 转换为 wei
    const listingFee = parseEther("0.025");

    try {
      setLoading(true);
      const tx = await writeContractAsync({
        functionName: "listItem",
        args: [BigInt(nft.id), priceWei],
        value: listingFee,
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt?.transactionHash,
      //   method_name: 'listItem',
      //   gas_used: receipt?.gasUsed,
      //   gas_price: receipt?.effectiveGasPrice,
      //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
      //   user_address: connectedAddress as string,
      //   block_number: receipt?.blockNumber
      // });

      notification.success("数藏上架成功!");
    } catch (error) {
      console.error(error);
      notification.error("上架失败");
    } finally {
      setLoading(false);
    }
  };

  // 下架
  const handleUnlistNFT = async () => {
    console.log("下架 数藏:", nft.id);
    try {
      await writeContractAsync({
        functionName: "delistItem",
        args: [BigInt(nft.id.toString())],
      });
    } catch (err) {
      console.error("调用 delistItem 方法时出错");
    }
  };

  // 碎片化
  const handleFractionalizeNFT = async () => {
    if (!fractionCount || isNaN(Number(fractionCount)) || Number(fractionCount) <= 0) {
      notification.error("请输入有效的碎片数量");
      return;
    }

    try {
      setLoading(true);
      const tx = await writeContractAsync({
        functionName: "fractionalizeNFT",
        args: [BigInt(nft.id), BigInt(fractionCount)],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt?.transactionHash,
      //   method_name: 'fractionalizeNFT',
      //   gas_used: receipt?.gasUsed,
      //   gas_price: receipt?.effectiveGasPrice,
      //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
      //   user_address: connectedAddress as string,
      //   block_number: receipt?.blockNumber
      // });

      notification.success("数藏 碎片化成功!");
      onNFTUpdate(); // 调用回调函数通知父组件更新
    } catch (error) {
      console.error(error);
      notification.error("碎片化失败");
    } finally {
      setLoading(false);
    }
  };

  // 跳转到详情页
  const handleViewNFTDetails = (tokenId: number) => {
    router.push(`/market/nftDetail/${tokenId}`);
  };

  // 设置租赁
  const handleSetRental = async () => {
    try {
      // 将选择的日期时间转换为时间戳（秒）
      const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
      const tx = await writeContractAsync({
        functionName: "setUser",
        args: [BigInt(nft.id), rentalAddress, BigInt(expiryTimestamp)],
      });

      // 等待交易被确认并获取回执
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: tx as `0x${string}` 
      });

      // 保存gas记录
      // await saveGasRecord({
      //   tx_hash: receipt?.transactionHash,
      //   method_name: 'setUser',
      //   gas_used: receipt?.gasUsed,
      //   gas_price: receipt?.effectiveGasPrice,
      //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
      //   user_address: connectedAddress as string,
      //   block_number: receipt?.blockNumber
      // });

      notification.success("数藏租赁设置成功!");

      // 调用回调函数刷新数据
      onNFTUpdate();
    } catch (error) {
      console.error("设置租赁失败:", error);
      notification.error("设置租赁失败");
    }
  };

  // 使用 useCallback 包装检查过期的逻辑
  const checkExpiry = useCallback(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (nft.rentExpiry && currentTime > nft.rentExpiry) {
      return true;
    }
    return false;
  }, [nft.rentExpiry]);

  // 修改 useEffect 中的租赁到期检查逻辑
  useEffect(() => {
    if (!nft.isRented || !nft.rentExpiry) {
      return;
    }

    const isExpired = checkExpiry();
    if (isExpired) {
      onNFTUpdate();
      return;
    }

    const timeUntilExpiry = (nft.rentExpiry * 1000) - Date.now();
    const timer = setTimeout(onNFTUpdate, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [nft.isRented, nft.rentExpiry, checkExpiry]); // 移除 onNFTUpdate 从依赖项

  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      {/* 租赁状态标签 */}
      {nft.isRented && nft.rentExpiry && (
        <div className="absolute top-2 right-2 z-10">
          {Math.floor(Date.now() / 1000) > nft.rentExpiry ? (
            null
          ) : (
            <div className="flex flex-col items-end gap-1">
              <div className="badge badge-secondary">
                租赁中 (到期时间: {new Date(nft.rentExpiry * 1000).toLocaleString()})
              </div>
              {nft.isRentedByMe ? (
                <div className="badge badge-secondary">
                  租赁自: <Address address={nft.owner as `0x${string}`} format="short" />
                </div>
              ) : (
                <div className="badge badge-secondary">
                  租赁者: <Address address={nft.rentedTo as `0x${string}`} format="short" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* NFT 图片/模型显示 */}
      <div className="relative">
        <div className="nft-image-container h-60 overflow-hidden">
          {fileType && fileType.includes("model/gltf-binary") ? (
            // 使用新的3D查看器组件
            <ModelViewer modelUrl={nft.image} />
          ) : nft.image ? (
            // 普通图片
            <img
              src={nft.image}
              alt={`NFT-${nft.id}`}
              className="w-full h-full object-cover"
              onClick={() => handleViewNFTDetails(nft.id)}
            />
          ) : (
            <p>图片加载失败</p>
          )}
        </div>
        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white "># {nft.id}</span>
        </figcaption>
      </div>

      {/* 卡片内容 */}
      <div className="card-body space-y-3">
        {/* NFT 基本信息 */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
            <div className="flex flex-wrap gap-2">
              {nft.attributes?.map((attr, index) => (
                <span key={index} className="badge badge-primary py-3">
                  {attr.value}
                </span>
              ))}
            </div>
          </div>
          <p className="my-0 text-base text-gray-600">{nft.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Owner:</span>
            <Address address={nft.owner as `0x${string}`} />
          </div>
        </div>

        {/* 如果不是租赁来的 NFT，显示所有操作按钮 */}
        {!nft.isRentedByMe && (
          <div className="space-y-4">
            {/* 主要操作按钮组 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn btn-primary btn-sm w-full"
                onClick={() => handleViewNFTDetails(nft.id)}
              >
                查看详情
              </button>
              
              {!isListed && !nft.isRentedByMe ? (
                <button
                  className="btn btn-secondary btn-sm w-full"
                  onClick={() => setIsListModalOpen(true)}
                >
                  上架出售
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-sm w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  上架出售
                </button>
              )}

              <button
                className="btn btn-accent btn-sm w-full"
                onClick={() => setIsFractionalizeModalOpen(true)}
              >
                碎片化
              </button>

              {nft.owner.toLowerCase() === connectedAddress?.toLowerCase() &&
              (!nft.isRented || (nft.rentExpiry && Math.floor(Date.now() / 1000) > nft.rentExpiry)) ? (
                <button
                  className="btn btn-info btn-sm w-full"
                  onClick={() => setIsRentalModalOpen(true)}
                >
                  设置租赁
                </button>
              ) : (
                <button
                  className="btn btn-info btn-sm w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  设置租赁
                </button>
              )}
            </div>

            {/* 转移功能 */}
            <div className="card bg-base-200 p-4 rounded-xl">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Transfer To:</span>
                <div className="flex gap-2">
                  <AddressInput
                    value={transferToAddress}
                    placeholder="receiver address"
                    onChange={newValue => setTransferToAddress(newValue)}
                  />
                  <button
                    className="btn btn-primary btn-sm whitespace-nowrap"
                    onClick={async () => {
                      try {
                        const tx = await writeContractAsync({
                          functionName: "transferFrom",
                          args: [nft.owner as `0x${string}`, transferToAddress as `0x${string}`, BigInt(nft.id.toString())],
                        });

                        const receipt = await publicClient.waitForTransactionReceipt({ 
                          hash: tx as `0x${string}` 
                        });

                        // await saveGasRecord({
                        //   tx_hash: receipt?.transactionHash,
                        //   method_name: 'transferFrom',
                        //   gas_used: receipt?.gasUsed,
                        //   gas_price: receipt?.effectiveGasPrice,
                        //   total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
                        //   user_address: connectedAddress as string,
                        //   block_number: receipt?.blockNumber
                        // });

                        notification.success("数藏转移成功!");
                      } catch (err) {
                        console.error("Error calling transferFrom function");
                        notification.error("转移失败");
                      }
                    }}
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>

            {/* 二手交易提醒 */}
            {isSecondHand && royaltyAmount !== "0" && (
              <div className="alert alert-warning shadow-lg">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>二手交易版税费: {formatEther(royaltyAmount)} ETH</span>
                </div>
              </div>
            )}

            {/* 保持现有的弹窗代码不变 */}
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
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="输入价格"
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="modal-action">
                  <button className="btn" onClick={() => setIsListModalOpen(false)}>
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      calculateRoyalty(price);
                      handleListNFT();
                      setIsListModalOpen(false);
                    }}
                  >
                    确认上架
                  </button>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button onClick={() => setIsListModalOpen(false)}>关闭</button>
              </form>
            </dialog>

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
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleFractionalizeNFT();
                      setIsFractionalizeModalOpen(false);
                    }}
                  >
                    确认碎片化
                  </button>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button onClick={() => setIsFractionalizeModalOpen(false)}>关闭</button>
              </form>
            </dialog>

            <dialog className={`modal ${isRentalModalOpen ? "modal-open" : ""}`}>
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">设置 数藏 租赁</h3>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">租赁地址</span>
                    </label>
                    <AddressInput
                      value={rentalAddress}
                      placeholder="租赁者地址"
                      onChange={newValue => setRentalAddress(newValue)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">到期时间</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="input input-bordered w-full"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="modal-action">
                    <button
                      className="btn"
                      onClick={() => setIsRentalModalOpen(false)}
                    >
                      取消
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleSetRental();
                        setIsRentalModalOpen(false);
                      }}
                    >
                      确认
                    </button>
                  </div>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button onClick={() => setIsRentalModalOpen(false)}>关闭</button>
              </form>
            </dialog>
          </div>
        )}
      </div>
    </div>


  );
};
