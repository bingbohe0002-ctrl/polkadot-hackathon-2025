"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "usehooks-ts";
import { BarsArrowUpIcon } from "@heroicons/react/20/solid";
import { ContractUI } from "~~/app/debug/_components/contract";
import { ContractName } from "~~/utils/scaffold-eth/contract";
import { getAllContracts } from "~~/utils/scaffold-eth/contractsData";

const selectedContractStorageKey = "scaffoldEth2.selectedContract";
const contractsData = getAllContracts();
const contractNames = Object.keys(contractsData) as ContractName[];

export function DebugContracts() {
  const [selectedContract, setSelectedContract] = useLocalStorage<ContractName>(
    selectedContractStorageKey,
    contractNames[0],
    { initializeWithValue: false },
  );

  useEffect(() => {
    if (!contractNames.includes(selectedContract)) {
      setSelectedContract(contractNames[0]);
    }
  }, [selectedContract, setSelectedContract]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-300 to-base-100 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 -top-48 -left-48 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-96 h-96 -bottom-48 -right-48 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
        {contractNames.length === 0 ? (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl mt-14"
          >
            未找到合约！
          </motion.p>
        ) : (
          <>
            {contractNames.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap"
              >
                {contractNames.map((contractName, index) => (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`btn btn-secondary btn-sm font-light hover:border-transparent 
                      ${contractName === selectedContract
                        ? "bg-base-300 hover:bg-base-300 no-animation"
                        : "bg-base-100/70 backdrop-blur-sm hover:bg-secondary"
                      }`}
                    key={contractName}
                    onClick={() => setSelectedContract(contractName)}
                  >
                    {contractName}
                    {contractsData[contractName].external && (
                      <span className="tooltip tooltip-top tooltip-accent" data-tip="外部合约">
                        <BarsArrowUpIcon className="h-4 w-4 cursor-pointer" />
                      </span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              {contractNames.map(contractName => (
                <motion.div
                  key={contractName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: contractName === selectedContract ? 1 : 0, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={contractName === selectedContract ? "" : "hidden"}
                >
                  <ContractUI
                    contractName={contractName}
                    className="bg-base-100/70 backdrop-blur-md rounded-3xl shadow-xl"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
