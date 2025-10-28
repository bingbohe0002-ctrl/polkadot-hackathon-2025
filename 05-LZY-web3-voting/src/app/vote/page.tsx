"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { useVotingContract } from "@/hooks/useVotingContract";
import { VotingHistory } from "@/components/voting/VotingHistory";
import { parseEther } from "viem";

const generateYearOptions = () => {
  const options = [];
  const startYear = 2025;

  // Generate 20 preset year ranges: 2025-2027, 2027-2029, ..., 2063-2065
  for (let i = 0; i < 20; i++) {
    const rangeStart = startYear + i * 2;
    const rangeEnd = rangeStart + 2;
    options.push({
      value: rangeEnd, // Use end year as value
      label: `${rangeStart}-${rangeEnd}年`,
      description: `${rangeEnd} 年前被超越`,
    });
  }

  return options;
};

const OPTIONS = generateYearOptions();

export default function VotePage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [votedOption, setVotedOption] = useState<string>("");
  const [customYear, setCustomYear] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [ticketsToVote, setTicketsToVote] = useState<string>("");
  const [longTermApproval, setLongTermApproval] = useState(false);
  const router = useRouter();

  const {
    isConnected: walletConnected,
    connect,
    isLoading: connecting,
  } = useWalletContext();

  // 使用投票合约hook
  const {
    ticketBalance,
    completeVote,
    isPending,
    isApproving,
    isVoting,
    isConfirmingApproval,
    isConfirmingVote,
    voteReceipt,
    refetchTicketBalance,
  } = useVotingContract();

  const tickets = Number(ticketBalance) / 1e18; // 转换为可读格式

  const connectWallet = () => void connect("evm");

  // 监听投票交易确认
  useEffect(() => {
    if (voteReceipt && voteReceipt.status === "success") {
      setShowSuccessModal(true);
      setHasSubmitted(true);
      // 刷新投票券余额
      void refetchTicketBalance();
    }
  }, [voteReceipt, refetchTicketBalance]);

  const handleSubmit = async () => {
    if (!walletConnected) {
      connectWallet();
      return;
    }

    let selectedValue = selected;
    let selectedLabel = "";

    if (showCustomInput && customYear) {
      selectedValue = parseInt(customYear);

      // Calculate nearest odd year as start
      const inputYear = selectedValue;
      const rangeStart = inputYear % 2 === 0 ? inputYear - 1 : inputYear;
      const rangeEnd = rangeStart + 2;

      selectedLabel = `${rangeStart}-${rangeEnd}年`;
      selectedValue = rangeEnd; // Use end year as value for consistency
    } else {
      const selectedOption = OPTIONS.find(
        (option) => option.value === selected,
      );
      selectedLabel = selectedOption?.label ?? "";
    }

    if (!selectedValue) return;

    // 验证投票券数量
    const ticketsToUseNumber = parseFloat(ticketsToVote);
    if (!ticketsToVote || ticketsToUseNumber <= 0) {
      alert("请输入有效的投票券数量");
      return;
    }

    if (ticketsToUseNumber > tickets) {
      alert("投票券余额不足");
      return;
    }

    try {
      // 转换为BigInt格式
      const ticketsToUseBigInt = parseEther(ticketsToVote);

      // 调用智能合约进行投票
      await completeVote(selectedValue, ticketsToUseBigInt, longTermApproval);

      // 设置投票选项用于显示
      setVotedOption(selectedLabel);

      // 清空投票券数量输入
      setTicketsToVote("");
    } catch (error) {
      console.error("投票失败:", error);

      // 显示更详细的错误信息
      let errorMessage = "未知错误";
      if (error instanceof Error) {
        errorMessage = error.message;

        // 处理常见的错误类型
        if (errorMessage.includes("投票期已结束")) {
          errorMessage = "当前投票期已结束，请等待新的投票期";
        } else if (errorMessage.includes("投票券授权不足")) {
          errorMessage = "投票券授权不足，请重新授权";
        } else if (errorMessage.includes("投票券余额不足")) {
          errorMessage = "投票券余额不足，请检查余额";
        } else if (errorMessage.includes("用户拒绝")) {
          errorMessage = "用户取消了交易";
        } else if (errorMessage.includes("投票交易哈希未生成")) {
          errorMessage = "交易提交失败，请检查网络连接并重试";
        } else if (errorMessage.includes("投票交易提交失败")) {
          errorMessage = "交易提交失败，请检查网络连接并重试";
        } else if (errorMessage.includes("投票超时")) {
          errorMessage = "交易确认超时，请稍后检查交易状态";
        }
      }

      alert(`投票失败: ${errorMessage}`);
    }
  };

  return (
    <>
      {/* 投票成功模态框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl">
            <div className="text-center">
              {/* 成功图标 */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
                <svg
                  className="h-8 w-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* 成功标题 */}
              <h3 className="mb-2 text-2xl font-semibold text-white">
                投票成功！
              </h3>
              <p className="mb-6 text-sm text-white/70">
                您已成功提交预测：{votedOption}
              </p>

              {/* 投票详情 */}
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">预测选项</span>
                  <span className="text-white">{votedOption}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">投票券使用</span>
                  <span className="text-white">{tickets.toFixed(2)} 张</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">投票状态</span>
                  <span className="text-green-400">已锁定</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">开奖时间</span>
                  <span className="text-white/60">Chainlink 触发后</span>
                </div>
              </div>

              {/* 下一步指引 */}
              <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                    <svg
                      className="h-4 w-4 text-purple-400"
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
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-purple-400">
                      下一步：等待开奖
                    </p>
                    <p className="text-xs text-white/60">
                      关注开奖页面获取最新信息和 NFT 奖励
                    </p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // 重置所有投票相关状态，让用户可以重新投票
                    setSelected(null);
                    setHasSubmitted(false);
                    setVotedOption("");
                    setTicketsToVote("");
                    setCustomYear("");
                    setShowCustomInput(false);
                    // 注意：不重置 longTermApproval，保持用户的授权偏好
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  继续投票
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/reveal");
                  }}
                  className="flex-1 border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  查看开奖
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto max-w-6xl px-4 pt-16 pb-20">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">提交预测</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              使用您的投票券预测比特币在未来几年内是否会被其他竞争链市值反超。提交后不可修改，请谨慎选择。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span className="flex h-2 w-2 rounded-full bg-purple-400" />
            当前投票券：{tickets.toFixed(2)}
          </div>
        </div>

        <section className="mx-auto max-w-7xl">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">选择预测年份</h2>
                  <p className="text-sm text-white/60">
                    提交后无法修改，投票券将被锁定。
                  </p>
                </div>
                {!walletConnected && (
                  <Button
                    onClick={connectWallet}
                    disabled={connecting}
                    className="border-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600"
                  >
                    {connecting ? "连接中..." : "连接钱包"}
                  </Button>
                )}
              </div>

              {/* 年份选择滚动容器 */}
              <div className="scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {OPTIONS.map((option) => {
                    const isActive = selected === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          !hasSubmitted && setSelected(option.value)
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          isActive
                            ? "border-white/50 bg-white/15"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        } ${hasSubmitted ? "cursor-not-allowed opacity-60" : ""}`}
                        disabled={hasSubmitted}
                      >
                        <p className="text-base font-semibold text-white">
                          {option.label}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          {option.description}
                        </p>
                        {isActive && (
                          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            已选择
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom year input option */}
                  <button
                    onClick={() => !hasSubmitted && setShowCustomInput(true)}
                    className={`rounded-xl border p-4 text-left transition ${
                      showCustomInput
                        ? "border-white/50 bg-white/15"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    } ${hasSubmitted ? "cursor-not-allowed opacity-60" : ""}`}
                    disabled={hasSubmitted}
                  >
                    <p className="text-base font-semibold text-white">
                      自定义年份
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      输入您预测的年份
                    </p>
                    {showCustomInput && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="number"
                          min={2027}
                          value={customYear}
                          onChange={(e) => {
                            setCustomYear(e.target.value);
                            setSelected(parseInt(e.target.value));
                          }}
                          placeholder="如: 2049"
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {customYear && (
                          <div className="text-xs text-white/60">
                            将配对为:{" "}
                            {(() => {
                              const inputYear = parseInt(customYear);
                              if (isNaN(inputYear)) return "";
                              const rangeStart =
                                inputYear % 2 === 0 ? inputYear - 1 : inputYear;
                              const rangeEnd = rangeStart + 2;
                              return `${rangeStart}-${rangeEnd}年`;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                    {showCustomInput && customYear && (
                      <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        已选择
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 投票券数量输入 */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    <svg
                      className="h-4 w-4 text-purple-300"
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
                  <h3 className="text-lg font-semibold text-white">
                    使用投票券数量
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        max={tickets}
                        step="0.01"
                        value={ticketsToVote}
                        onChange={(e) => setTicketsToVote(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-4 text-lg text-white transition-all duration-200 placeholder:text-white/50 focus:border-purple-400/60 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/20 focus:outline-none"
                        disabled={hasSubmitted || isPending}
                      />
                      <div className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-white/40">
                        张
                      </div>
                    </div>

                    {/* 百分比选择按钮 */}
                    <div className="flex gap-2">
                      {[0.25, 0.5, 0.75, 1].map((ratio) => {
                        const amount =
                          tickets > 0 ? (tickets * ratio).toFixed(2) : "0.00";
                        return (
                          <Button
                            key={ratio}
                            variant="outline"
                            onClick={() => setTicketsToVote(amount)}
                            disabled={
                              hasSubmitted || isPending || tickets === 0
                            }
                            className="flex-1 rounded-full border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition-all duration-200 hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {ratio === 1
                              ? "100%"
                              : `${(ratio * 100).toFixed(0)}%`}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 余额显示 */}
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
                    <span className="text-sm text-white/70">可用余额</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">
                        {tickets.toFixed(2)}
                      </span>
                      <span className="text-sm text-white/50">张投票券</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 信息提示卡片 */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="group rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 p-4 transition-all duration-200 hover:border-emerald-400/30 hover:bg-gradient-to-br hover:from-emerald-500/15 hover:to-emerald-400/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                      <svg
                        className="h-3 w-3 text-emerald-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        一次性投入
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        投票券将一次性投入所选年份
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-amber-400/5 p-4 transition-all duration-200 hover:border-amber-400/30 hover:bg-gradient-to-br hover:from-amber-500/15 hover:to-amber-400/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
                      <svg
                        className="h-3 w-3 text-amber-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">不可更改</p>
                      <p className="mt-1 text-xs text-white/60">
                        开奖前不可更改选择
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-purple-400/5 p-4 transition-all duration-200 hover:border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-500/15 hover:to-purple-400/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20">
                      <svg
                        className="h-3 w-3 text-purple-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">NFT 奖励</p>
                      <p className="mt-1 text-xs text-white/60">
                        开奖后正确用户获 NFT 奖励
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 长期授权选项 */}
              <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
                      <svg
                        className="h-4 w-4 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-orange-400">
                        长期授权设置
                      </h4>
                      <p className="text-xs text-orange-300/70">
                        开启后只需授权一次，后续投票无需重复授权
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={longTermApproval}
                      onChange={(e) => setLongTermApproval(e.target.checked)}
                      className="peer sr-only"
                      disabled={
                        hasSubmitted || isPending || isApproving || isVoting
                      }
                    />
                    <div className="peer h-6 w-11 rounded-full bg-white/20 peer-checked:bg-orange-500 peer-focus:ring-4 peer-focus:ring-orange-300/20 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                {longTermApproval && (
                  <div className="mt-3 rounded-lg bg-orange-500/20 p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-400"
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
                      <div className="text-xs text-orange-300">
                        <p className="mb-1 font-medium">⚠️ 长期授权说明：</p>
                        <ul className="space-y-1 text-orange-300/80">
                          <li>• 将授权投票合约使用您钱包中的所有投票券</li>
                          <li>• 后续投票无需重复授权，提升使用体验</li>
                          <li>• 如需撤销授权，请到钱包中手动撤销</li>
                          <li>• 建议定期检查授权状态，确保资金安全</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作状态提示 */}
              {(isApproving ||
                isConfirmingApproval ||
                isVoting ||
                isConfirmingVote) && (
                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20">
                      <svg
                        className="h-3 w-3 animate-spin text-blue-400"
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
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-400">
                        {isApproving || isConfirmingApproval
                          ? "步骤 1/2: 授权投票券"
                          : "步骤 2/2: 执行投票"}
                      </p>
                      <p className="text-xs text-blue-300/70">
                        {isApproving || isConfirmingApproval
                          ? "正在授权投票合约使用您的投票券..."
                          : "正在提交您的投票预测..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={
                  hasSubmitted ||
                  !selected ||
                  isPending ||
                  isApproving ||
                  isVoting ||
                  !ticketsToVote
                }
                className="mt-6 w-full border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-lg text-white hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hasSubmitted
                  ? "已提交，等待开奖"
                  : isApproving || isConfirmingApproval
                    ? "授权投票券中..."
                    : isVoting || isConfirmingVote
                      ? "投票处理中..."
                      : isPending
                        ? "处理中..."
                        : !walletConnected
                          ? "连接钱包"
                          : !selected
                            ? "请选择预测年份"
                            : !ticketsToVote
                              ? "请输入投票券数量"
                              : "提交预测"}
              </Button>
              <p className="mt-3 text-center text-xs text-white/50">
                开奖结果将同步至您的账户和邮箱通知，NFT 奖励将在 24 小时内发放。
              </p>
            </div>

            <VotingHistory />
          </div>
        </section>
      </main>
    </>
  );
}
