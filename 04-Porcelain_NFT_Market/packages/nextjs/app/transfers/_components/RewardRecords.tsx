import { motion } from "framer-motion";
import { format } from "date-fns";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";

interface RewardRecordsProps {
  events: any[];
}

export const RewardRecords = ({ events }: RewardRecordsProps) => {
  const router = useRouter();

  // 统计数据配置
  const statsData = events ? [
    { label: "总领取次数", value: events.length.toString(), icon: "🎁" },
    { 
      label: "总奖励金额", 
      value: `${formatEther(events.reduce((acc, event) => acc + (event.args.amount ?? 0n), 0n))} ETH`, 
      icon: "💎" 
    },
  ] : [];

  // 渲染表格行
  const renderTableRow = (event: any, index: number) => {
    const tokenId = event.args.tokenId?.toString() ?? "N/A";
    const holder = event.args.holder ?? "N/A";
    const amount = formatEther(event.args.amount ?? 0n);
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
        <td><Address address={holder as `0x${string}` | undefined} /></td>
        <td className="text-center font-medium text-accent">{amount}</td>
        <td className="text-center text-base-content/70">{timestamp}</td>
        <td className="text-center">
          <button
            onClick={() => router.push(`/market/nftDetail/${tokenId}`)}
            className="btn btn-sm btn-accent btn-outline"
          >
            查看详情
          </button>
        </td>
      </motion.tr>
    );
  };

  return {
    title: "忠诚度奖励记录",
    subtitle: "查看所有 数藏 的忠诚度奖励领取历史",
    gradientFrom: "primary",
    gradientTo: "secondary",
    events,
    statsData,
    tableHeaders: ["Token ID", "领取者", "奖励金额 (ETH)", "领取时间", "操作"],
    colSpan: 5,
    emptyMessage: "暂无奖励领取记录",
    renderTableRow,
  };
}; 