import { motion } from "framer-motion";
import { format } from "date-fns";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";

interface FractionRecordsProps {
  events: any[];
}

export const FractionRecords = ({ events }: FractionRecordsProps) => {
  const router = useRouter();

  // 统计数据配置
  const statsData = events ? [
    { label: "碎片交易次数", value: events.length.toString(), icon: "🧩" },
    { 
      label: "总交易碎片数", 
      value: events.reduce((acc, event) => acc + Number(event.args.amount ?? 0n), 0).toString(), 
      icon: "🔢" 
    },
    { 
      label: "总交易金额", 
      value: `${formatEther(events.reduce((acc, event) => 
        acc + (event.args.amount ?? 0n) * (event.args.pricePerFraction ?? 0n), 0n))} ETH`, 
      icon: "💰" 
    },
  ] : [];

  // 渲染表格行
  const renderTableRow = (event: any, index: number) => {
    const tokenId = event.args.tokenId?.toString() ?? "N/A";
    const seller = event.args.seller ?? "N/A";
    const buyer = event.args.buyer ?? "N/A";
    const amount = event.args.amount?.toString() ?? "0";
    const pricePerFraction = formatEther(event.args.pricePerFraction ?? 0n);
    const totalPrice = formatEther((BigInt(event.args.amount ?? 0) * BigInt(event.args.pricePerFraction ?? 0)));
    const blocktimestamp = event.block?.timestamp;
    const timestamp = blocktimestamp
      ? format(new Date(Number(blocktimestamp) * 1000), "yyyy-MM-dd HH:mm:ss")
      : "N/A";

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
        <td className="text-center font-medium">{amount}</td>
        <td className="text-center font-medium text-secondary">{pricePerFraction}</td>
        <td className="text-center font-medium text-primary">{totalPrice}</td>
        <td className="text-center text-base-content/70">{timestamp}</td>
        <td className="text-center">
          <button
            onClick={() => router.push(`/market/nftDetail/${tokenId}`)}
            className="btn btn-sm btn-secondary btn-outline"
          >
            查看详情
          </button>
        </td>
      </motion.tr>
    );
  };

  return {
    title: "碎片交易记录",
    subtitle: "查看所有 数藏 碎片的交易历史",
    gradientFrom: "primary",
    gradientTo: "secondary",
    events,
    statsData,
    tableHeaders: ["Token ID", "卖家", "买家", "购买数量", "单价 (ETH)", "总价 (ETH)", "交易时间", "操作"],
    colSpan: 8,
    emptyMessage: "暂无碎片交易记录",
    renderTableRow,
  };
}; 