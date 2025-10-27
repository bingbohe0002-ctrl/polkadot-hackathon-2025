import { motion } from "framer-motion";
import { format } from "date-fns";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";

interface MysteryBoxRecordsProps {
  events: any[];
}

export const MysteryBoxRecords = ({ events }: MysteryBoxRecordsProps) => {
  const router = useRouter();

  // 统计数据配置
  const statsData = events ? [
    { label: "总购买次数", value: events.length.toString(), icon: "🎁" },
    { 
      label: "今日购买", 
      value: events.filter(event => {
        const timestamp = event.block?.timestamp;
        if (!timestamp) return false;
        const eventDate = new Date(Number(timestamp) * 1000);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      }).length.toString(), 
      icon: "📅" 
    },
  ] : [];

  // 渲染表格行
  const renderTableRow = (event: any, index: number) => {
    const tokenId = event.args.tokenId?.toString() ?? "N/A";
    const buyer = event.args.buyer ?? "N/A";
    const uri = event.args.uri ?? "N/A";
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
        <td><Address address={buyer as `0x${string}` | undefined} /></td>
        <td className="text-center">
          <div className="tooltip" data-tip={uri}>
            <span className="text-primary cursor-pointer hover:underline">
              {uri.length > 30 ? uri.substring(0, 30) + "..." : uri}
            </span>
          </div>
        </td>
        <td className="text-center text-base-content/70">{timestamp}</td>
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
    title: "盲盒购买记录",
    subtitle: "查看所有盲盒的购买历史",
    gradientFrom: "primary",
    gradientTo: "secondary",
    events,
    statsData,
    tableHeaders: ["Token ID", "购买者", "数藏 URI", "购买时间", "操作"],
    colSpan: 5,
    emptyMessage: "暂无盲盒购买记录",
    renderTableRow,
  };
}; 