"use client";

import { useState, useEffect } from "react";
import { useVotingContract } from "@/hooks/useVotingContract";

interface VoteHistoryItem {
  index: number;
  predictedYear: number;
  ticketsUsed: string;
  votingPeriodId: number;
  timestamp: Date;
  claimed: boolean;
  periodStartTime: Date;
  periodEndTime: Date;
  periodActive: boolean;
  periodResolved: boolean;
  correctAnswerYear: number;
}

export function VotingHistory() {
  const { getUserVotingHistory, userVoteCount } = useVotingContract();
  const [history, setHistory] = useState<VoteHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching voting history...");
      const votingHistory = await getUserVotingHistory();
      console.log("📊 Voting history received:", votingHistory);
      setHistory(votingHistory);
    } catch (error) {
      console.error("Error fetching voting history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "🔍 VotingHistory useEffect - userVoteCount:",
      userVoteCount?.toString(),
    );
    if (userVoteCount && Number(userVoteCount) > 0) {
      console.log("✅ User has votes, fetching history...");
      void fetchHistory();
    } else {
      console.log("❌ No votes found, clearing history");
      setHistory([]);
      setLoading(false);
    }
  }, [userVoteCount]);

  const formatYearRange = (year: number) => {
    if (year === 0) {
      return "永不会";
    }

    // 计算年份范围
    const rangeStart = year % 2 === 0 ? year - 1 : year;
    const rangeEnd = rangeStart + 2;

    return `${rangeStart}-${rangeEnd}年`;
  };

  const getStatusText = (item: VoteHistoryItem) => {
    if (!item.periodResolved) {
      return "等待开奖";
    }

    if (item.claimed) {
      return "已领取奖励";
    }

    if (item.correctAnswerYear === item.predictedYear) {
      return "中奖";
    }

    return "未中奖";
  };

  const getStatusColor = (item: VoteHistoryItem) => {
    if (!item.periodResolved) {
      return "text-yellow-400";
    }

    if (item.claimed) {
      return "text-green-400";
    }

    if (item.correctAnswerYear === item.predictedYear) {
      return "text-green-400";
    }

    return "text-gray-400";
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">投票历史</h2>
          <span className="text-xs text-white/60">链上数据 · 实时更新</span>
        </div>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="text-white/60">加载中...</div>
        </div>
      </section>
    );
  }

  if (history.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">投票历史</h2>
          <span className="text-xs text-white/60">链上数据 · 实时更新</span>
        </div>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="text-white/60">暂无投票记录</div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">投票历史</h2>
        <span className="text-xs text-white/60">链上数据 · 实时更新</span>
      </div>
      <div className="mt-4 space-y-4 text-sm text-white/70">
        {history.map((item, index) => (
          <div
            key={item.index}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{item.timestamp.toLocaleString()}</span>
              <span className={getStatusColor(item)}>
                {getStatusText(item)}
              </span>
            </div>
            <p className="mt-2 text-base text-white">
              选择：{formatYearRange(item.predictedYear)}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="font-mono text-xs text-white/50">
                使用投票券：{item.ticketsUsed} 张
              </p>
              <p className="font-mono text-xs text-white/50">
                投票期：#{item.votingPeriodId}
              </p>
            </div>
            {item.periodResolved && (
              <div className="mt-2 text-xs text-white/60">
                正确答案：{formatYearRange(item.correctAnswerYear)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
