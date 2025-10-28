"use client";

import { useState, useEffect } from "react";
import { useStakingContract } from "@/hooks/useStakingContract";

interface StakingHistoryItem {
  index: number;
  amount: string;
  votingPeriodId: number;
  startTime: Date;
  ticketsMinted: string;
  active: boolean;
  canUnstake: boolean;
}

export function StakingHistory() {
  const { getUserStakingHistory, stakeCount } = useStakingContract();
  const [history, setHistory] = useState<StakingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching staking history...");
        const stakingHistory = await getUserStakingHistory();
        console.log("📊 Staking history received:", stakingHistory);
        setHistory(stakingHistory);
      } catch (error) {
        console.error("Error fetching staking history:", error);
      } finally {
        setLoading(false);
      }
    };

    console.log(
      "🔍 StakingHistory useEffect - stakeCount:",
      stakeCount ? Number(stakeCount) : 0,
    );
    if (stakeCount && Number(stakeCount) > 0) {
      console.log("✅ User has stakes, fetching history...");
      void fetchHistory();
    } else {
      console.log("❌ No stakes found, clearing history");
      setHistory([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakeCount]);

  const getStatusInfo = (item: StakingHistoryItem) => {
    if (!item.active) {
      return { text: "已解除", color: "text-gray-400" };
    }
    if (item.canUnstake) {
      return { text: "可解除", color: "text-green-400" };
    }
    return { text: "锁定中", color: "text-yellow-400" };
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">抵押历史</h2>
        <span className="text-xs text-white/60">链上数据 · 实时更新</span>
      </div>

      <div className="mt-4 space-y-4 text-sm text-white/70">
        {loading && <p className="text-white">加载中...</p>}
        {!loading && history.length === 0 && (
          <p className="text-center text-white/50">暂无抵押记录</p>
        )}
        {!loading &&
          history.map((item, index) => {
            const status = getStatusInfo(item);
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>抵押 #{item.index + 1}</span>
                  <span className={status.color}>{status.text}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/50">抵押数量</p>
                    <p className="text-base font-semibold text-white">
                      {item.amount} vDOT
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">获得投票券</p>
                    <p className="text-base font-semibold text-white">
                      {item.ticketsMinted} 张
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/50">投票期ID</p>
                    <p className="text-sm text-white">#{item.votingPeriodId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">抵押时间</p>
                    <p className="text-sm text-white">
                      {item.startTime.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {item.active && (
                  <div className="mt-3 rounded-lg bg-white/5 p-2">
                    <p className="text-xs text-white/60">
                      {item.canUnstake
                        ? "✅ 投票期已开奖，可以解除抵押"
                        : "⏳ 等待投票期开奖后才能解除抵押"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {!loading && history.length > 0 && (
        <div className="mt-4 rounded-lg bg-white/5 p-3 text-center">
          <p className="text-xs text-white/60">
            总计 {history.length} 条抵押记录
          </p>
        </div>
      )}
    </section>
  );
}
