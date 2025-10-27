import { motion } from "framer-motion";
import { format } from "date-fns";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";

interface LeaseRecordsProps {
  events: any[];
}

export const LeaseRecords = ({ events }: LeaseRecordsProps) => {
  const router = useRouter();

  // 统计数据配置
  const statsData = events ? [
    { label: "总租赁次数", value: events.length.toString(), icon: "🔑" },
    { 
      label: "活跃租赁", 
      // 过滤未过期的租赁
      value: events.filter(event => 
        event.args.expires && Number(event.args.expires) * 1000 > Date.now()
      ).length.toString(), 
      icon: "✅" 
    },
    { 
      label: "已到期", 
      // 过滤已过期的租赁
      value: events.filter(event => 
        !event.args.expires || Number(event.args.expires) * 1000 <= Date.now()
      ).length.toString(), 
      icon: "❌" 
    },
  ] : [];

  // 渲染表格行
  const renderTableRow = (event: any, index: number) => {
    const tokenId = event.args.tokenId?.toString() ?? "N/A";
    const user = event.args.user ?? "N/A";
    const expires = event.args.expires;
    const expiresDate = expires ? format(new Date(Number(expires) * 1000), "yyyy-MM-dd HH:mm:ss") : "N/A";
    const blocktimestamp = event.block?.timestamp;
    const timestamp = blocktimestamp
      ? format(new Date(Number(blocktimestamp) * 1000), "yyyy-MM-dd HH:mm:ss")
      : "N/A";
    const isExpired = expires ? Number(expires) * 1000 < Date.now() : false;

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
        <td><Address address={user as `0x${string}` | undefined} /></td>
        <td className="text-center">
          <span className={`badge ${isExpired ? 'badge-error' : 'badge-success'}`}>
            {expiresDate}
          </span>
        </td>
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
    title: "租赁记录",
    subtitle: "查看所有 数藏 的租赁历史",
    gradientFrom: "primary",
    gradientTo: "secondary",
    events,
    statsData,
    tableHeaders: ["Token ID", "租赁者地址", "到期时间", "操作时间", "操作"],
    colSpan: 5,
    emptyMessage: "暂无租赁记录",
    renderTableRow,
  };
}; 