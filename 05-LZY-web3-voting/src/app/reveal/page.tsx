"use client";

import Link from "next/link";
import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { useBTCOracle } from "@/hooks/useBTCOracle";
import { useVotingContract } from "@/hooks/useVotingContract";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { btcOracleAddress, btcOracleAbi } from "@/config/contracts";

export default function RevealPage() {
  const {
    isConnected: walletConnected,
    address: walletAddress,
    connect,
  } = useWalletContext();

  const connectWallet = () => connect("evm");

  // 获取 BTCOracle 数据（降低查询频率：30秒）
  const {
    latestSnapshot,
    votingPeriod,
    competitors,
    lastSnapshotTime,
    nextSnapshotTime,
    canTakeSnapshot,
    snapshotCount,
  } = useBTCOracle(1);

  // BTC 价格查询状态
  const [isQueryingPrice, setIsQueryingPrice] = React.useState(false);
  const [isWaitingConfirmation, setIsWaitingConfirmation] =
    React.useState(false);
  const [pendingTxHash, setPendingTxHash] = React.useState<
    `0x${string}` | null
  >(null);
  const [lastPriceQuery, setLastPriceQuery] = React.useState<{
    price: string;
    timestamp: number;
    marketCap: string;
  } | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);

  // 手动拍摄市场快照（包含BTC价格查询）
  const { writeContractAsync: takeMarketSnapshot } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log("市场快照交易已提交，交易哈希:", hash);
        setPendingTxHash(hash);
        setIsWaitingConfirmation(true);
      },
      onError: (error) => {
        console.error("市场快照创建失败:", error);
        setIsQueryingPrice(false);
        setIsWaitingConfirmation(false);
        setPendingTxHash(null);
        setQueryError("交易提交失败，请重试");
      },
    },
  });

  // 等待交易确认
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash ?? undefined,
    query: {
      enabled: !!pendingTxHash,
    },
  });

  // 监听交易确认状态
  React.useEffect(() => {
    if (isConfirmed && isWaitingConfirmation) {
      console.log("交易已确认！");
      // 设置成功状态
      setLastPriceQuery({
        price: "快照已创建",
        timestamp: Date.now(),
        marketCap: "数据已存储到区块链",
      });
      setQueryError(null);
      setIsQueryingPrice(false);
      setIsWaitingConfirmation(false);
      setPendingTxHash(null);
    }
  }, [isConfirmed, isWaitingConfirmation]);

  // 拍摄市场快照的处理函数（包含BTC价格查询和存储）
  const handleQueryBTCPrice = async () => {
    setIsQueryingPrice(true);
    setQueryError(null); // 清除之前的错误

    try {
      // 如果钱包未连接，先连接钱包
      if (!walletConnected) {
        console.log("钱包未连接，正在连接...");
        await connectWallet();

        // 等待连接状态更新，最多等待5秒
        let retryCount = 0;
        while (!walletConnected && retryCount < 10) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          retryCount++;
        }

        if (!walletConnected) {
          throw new Error("钱包连接失败，请确保 MetaMask 已安装并解锁");
        }
      }

      console.log("开始拍摄市场快照（包含BTC价格查询）...");
      // 调用 takeMarketSnapshot 函数，拍摄当前市场快照
      await takeMarketSnapshot({
        address: btcOracleAddress,
        abi: btcOracleAbi,
        functionName: "takeMarketSnapshot",
        args: [1], // 投票期ID为1
      });

      // 注意：成功状态将在交易确认后通过 useEffect 设置
    } catch (error) {
      console.error("拍摄市场快照失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "拍摄快照失败，请重试";
      setQueryError(errorMessage);
    } finally {
      setIsQueryingPrice(false);
    }
  };

  // 获取用户投票历史功能（仅在需要时调用，不自动轮询）
  const { getUserVotingHistory } = useVotingContract();

  // 用户投票历史数据（需要异步加载）
  const [userVotingHistory, setUserVotingHistory] = React.useState<
    Array<{
      predictedYear: number;
      ticketsUsed: string;
      votingPeriodId: number;
      timestamp: Date;
      claimed: boolean;
    }>
  >([]);

  // 加载用户投票历史（只在钱包连接且投票期已开奖时加载）
  React.useEffect(() => {
    if (walletConnected && getUserVotingHistory && votingPeriod?.resolved) {
      void getUserVotingHistory().then(setUserVotingHistory);
    }
  }, [walletConnected, getUserVotingHistory, votingPeriod?.resolved]);

  // Oracle 状态
  const oracleStatus = useMemo(() => {
    const state = votingPeriod?.resolved
      ? "已开奖"
      : canTakeSnapshot
        ? "等待快照"
        : "监听中";

    const lastCheck = lastSnapshotTime
      ? new Date(lastSnapshotTime * 1000).toLocaleString("zh-CN", {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "暂无数据";

    const nextCheck = nextSnapshotTime
      ? new Date(nextSnapshotTime * 1000).toLocaleString("zh-CN", {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "暂无数据";

    return {
      state,
      lastCheck,
      nextCheck,
      triggerCondition: "任一竞争链市值 ≥ BTC",
      snapshotCount: snapshotCount || 0,
    };
  }, [
    votingPeriod,
    canTakeSnapshot,
    lastSnapshotTime,
    nextSnapshotTime,
    snapshotCount,
  ]);

  // 获奖者列表（基于用户投票历史）
  const winners = useMemo(() => {
    if (!userVotingHistory || !votingPeriod?.resolved) return [];

    return userVotingHistory
      .filter((vote) => {
        // 只显示预测正确的投票
        return (
          vote.votingPeriodId === 1 &&
          vote.predictedYear === votingPeriod.correctAnswerYear
        );
      })
      .slice(0, 10) // 最多显示10个
      .map((vote, index) => ({
        address: walletAddress
          ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          : "未连接",
        reward: index === 0 ? "传奇 NFT" : index < 3 ? "稀有 NFT" : "普通 NFT",
        option: vote.predictedYear === 0 ? "永不会" : `${vote.predictedYear}年`,
      })) as Array<{
      address: string;
      reward: string;
      option: string;
    }>;
  }, [userVotingHistory, votingPeriod, walletAddress]);

  // 时间线数据
  const timeline = useMemo(() => {
    const events = [];

    // 添加最新快照事件
    if (latestSnapshot) {
      const winningCompetitor = competitors[latestSnapshot.winningCompetitorId];
      const resultText =
        latestSnapshot.result === 1
          ? `${winningCompetitor?.name ?? "竞争链"}市值超过 BTC`
          : "BTC 市值保持领先";

      events.push({
        time: new Date(latestSnapshot.timestamp * 1000).toLocaleDateString(
          "zh-CN",
        ),
        title: "最新快照",
        description: `${resultText}`,
      });
    }

    // 如果已开奖，添加开奖事件
    if (votingPeriod?.resolved) {
      events.push({
        time: new Date(votingPeriod.endTime * 1000).toLocaleDateString("zh-CN"),
        title: "触发开奖",
        description:
          votingPeriod.correctAnswerYear === 0
            ? "BTC 市值未被超越"
            : `${votingPeriod.correctAnswerYear}年市值超越`,
      });

      events.push({
        time: new Date(votingPeriod.endTime * 1000).toLocaleDateString("zh-CN"),
        title: "奖励分发",
        description: "预测正确用户可领取奖励",
      });
    }

    return events.length > 0
      ? events
      : [
          {
            time: "待更新",
            title: "等待快照数据",
            description: "Chainlink 预言机正在监控中",
          },
        ];
  }, [latestSnapshot, votingPeriod, competitors]);

  return (
    <>
      <main className="container mx-auto max-w-6xl px-4 pt-16 pb-20">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">开奖与奖励</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              Chainlink 每 24
              小时检测一次竞链市值，当条件达成时立即触发开奖并分发 NFT
              奖励。以下信息帮助您了解开奖进度与奖励领取方式。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span className="flex h-2 w-2 rounded-full bg-green-400" />
            Chainlink 状态：{oracleStatus.state}
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
              <h2 className="text-xl font-semibold">开奖监控面板</h2>
              <div className="mt-6 grid gap-4 text-sm text-white/70 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">最近一次检查</p>
                  <p className="mt-2 text-white">{oracleStatus.lastCheck}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">下一次检查</p>
                  <p className="mt-2 text-white">{oracleStatus.nextCheck}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">触发条件</p>
                  <p className="mt-2 text-white">
                    {oracleStatus.triggerCondition}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">快照次数</p>
                  <p className="mt-2 text-white">
                    {oracleStatus.snapshotCount} 次
                  </p>
                </div>
              </div>

              {/* 显示最新快照数据 */}
              {latestSnapshot && (
                <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-sm font-medium text-blue-400">
                    📊 最新市值快照
                  </p>
                  <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                    <div>
                      <span className="text-white/50">BTC 市值：</span>
                      <span className="ml-2 text-white">
                        $
                        {(
                          parseFloat(latestSnapshot.btcMarketCap) / 1e9
                        ).toFixed(2)}
                        B
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">竞争链最高市值：</span>
                      <span className="ml-2 text-white">
                        $
                        {(
                          parseFloat(latestSnapshot.highestCompetitorCap) / 1e9
                        ).toFixed(2)}
                        B
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">领先竞争链：</span>
                      <span className="ml-2 text-white">
                        {competitors[latestSnapshot.winningCompetitorId]
                          ?.name ?? "未知"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">结果：</span>
                      <span
                        className={`ml-2 font-medium ${
                          latestSnapshot.result === 1
                            ? "text-green-400"
                            : "text-orange-400"
                        }`}
                      >
                        {latestSnapshot.result === 1
                          ? "竞争链获胜"
                          : latestSnapshot.result === 0
                            ? "BTC 主导"
                            : "待定"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 显示投票期状态 */}
              {votingPeriod && (
                <div
                  className={`mt-4 rounded-2xl border p-4 ${
                    votingPeriod.resolved
                      ? "border-green-500/20 bg-green-500/10"
                      : "border-orange-500/20 bg-orange-500/10"
                  }`}
                >
                  <p className="text-sm font-medium text-white">
                    🗳️ 投票期状态：
                    <span
                      className={`ml-2 ${
                        votingPeriod.resolved
                          ? "text-green-400"
                          : "text-orange-400"
                      }`}
                    >
                      {votingPeriod.resolved ? "已开奖" : "进行中"}
                    </span>
                  </p>
                  {votingPeriod.resolved && (
                    <p className="mt-2 text-xs text-white/70">
                      正确答案：
                      <span className="ml-2 font-medium text-white">
                        {votingPeriod.correctAnswerYear === 0
                          ? "永不会"
                          : `${votingPeriod.correctAnswerYear}年`}
                      </span>
                    </p>
                  )}
                </div>
              )}
              <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
                提示：Chainlink
                结果将与平台服务端进行双重签名验证，确保开奖数据一致性。若您预测正确，请保持钱包在线以便领取
                NFT。
              </p>
            </div>

            {/* BTC 价格查询模块 */}
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                  <svg
                    className="h-5 w-5 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">市场快照拍摄</h2>
                  <p className="text-sm text-white/70">
                    拍摄市场快照，查询并存储 BTC 和竞争链价格数据
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <Button
                    onClick={handleQueryBTCPrice}
                    disabled={isQueryingPrice || isWaitingConfirmation}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50"
                  >
                    {isQueryingPrice ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                        提交交易中...
                      </div>
                    ) : isWaitingConfirmation ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                        等待确认中...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        拍摄市场快照
                      </div>
                    )}
                  </Button>

                  {!walletConnected && (
                    <p className="text-xs text-orange-400">
                      💡 点击拍摄将自动连接钱包
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {queryError ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-400"></div>
                        <span className="text-sm font-medium text-red-400">
                          查询失败
                        </span>
                      </div>
                      <p className="text-sm text-red-300">{queryError}</p>
                      <button
                        onClick={handleQueryBTCPrice}
                        className="mt-2 text-xs text-red-300 underline hover:text-red-200"
                      >
                        重新查询
                      </button>
                    </div>
                  ) : isWaitingConfirmation ? (
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
                        <span className="text-sm font-medium text-yellow-400">
                          交易处理中
                        </span>
                        <span className="text-xs text-yellow-300/70">
                          {new Date().toLocaleTimeString("zh-CN")}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-white/50">状态：</span>
                          <span className="ml-2 text-lg font-bold text-white">
                            等待确认
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-white/50">数据：</span>
                          <span className="ml-2 text-white">
                            交易已提交，等待区块链确认
                          </span>
                        </div>
                        {pendingTxHash && (
                          <div>
                            <span className="text-xs text-white/50">
                              交易哈希：
                            </span>
                            <span className="ml-2 font-mono text-xs text-white/70">
                              {pendingTxHash.slice(0, 10)}...
                              {pendingTxHash.slice(-8)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : lastPriceQuery ? (
                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-400"></div>
                        <span className="text-sm font-medium text-green-400">
                          快照创建成功
                        </span>
                        <span className="text-xs text-green-300/70">
                          {new Date(
                            lastPriceQuery.timestamp,
                          ).toLocaleTimeString("zh-CN")}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-white/50">状态：</span>
                          <span className="ml-2 text-lg font-bold text-white">
                            {lastPriceQuery.price}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-white/50">数据：</span>
                          <span className="ml-2 text-white">
                            {lastPriceQuery.marketCap}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                      <p className="text-sm text-white/60">
                        点击&ldquo;拍摄市场快照&rdquo;查询并存储价格数据
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-xs text-blue-300">
                    <p className="mb-1 font-medium">📊 快照说明：</p>
                    <ul className="space-y-1 text-blue-300/80">
                      <li>• 拍摄当前 BTC 和竞争链的市场快照</li>
                      <li>• 价格数据来源于 Chainlink 预言机网络</li>
                      <li>• 快照数据永久存储在区块链上</li>
                      <li>• 可以随时拍摄快照（无时间限制）</li>
                      <li>• 需要 Gas 费用和钱包签名</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">开奖时间线</h2>
                <span className="text-xs text-white/60">
                  链上真实数据 · 可追踪 Tx
                </span>
              </div>
              <div className="mt-4 space-y-4 text-sm text-white/70">
                {timeline.length > 0 ? (
                  timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-white/50">
                          {item.time}
                        </span>
                        {index < timeline.length - 1 && (
                          <span
                            className="mt-2 h-full w-px bg-white/10"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-base text-white">{item.title}</p>
                        <p className="mt-2 text-xs text-white/60">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-sm text-white/60">
                      暂无时间线数据，等待 Chainlink 监控中...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">奖励领取指南</h2>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/docs/reward">查看详细教程</Link>
                </Button>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-white/70">
                <li>1. Chainlink 触发开奖后，平台会在 5 分钟内发送通知。</li>
                <li>2. 连接钱包并确认奖励领取交易（仅需签名，免 gas）。</li>
                <li>3. 在“我的 NFT”中查看，本期奖励支持跨链展示。</li>
              </ol>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs tracking-wide text-white/60 uppercase">
                我的获奖记录
              </p>

              {!walletConnected ? (
                <div className="mt-4 text-center">
                  <p className="mb-4 text-sm text-white/60">
                    连接钱包查看您的获奖记录
                  </p>
                  <Button
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
                  >
                    连接钱包
                  </Button>
                </div>
              ) : winners.length > 0 ? (
                <>
                  <div className="mt-4 space-y-4 text-sm text-white/70">
                    {winners.map((winner, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center justify-between font-mono text-xs text-white/50">
                          <span>{winner.address}</span>
                          <span>{winner.option}</span>
                        </div>
                        <p className="mt-2 text-base text-white">
                          奖励：{winner.reward}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                    <p className="text-xs text-green-400">
                      🎉 恭喜！您有 {winners.length} 个预测正确的投票
                    </p>
                  </div>
                </>
              ) : votingPeriod?.resolved ? (
                <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                  <p className="text-sm text-orange-400">
                    😔 您在本期投票中未获奖
                  </p>
                  <p className="mt-2 text-xs text-white/60">
                    继续参与下一期投票吧！
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-sm text-blue-400">⏳ 投票期进行中</p>
                  <p className="mt-2 text-xs text-white/60">
                    等待开奖后查看获奖情况
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs tracking-wide text-white/60 uppercase">
                常见问题
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                <li>· 若预测正确但未收到奖励，请在 24 小时内提交工单。</li>
                <li>· NFT 将默认存放在 Moonbeam，可在稍后跨链至其他网络。</li>
                <li>· 奖励领取截止日期为开奖后 30 天。</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}
