import { motion } from "framer-motion";

export const FooterDecoration = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-12 text-center text-base-content/50"
    >
      <div className="flex justify-center gap-4 mb-4">
        {["📊", "📈", "💹", "📉", "📋"].map((emoji, index) => (
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
      <p className="text-sm">实时追踪 数藏 交易动态</p>
    </motion.div>
  );
}; 