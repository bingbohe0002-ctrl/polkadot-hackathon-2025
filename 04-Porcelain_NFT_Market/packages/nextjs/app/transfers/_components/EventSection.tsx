import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Address } from "~~/components/scaffold-eth";

interface StatCard {
  label: string;
  value: string;
  icon: string;
}

interface EventSectionProps {
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  statsData: StatCard[];
  tableHeaders: string[];
  events: any[];
  renderTableRow: (event: any, index: number) => React.ReactNode;
  emptyMessage: string;
  colSpan: number;
}

export const EventSection = ({
  title,
  subtitle,
  gradientFrom,
  gradientTo,
  statsData,
  tableHeaders,
  events,
  renderTableRow,
  emptyMessage,
  colSpan,
}: EventSectionProps) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      {/* 标题部分 */}
      <motion.div 
        variants={itemVariants} 
        className="text-center mt-20 mb-12"
      >
        <h2 className="text-4xl font-bold mb-4">
          <span className={`bg-gradient-to-r from-${gradientFrom} to-${gradientTo} bg-clip-text text-transparent 
            drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]`}
          >
            {title}
          </span>
        </h2>
        <p className="text-xl text-base-content/70">
          {subtitle}
        </p>
      </motion.div>

      {/* 统计卡片 */}
      {events && events.length > 0 && (
        <motion.div
          variants={itemVariants}
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
                  <p className={`text-2xl font-bold bg-gradient-to-r from-${gradientFrom} to-${gradientTo} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 表格部分 */}
      <motion.div
        variants={itemVariants}
        className="bg-base-100/70 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                {tableHeaders.map((header, index) => (
                  <th key={index} className="bg-base-200/50">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {!events || events.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={colSpan} className="text-center py-8">
                      <p className="text-base-content/70">{emptyMessage}</p>
                    </td>
                  </motion.tr>
                ) : (
                  events.map((event, index) => renderTableRow(event, index))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}; 