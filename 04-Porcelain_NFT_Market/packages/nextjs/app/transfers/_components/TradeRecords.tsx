import { motion } from "framer-motion";
import { format } from "date-fns";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";

interface TradeRecordsProps {
  events: any[];
}

export const TradeRecords = ({ events }: TradeRecordsProps) => {
  const router = useRouter();

  // 统计数据配置
  const statsData = events ? [
    { label: "总交易次数", value: events.length.toString(), icon: "🔄" },
    { 
      label: "总交易额", 
      value: `${formatEther(events.reduce((acc, event) => acc + (event.args.price ?? 0n), 0n))} ETH`, 
      icon: "💰" 
    },
    { 
      label: "总版税", 
      value: `${formatEther(events.reduce((acc, event) => acc + (event.args.royaltyAmount ?? 0n), 0n))} ETH`, 
      icon: "💎" 
    },
  ] : [];

  // 渲染表格行
  const renderTableRow = (event: any, index: number) => {
    const tokenId = event.args.tokenId?.toString() ?? "N/A";
    const seller = event.args.seller ?? "N/A";
    const buyer = event.args.buyer ?? "N/A";
    const priceInEth = formatEther(event.args.price ?? 0n);
    const timestamp = event.block?.timestamp
      ? format(new Date(Number(event.block.timestamp) * 1000), "yyyy-MM-dd HH:mm:ss")
      : "N/A";
    const royaltyReceiver = event.args.royaltyReceiver ?? "N/A";
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
        <td className="text-center font-medium">{tokenId}</td>
        <td><Address address={seller as `0x${string}` | undefined} /></td>
        <td><Address address={buyer as `0x${string}` | undefined} /></td>
        <td className="text-center font-medium text-primary">{priceInEth}</td>
        <td className="text-center text-base-content/70">{timestamp}</td>
        <td><Address address={royaltyReceiver as `0x${string}` | undefined} /></td>
        <td className="text-center font-medium text-secondary">{royaltyAmountInEth}</td>
        <td className="text-center">
          <button
            onClick={() => router.push(`/market/nftDetail/${tokenId}`)}
            className="btn btn-sm btn-primary btn-outline"
          >
            查看详情
          </button>
        </td>
      </motion.tr>
    );
  };

  return {
    title: "交易记录",
    subtitle: "查看所有 数藏 的交易历史",
    gradientFrom: "primary",
    gradientTo: "secondary",
    events,
    statsData,
    tableHeaders: ["Token ID", "卖家", "买家", "成交价格 (ETH)", "购买时间", "版税收取人", "版税额 (ETH)", "操作"],
    colSpan: 8,
    emptyMessage: "暂无交易记录",
    renderTableRow,
  };
}; 