"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ActionCallouts,
  ConnectWalletPanel,
  FaqSection,
  MissionChecklist,
  ProcessTimeline,
} from "@/components/voting/HomeSections";
import { UserDashboard } from "@/components/voting/UserDashboard";
import { useWalletContext } from "@/contexts/WalletContext";
import { useContractStats } from "@/hooks/useContractStats";

export default function Home() {
  const [communityJoined, setCommunityJoined] = useState(false);

  // 获取链上统计数据
  const contractStats = useContractStats();

  const {
    isConnected: walletConnected,
    connect,
    isLoading: connecting,
  } = useWalletContext();

  const connectWallet = () => connect("evm"); // 默认连接 EVM 钱包

  const tasks = useMemo(
    () => [
      {
        label: "连接钱包",
        done: walletConnected,
        description: "切换到 Moonbeam 网络并授权扩展。",
      },
      {
        label: "铸造 vDOT",
        done: false,
        description: "通过 SLPx 桥完成 DOT → vDOT 兑换。",
      },
      {
        label: "抵押 vDOT",
        done: false,
        description: "在平台合约内锁定 vDOT 获得票券。",
      },
      {
        label: "提交预测",
        done: false,
        description: "选择年份并确认交易，等待 Chainlink 开奖。",
      },
      {
        label: "加入 TG 社区",
        done: communityJoined,
        description: "进入 Telegram 群获取开奖提醒与最新活动。",
      },
    ],
    [walletConnected, communityJoined],
  );

  const heroMetrics = useMemo(
    () => [
      {
        label: "累计铸造",
        value: contractStats.isLoading
          ? "加载中..."
          : contractStats.hasError
            ? "数据错误"
            : `${contractStats.totalMinted} vDOT`,
      },
      {
        label: "抵押总量",
        value: contractStats.isLoading
          ? "加载中..."
          : contractStats.hasError
            ? "数据错误"
            : `${contractStats.totalStaked} vDOT`,
      },
      {
        label: "参与地址",
        value: contractStats.isLoading
          ? "加载中..."
          : contractStats.hasError
            ? "数据错误"
            : contractStats.participantCount,
      },
    ],
    [contractStats],
  );

  return (
    <>
      <main className="container mx-auto max-w-7xl px-4 pt-16 pb-20">
        <section className="relative mb-16 grid gap-10 lg:grid-cols-[2fr,1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.2em] text-white/60 uppercase">
              BTC何时会被竞争链超越
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-semibold md:text-5xl lg:text-6xl">
              一次点击完成 DOT 跨链抵押，预测 BTC 的未来拐点
            </h1>
            <p className="mt-4 max-w-3xl text-base text-white/70 md:text-lg">
              连接 Moonbeam 钱包，自动调用 Bifrost SLPx 铸造
              vDOT，锁定资产换取投票券，Chainlink
              预言机实时监听竞链市值并在触发时发放预测者 NFT。
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {walletConnected ? (
                <Button
                  asChild
                  className="border-0 bg-gradient-to-r from-cyan-500 to-purple-500 px-8 text-white hover:from-cyan-600 hover:to-purple-600"
                >
                  <Link href="/mint">前往铸造页面</Link>
                </Button>
              ) : (
                <Button
                  onClick={connectWallet}
                  disabled={connecting}
                  className="border-0 bg-gradient-to-r from-cyan-500 to-purple-500 px-8 text-white hover:from-cyan-600 hover:to-purple-600"
                >
                  {connecting ? "连接中..." : "连接钱包"}
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="border-white/30 bg-white/5 px-8 text-white hover:bg-white/10"
              >
                <Link href="#flow">了解完整流程</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-400" />
                链上状态正常
              </div>
              <div className="flex items-center gap-2">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Chainlink 监听频次：每日国际标准时间00:00更新
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">实时进度</p>
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                Live
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <span className="text-white/60">{metric.label}</span>
                  <span className="text-lg font-semibold text-white">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-white/50">
              {contractStats.hasError
                ? "⚠️ 链上数据读取失败，请检查网络连接或切换网络"
                : contractStats.isLoading
                  ? "🔄 正在同步链上数据..."
                  : "✅ 数据实时读取自智能合约，每10秒自动更新"}
            </p>
          </div>
        </section>

        <ProcessTimeline />

        {!walletConnected && (
          <ConnectWalletPanel
            onConnect={connectWallet}
            isConnecting={connecting}
          />
        )}

        <ActionCallouts
          hasVoted={false}
          communityJoined={communityJoined}
          onJoinCommunity={() => setCommunityJoined(true)}
        />

        {walletConnected && (
          <>
            <UserDashboard />
          </>
        )}

        <MissionChecklist tasks={tasks} />
        <FaqSection />
      </main>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="container mx-auto max-w-7xl px-4 py-10 text-sm text-white/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>© 2025 BTC 未来预测平台 · Moonbeam & Bifrost 联合支持</p>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link href="/docs/security" className="hover:text-white">
                安全审计报告
              </Link>
              <Link href="/docs/tokenomics" className="hover:text-white">
                经济模型
              </Link>
              <Link href="/docs/support" className="hover:text-white">
                联系支持
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
