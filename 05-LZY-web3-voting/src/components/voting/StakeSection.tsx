"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StakeSectionProps {
  onStake: (amount: number) => void;
  currentStaked: number;
}

export function StakeSection({ onStake, currentStaked }: StakeSectionProps) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const mockBalance = 1000; // Mock wallet balance

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (amount > 0 && amount <= mockBalance) {
      setIsStaking(true);
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onStake(amount);
      setStakeAmount("");
      setIsStaking(false);
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const amount = ((mockBalance * percentage) / 100).toFixed(2);
    setStakeAmount(amount);
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-white">抵押 vDOT</h2>
        <div className="text-sm text-gray-300">
          余额:{" "}
          <span className="text-cyan-400">{mockBalance.toFixed(2)} vDOT</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-gray-300">抵押数量</label>
          <div className="relative">
            <Input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="输入抵押数量"
              className="border-white/20 bg-white/5 pr-16 text-white placeholder:text-gray-500"
              min="0"
              max={mockBalance}
              step="0.01"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
              vDOT
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleQuickAmount(25)}
            variant="outline"
            className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
            size="sm"
          >
            25%
          </Button>
          <Button
            onClick={() => handleQuickAmount(50)}
            variant="outline"
            className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
            size="sm"
          >
            50%
          </Button>
          <Button
            onClick={() => handleQuickAmount(75)}
            variant="outline"
            className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
            size="sm"
          >
            75%
          </Button>
          <Button
            onClick={() => handleQuickAmount(100)}
            variant="outline"
            className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
            size="sm"
          >
            MAX
          </Button>
        </div>

        <div className="space-y-2 rounded-lg bg-white/5 p-4 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>当前已抵押:</span>
            <span className="text-white">{currentStaked.toFixed(2)} vDOT</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>将获得投票权:</span>
            <span className="text-cyan-400">
              {stakeAmount ? `+${parseFloat(stakeAmount).toFixed(2)}` : "0"} 票
            </span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <span className="text-gray-300">总投票权:</span>
            <span className="text-white">
              {(currentStaked + (parseFloat(stakeAmount) || 0)).toFixed(2)} 票
            </span>
          </div>
        </div>

        <Button
          onClick={handleStake}
          disabled={
            !stakeAmount ||
            parseFloat(stakeAmount) <= 0 ||
            parseFloat(stakeAmount) > mockBalance ||
            isStaking
          }
          className="w-full border-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStaking ? (
            <span className="flex items-center justify-center">
              <svg
                className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              交易处理中...
            </span>
          ) : (
            "确认抵押"
          )}
        </Button>

        <p className="text-center text-xs text-gray-400">
          * 抵押后可随时解除，解除需要等待 7 天锁定期
        </p>
      </div>
    </div>
  );
}
