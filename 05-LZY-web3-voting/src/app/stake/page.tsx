"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStakingContract } from "@/hooks/useStakingContract";
import { StakingHistory } from "@/components/minting/StakingHistory";

const LOCK_OPTIONS = [
  { label: "直到开奖后解锁", value: 0, multiplier: 1.0 },
] as const;

export default function StakePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [stakeAmount, setStakeAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [stakedAmount, setStakedAmount] = useState<string>("");
  const selectedLock = LOCK_OPTIONS[0];

  const {
    vDOTBalance,
    stakeCount,
    ticketBalance,
    stake,
    isPending,
    error,
    txHash,
  } = useStakingContract();

  // 监听交易确认
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: txHash ?? undefined, // 修复类型: null 需转为 undefined
    });

  // 交易确认后的处理
  useEffect(() => {
    if (receipt && receipt.status === "success") {
      setShowSuccessModal(true);
      setStakeAmount(""); // 清空输入
    }
  }, [receipt]);

  // 格式化余额显示
  const formattedBalance = useMemo(() => {
    if (!vDOTBalance || vDOTBalance === BigInt(0)) return "0.00";
    return formatEther(vDOTBalance as bigint);
  }, [vDOTBalance]);

  // 格式化投票券余额显示
  const formattedTicketBalance = useMemo(() => {
    if (!ticketBalance || ticketBalance === BigInt(0)) return "0.00";
    return formatEther(ticketBalance as bigint);
  }, [ticketBalance]);

  // 计算预计获得的票券（1:1比例）
  const projectedTickets = useMemo(() => {
    const amount = parseFloat(stakeAmount) || 0;
    return amount > 0 ? amount : 0; // 1:1比例
  }, [stakeAmount]);

  // 处理抵押
  const handleStake = async () => {
    if (!isConnected) {
      alert("请先连接钱包");
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      alert("请输入有效的抵押数量");
      return;
    }

    if (amount > parseFloat(formattedBalance)) {
      alert("抵押数量不能超过余额");
      return;
    }

    try {
      setStakedAmount(stakeAmount); // 保存抵押数量用于显示
      await stake(parseEther(stakeAmount));
    } catch (error) {
      console.error("抵押失败:", error);
    }
  };

  // 快速选择百分比
  const handlePercentageSelect = (percent: number) => {
    const balance = parseFloat(formattedBalance);
    const amount = (balance * percent) / 100;
    setStakeAmount(amount.toFixed(4));
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <h1 className="mb-4 text-3xl font-bold text-white">抵押 vDOT</h1>
          <p className="mb-6 text-gray-400">请先连接钱包以开始抵押 vDOT</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 text-white transition-all hover:from-cyan-600 hover:to-purple-600"
          >
            返回首页连接钱包
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 抵押成功模态框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl">
            <div className="text-center">
              {/* 成功图标 */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <svg
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* 成功标题 */}
              <h3 className="mb-2 text-2xl font-semibold text-white">
                抵押成功！
              </h3>
              <p className="mb-6 text-sm text-white/70">
                您已成功抵押 {stakedAmount} vDOT，获得 {stakedAmount} 张投票券
              </p>

              {/* 抵押详情 */}
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">抵押数量</span>
                  <span className="text-white">{stakedAmount} vDOT</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">获得投票券</span>
                  <span className="text-white">{stakedAmount} 张</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">锁定状态</span>
                  <span className="text-green-400">已锁定</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/60">解锁时间</span>
                  <span className="text-white/60">投票期开奖后</span>
                </div>
              </div>

              {/* 下一步指引 */}
              <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
                    <svg
                      className="h-4 w-4 text-cyan-400"
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
                    <p className="text-sm font-medium text-cyan-400">
                      下一步：参与投票
                    </p>
                    <p className="text-xs text-white/60">
                      使用您的投票券参与 BTC 未来预测投票
                    </p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  继续抵押
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/vote");
                  }}
                  className="flex-1 border-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600"
                >
                  前往投票
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto max-w-6xl px-4 pt-16 pb-20">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">抵押 vDOT</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              将 vDOT
              锁定于平台抵押合约以换取投票券，合约由项目方托管但不可操作资金，仅用于代理治理投票。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span className="flex h-2 w-2 rounded-full bg-green-400" />
            合约审计：已完成 · 2024 Q4
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">抵押表单</h2>
                  <p className="text-sm text-white/60">
                    可用余额：{formattedBalance} vDOT
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                  <span className="flex h-2 w-2 rounded-full bg-green-400" />
                  钱包已连接
                </div>
              </div>

              <label className="mb-2 block text-xs tracking-wide text-white/60 uppercase">
                抵押数量
              </label>
              <Input
                value={stakeAmount}
                onChange={(event) => setStakeAmount(event.target.value)}
                type="number"
                min="0"
                step="0.0001"
                className="border-white/20 bg-white/5 text-lg text-white placeholder:text-white/40"
                placeholder="0.00"
              />
              <div className="mt-3 flex gap-2 text-xs text-white/60">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => handlePercentageSelect(percent)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:border-white/30"
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="mb-2 text-xs tracking-wide text-white/60 uppercase">
                  锁定周期
                </p>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="text-sm font-medium text-white">
                    {selectedLock.label}
                  </p>
                  <p className="mt-1 text-xs text-white/60">投票券比例 1:1</p>
                  <p className="mt-2 text-xs text-white/50">
                    抵押的 vDOT 将在 Chainlink 返回数据触发开奖条件后自动解锁
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>预计获得票券</span>
                  <span className="text-white">
                    {projectedTickets.toFixed(2)} 张
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>当前投票券余额</span>
                  <span className="text-white">
                    {formattedTicketBalance} 张
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>当前抵押记录</span>
                  <span className="text-white">{Number(stakeCount)} 条</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-white">
                  <span>预计可解锁时间</span>
                  <span>Chainlink 开奖后</span>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-xs text-red-400">错误: {error.message}</p>
                </div>
              )}

              <div className="mt-8 flex items-center gap-3 text-xs text-white/60">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                抵押成功后将自动生成投票券（vTicket），并存入您的账户。
              </div>

              <Button
                onClick={handleStake}
                disabled={
                  isPending ||
                  isConfirming ||
                  !stakeAmount ||
                  parseFloat(stakeAmount) <= 0
                }
                className="mt-8 w-full border-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-lg text-white hover:from-cyan-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? "抵押处理中..."
                  : isConfirming
                    ? "等待确认..."
                    : "确认抵押"}
              </Button>
              <p className="mt-3 text-center text-xs text-white/50">
                抵押的 vDOT 将锁定至 Chainlink 开奖，开奖后自动解锁。
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs tracking-wide text-white/60 uppercase">
                锁仓信息
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                <li>· 合约地址：0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9</li>
                <li>· 审计机构：SlowMist（2024 Q4）</li>
                <li>· 项目方仅可发起治理代理，无法转出资产。</li>
              </ul>
              <Button
                asChild
                variant="outline"
                className="mt-6 w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/docs/audit">查看审计报告</Link>
              </Button>
            </div>

            <StakingHistory />
          </aside>
        </section>
      </main>
    </>
  );
}
