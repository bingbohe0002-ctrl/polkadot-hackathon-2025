import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { AddressInput, InputBase } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useAccount, usePublicClient } from "wagmi";
import { useRouter } from "next/navigation";
import { parseEther, formatEther } from "viem";
import { /*saveGasRecord,*/ getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

export const FractionOperations = ({ onOperationComplete }: { onOperationComplete: () => void }) => {
    const { address: connectedAddress } = useAccount();
    const publicClient = usePublicClient();
    const [fractionDetails, setFractionDetails] = useState<{ tokenId: number; amount: number }[]>([]);
    const [transferAddress, setTransferAddress] = useState<string>("");
    const [transferAmount, setTransferAmount] = useState<number>(0);
    const [salePrice, setSalePrice] = useState<number>(0);
    const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
    const [showSaleModal, setShowSaleModal] = useState<boolean>(false);
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
    const router = useRouter();

    const { writeContractAsync: writeContractAsync } = useScaffoldWriteContract("YourCollectible");
    const { data: yourCollectibleContract } = useScaffoldContract({
        contractName: "YourCollectible",
    });

    const { data: fractionsData, refetch: fetchFractions } = useScaffoldReadContract({
        contractName: "YourCollectible",
        functionName: "getFractionsByAddress",
        args: [connectedAddress], // Pass the current address as argument
    });

    useEffect(() => {
        if (connectedAddress && fractionsData) {
            const tokenIds = fractionsData[0];
            const fractions = fractionsData[1];

            const parsedData = tokenIds
                .map((tokenId: any, index: number) => ({
                    tokenId: Number(tokenId),
                    amount: Number(fractions[index].amount),
                    isForSale: fractions[index].isForSale,
                }))
                .filter(fraction => !fraction.isForSale);

            console.log("=================",parsedData);
            setFractionDetails(parsedData);
        }
    }, [connectedAddress, fractionsData]);

    const handleTransfer = async () => {
        if (selectedTokenId === null || !transferAddress || !transferAmount) {
            notification.error("请填写所有字段。");
            return;
        }
        try {
            const tx = await writeContractAsync({
                functionName: "transferFraction",
                args: [BigInt(selectedTokenId), transferAddress as `0x${string}`, BigInt(transferAmount)],
            });

            // 等待交易被确认并获取回执
            const receipt = await publicClient.waitForTransactionReceipt({ 
                hash: tx as `0x${string}` 
            });

            // 保存gas记录
             // await saveGasRecord({
             //     tx_hash: receipt?.transactionHash,
             //     method_name: 'transferFraction',
             //     gas_used: receipt?.gasUsed,
             //     gas_price: receipt?.effectiveGasPrice,
             //     total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
             //     user_address: connectedAddress as string,
             //     block_number: receipt?.blockNumber
             // });

            notification.success("转赠成功！");
            onOperationComplete();
            setShowTransferModal(false);
        } catch (error) {
            console.error("转赠失败", error);
            notification.error("转赠失败！");
        }
    };

    const handleSetForSale = async () => {
        if (selectedTokenId === null || !salePrice) {
            notification.error("请指定销售单价");
            return;
        }
        try {
            const priceWei = parseEther(salePrice.toString());
            const tx = await writeContractAsync({
                functionName: "setFractionForSale",
                args: [BigInt(selectedTokenId), priceWei],
            });

            // 等待交易被确认并获取回执
            const receipt = await publicClient.waitForTransactionReceipt({ 
                hash: tx as `0x${string}` 
            });

            // 保存gas记录
             // await saveGasRecord({
             //     tx_hash: receipt?.transactionHash,
             //     method_name: 'setFractionForSale',
             //     gas_used: receipt?.gasUsed,
             //     gas_price: receipt?.effectiveGasPrice,
             //     total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
             //     user_address: connectedAddress as string,
             //     block_number: receipt?.blockNumber
             // });

            notification.success("碎片已上架！");
            onOperationComplete();
            setShowSaleModal(false);
        } catch (error) {
            console.error("上架失败", error);
            notification.error("上架失败！");
        }
    };

    const handleRedeem = async (tokenId: number) => {
        if (!tokenId) {
            notification.error("Invalid Token ID");
            return;
        }
          
        try {
            const tx = await writeContractAsync({
                functionName: "redeemNFT",
                args: [BigInt(tokenId)],
            });

            // 等待交易被确认并获取回执
            const receipt = await publicClient.waitForTransactionReceipt({ 
                hash: tx as `0x${string}` 
            });

            // 保存gas记录
             // await saveGasRecord({
             //     tx_hash: receipt?.transactionHash,
             //     method_name: 'redeemNFT',
             //     gas_used: receipt?.gasUsed,
             //     gas_price: receipt?.effectiveGasPrice,
             //     total_cost: BigInt(receipt?.gasUsed * receipt?.effectiveGasPrice),
             //     user_address: connectedAddress as string,
             //     block_number: receipt?.blockNumber
             // });

            notification.success("赎回成功！");
            onOperationComplete();
        } catch (error) {
            console.error("赎回失败", error);
            notification.error("赎回失败！");
        }
    };

    const handleViewDetails = (tokenId: number) => {
        router.push(`/market/nftDetail/${tokenId}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <motion.div 
                className="bg-gradient-to-r from-yellow-100/80 to-yellow-50/80 backdrop-blur-md border-l-4 border-yellow-500 rounded-r-xl p-6 shadow-lg"
                whileHover={{ scale: 1.01 }}
            >
                <h3 className="text-xl font-bold text-yellow-800 mb-2">注意</h3>
                <p className="text-yellow-700">以下是您持有的数藏碎片，您可以进行转赠、上架或赎回操作。</p>
            </motion.div>

            <AnimatePresence>
                {fractionDetails.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-10 bg-base-200/50 backdrop-blur-sm rounded-3xl"
                    >
                        <p className="text-lg text-base-content/70">您没有可用的数藏碎片</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-base-100/70 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden"
                    >
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200/50">
                                    <th className="text-base-content/70 font-semibold">Token ID</th>
                                    <th className="text-base-content/70 font-semibold">数量</th>
                                    <th className="text-base-content/70 font-semibold">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fractionDetails.map((fractionDetail, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="hover:bg-base-200/30 transition-colors"
                                    >
                                        <td className="font-medium">{fractionDetail.tokenId}</td>
                                        <td>{fractionDetail.amount}</td>
                                        <td className="space-x-2">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn btn-primary btn-sm"
                                                onClick={() => {
                                                    setSelectedTokenId(fractionDetail.tokenId);
                                                    setShowTransferModal(true);
                                                }}
                                            >
                                                转赠
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setSelectedTokenId(fractionDetail.tokenId);
                                                    setShowSaleModal(true);
                                                }}
                                            >
                                                上架
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn btn-accent btn-sm"
                                                onClick={() => handleRedeem(fractionDetail.tokenId)}
                                            >
                                                兑换
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn btn-neutral btn-sm"
                                                onClick={() => handleViewDetails(fractionDetail.tokenId)}
                                            >
                                                查看详情
                                            </motion.button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 转赠模态框 */}
            <dialog className={`modal ${showTransferModal ? "modal-open" : ""}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">转赠 数藏 碎片</h3>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">接收地址</span>
                        </label>
                        <AddressInput
                            value={transferAddress}
                            onChange={(newValue) => setTransferAddress(newValue)}
                            placeholder="接收者地址"
                        />
                    </div>
                    <div className="form-control mt-4">
                        <label className="label">
                            <span className="label-text">转赠数量</span>
                        </label>
                        <InputBase
                            value={transferAmount}
                            onChange={(newValue) => setTransferAmount(Number(newValue))}
                            placeholder="输入数量"
                        />
                    </div>
                    <div className="modal-action">
                        <button 
                            className="btn" 
                            onClick={() => setShowTransferModal(false)}
                        >
                            取消
                        </button>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => {
                                handleTransfer();
                                setShowTransferModal(false);
                            }}
                        >
                            确认
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setShowTransferModal(false)}>关闭</button>
                </form>
            </dialog>

            {/* 上架模态框 */}
            <dialog className={`modal ${showSaleModal ? "modal-open" : ""}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">设置销售价格</h3>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">设置碎片单价 (ETH)</span>
                        </label>
                        <InputBase
                            value={salePrice}
                            onChange={(newValue) => setSalePrice(Number(newValue))}
                            placeholder="输入价格"
                        />
                    </div>
                    <div className="modal-action">
                        <button 
                            className="btn" 
                            onClick={() => setShowSaleModal(false)}
                        >
                            取消
                        </button>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => {
                                handleSetForSale();
                                setShowSaleModal(false);
                            }}
                        >
                            确认上架
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setShowSaleModal(false)}>关闭</button>
                </form>
            </dialog>
        </motion.div>
    );
};