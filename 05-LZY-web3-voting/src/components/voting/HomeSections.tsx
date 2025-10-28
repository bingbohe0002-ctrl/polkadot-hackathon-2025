"use client";

import type { JSX } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ConnectWalletPanelProps {
  onConnect: () => void;
  isConnecting?: boolean;
}

export function ConnectWalletPanel({
  onConnect,
  isConnecting,
}: ConnectWalletPanelProps) {
  return (
    <section
      id="connect"
      className="mx-auto mb-16 max-w-3xl"
      aria-labelledby="connect-wallet"
    >
      <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2
          id="connect-wallet"
          className="mb-3 text-2xl font-semibold text-white"
        >
          连接您的 Moonbeam 钱包
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-sm text-gray-300">
          接入 Moonbeam 网络即可查看 DOT 资产、启动 SLPx
          跨链铸造流程，并在几分钟内完成 vDOT 抵押与投票。
        </p>
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          size="lg"
          className="border-0 bg-gradient-to-r from-cyan-500 to-purple-500 px-10 text-white hover:from-cyan-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnecting ? "连接中..." : "连接钱包"}
        </Button>
        <p className="mt-6 text-xs text-gray-400">
          尚未安装 Moonbeam 扩展？
          <Link
            href="https://docs.moonbeam.network/learn/features/connect/"
            className="ml-1 text-cyan-300 underline-offset-4 hover:underline"
          >
            查看连接指南
          </Link>
        </p>
      </div>
    </section>
  );
}

export function ProcessTimeline() {
  const steps = [
    {
      title: "连接钱包",
      subtitle: "同步 Moonbeam DOT 余额",
      description: "签名授权后即可检测可用 DOT 并校验网络状态。",
      iconBg: "from-cyan-500 to-cyan-400",
      href: "#connect",
    },
    {
      title: "铸造 vDOT",
      subtitle: "一键调用 Bifrost SLPx",
      description: "跨链桥自动完成 DOT→vDOT 兑换与回传。",
      iconBg: "from-purple-500 to-purple-400",
      href: "/mint",
    },
    {
      title: "抵押换票券",
      subtitle: "锁定 vDOT 获得投票权",
      description: "自研合约托管资产，项目方仅可代理治理。",
      iconBg: "from-indigo-500 to-indigo-400",
      href: "/stake",
    },
    {
      title: "提交预测",
      subtitle: "选择 BTC 超越年份",
      description: "Chainlink 监控竞链市值，触发开奖分发 NFT。",
      iconBg: "from-pink-500 to-pink-400",
      href: "/vote",
    },
    {
      title: "加入社区",
      subtitle: "进群获取最新活动",
      description:
        "加入 Telegram 社区，与核心团队和预测者实时交流、抢先获取开奖通知。",
      iconBg: "from-emerald-500 to-teal-400",
      href: "https://t.me/vdot_community",
      external: true,
    },
  ];

  return (
    <section id="flow" className="mb-16" aria-labelledby="process-title">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="process-title" className="text-2xl font-semibold text-white">
            五分钟完成全流程
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            从钱包连接到预测提交仅需四步，系统会在关键节点提供引导与状态反馈，确保跨链、抵押与投票均顺利完成。
          </p>
        </div>
        <Link
          href="#missions"
          className="text-sm text-cyan-300 underline-offset-4 hover:underline"
        >
          查看交互示意
        </Link>
      </div>
      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center justify-between text-sm text-white/60">
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.iconBg} text-sm font-semibold text-white`}
                >
                  {index + 1}
                </span>
                <span className="text-xs tracking-wide text-white/50 uppercase">
                  Step {index + 1}
                </span>
              </span>
              <Link
                href={step.href}
                className="text-xs text-cyan-300 underline-offset-4 hover:underline"
                prefetch={false}
                {...(step.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                了解更多
              </Link>
            </div>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-1 text-sm text-cyan-200">{step.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { useUserData } from "@/hooks/useUserData";
import { useAccount } from "wagmi";
import { useMemo } from "react";

export function AssetOverview() {
  const { address } = useAccount();
  const userData = useUserData();
  const walletConnected = Boolean(address);

  // 计算可铸造额度
  const availableToMint = useMemo(() => {
    if (!walletConnected || userData.isLoading) return "--";

    const nativeBalance = parseFloat(userData.nativeBalance);
    const vDOTBalance = parseFloat(userData.vDOTBalance);
    const available = Math.max(nativeBalance - vDOTBalance, 0);

    return available.toFixed(2);
  }, [walletConnected, userData]);
  const cards = [
    {
      label: "Moonbeam DOT 余额",
      value: walletConnected
        ? userData.isLoading
          ? "加载中..."
          : userData.hasError
            ? "数据错误"
            : `${userData.nativeBalance} ETH`
        : "--",
      hint: "连接钱包后显示实际余额",
      accent: "from-cyan-500/30 to-cyan-400/20",
    },
    {
      label: "可铸造额度",
      value: walletConnected
        ? userData.isLoading
          ? "加载中..."
          : userData.hasError
            ? "数据错误"
            : `${availableToMint} ETH`
        : "--",
      hint: "扣除保留抵押后剩余可用",
      accent: "from-purple-500/30 to-purple-400/20",
    },
    {
      label: "已铸造 vDOT",
      value: walletConnected
        ? userData.isLoading
          ? "加载中..."
          : userData.hasError
            ? "数据错误"
            : `${userData.vDOTBalance} vDOT`
        : "--",
      hint: "跨链成功后自动更新",
      accent: "from-blue-500/30 to-indigo-400/20",
    },
    {
      label: "票券余额",
      value: walletConnected
        ? userData.isLoading
          ? "加载中..."
          : userData.hasError
            ? "数据错误"
            : `${userData.ticketBalance} 张`
        : "--",
      hint: "1 vDOT = 1 投票券",
      accent: "from-pink-500/30 to-pink-400/20",
    },
    {
      label: "已抵押总量",
      value: walletConnected
        ? userData.isLoading
          ? "加载中..."
          : userData.hasError
            ? "数据错误"
            : `${userData.stakedAmount} vDOT`
        : "--",
      hint: "抵押合约实时同步",
      accent: "from-emerald-500/30 to-emerald-400/20",
    },
    {
      label: "可用投票权",
      value: walletConnected
        ? userData.isLoading
          ? "加载中..."
          : userData.hasError
            ? "数据错误"
            : `${userData.votingPower} 票`
        : "--",
      hint: "抵押后立即获得",
      accent: "from-orange-500/30 to-amber-400/20",
    },
  ];

  return (
    <section className="mb-16" aria-labelledby="assets-title">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 id="assets-title" className="text-2xl font-semibold text-white">
            资产概览
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            资产数据实时读取链上信息，帮助您了解可铸造额度、抵押情况与剩余投票权。
          </p>
        </div>
        <Link
          href="/mint"
          className="text-sm text-cyan-300 underline-offset-4 hover:underline"
        >
          立即铸造 vDOT
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-5 backdrop-blur-sm`}
          >
            <p className="text-xs tracking-wide text-white/60 uppercase">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-white/60">{card.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

interface MissionChecklistProps {
  tasks: Array<{ label: string; done: boolean; description: string }>;
}

export function MissionChecklist({ tasks }: MissionChecklistProps) {
  const completed = tasks.filter((task) => task.done).length;
  const progress = Math.round((completed / tasks.length) * 100);

  return (
    <section id="missions" className="mb-16" aria-labelledby="mission-title">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                id="mission-title"
                className="text-2xl font-semibold text-white"
              >
                新手任务清单
              </h2>
              <p className="text-sm text-gray-300">
                依次完成四个步骤即可领取首个投票 NFT。
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
              <span className="flex h-2 w-2 rounded-full bg-green-400" />
              {completed}/{tasks.length} 已完成
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {tasks.map((task, index) => (
              <div
                key={task.label}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <span className="text-sm text-white/50">0{index + 1}</span>
                <div className="flex flex-1 flex-col">
                  <p className="text-base font-medium text-white">
                    {task.label}
                  </p>
                  <p className="text-sm text-gray-400">{task.description}</p>
                </div>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    task.done
                      ? "border-green-400 bg-green-500/20 text-green-300"
                      : "border-white/20 bg-white/5 text-white/50"
                  }`}
                  aria-hidden
                >
                  {task.done ? (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
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
                        d="M12 8v4l3 3"
                      />
                    </svg>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-6 backdrop-blur-xl">
          <div>
            <p className="text-sm tracking-wide text-gray-200 uppercase">
              总体进度
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">
              {progress}%
            </p>
            <p className="mt-2 text-sm text-gray-200">
              完成全部任务后即可在开奖阶段领取限量预测者 NFT。
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/docs/tutorial">查看任务指引</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const faqs = [
    {
      question: "为什么需要先在 Moonbeam 铸造 vDOT？",
      answer:
        "vDOT 是 Bifrost 上的质押衍生资产，通过 SLPx 跨链即可让 DOT 自动转换为可抵押、可投票的资产。",
    },
    {
      question: "抵押合约是否安全？",
      answer:
        "抵押合约经过第三方审计，并公开在链上，项目方仅具备代理投票权限，无法转移用户的 vDOT。",
    },
    {
      question: "Chainlink 如何触发开奖？",
      answer:
        "预言机每 24 小时检测一次主流竞争链市值，当任一链超越 BTC 时即触发开奖并记录预测正确的地址。",
    },
    {
      question: "可以撤销投票吗？",
      answer:
        "投票提交后即锁定对应票券，无法修改，但可以在下一期活动中重新参与。",
    },
  ];

  return (
    <section id="faq" className="mb-20" aria-labelledby="faq-title">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="faq-title" className="text-2xl font-semibold text-white">
            常见问题与风险提示
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            我们整理了参与过程中最常见的疑问，并附上审计与文档链接，帮助您更安全地完成跨链与抵押操作。
          </p>
        </div>
        <Link
          href="/docs/security"
          className="text-sm text-cyan-300 underline-offset-4 hover:underline"
        >
          查看安全白皮书
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {faqs.map((faq) => (
          <article
            key={faq.question}
            className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <h3 className="text-lg font-medium text-white">{faq.question}</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {faq.answer}
            </p>
            <Link
              href="/docs/faq"
              className="mt-4 inline-flex items-center text-xs text-cyan-300 underline-offset-4 hover:underline"
            >
              了解更多
              <svg
                className="ml-1 h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ChainlinkStatusCard() {
  return (
    <section
      id="reveal"
      className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-wide text-white/60 uppercase">
            Chainlink 预言机
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            开奖监听状态
          </h2>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-green-400/50 bg-green-500/10 px-3 py-1 text-xs text-green-300">
          <span className="flex h-2 w-2 rounded-full bg-green-400" />
          运行中
        </span>
      </div>
      <div className="space-y-4 text-sm text-gray-200">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <span>最近一次检测</span>
          <span className="text-white">2025-03-01 14:30 (UTC+0)</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <span>正在监听</span>
          <span className="text-white">Top 10 竞争链市值</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <span>触发条件</span>
          <span className="text-white">任一竞争链市值 ≥ BTC</span>
        </div>
      </div>
      <p className="mt-6 text-xs text-gray-400">
        Chainlink 数据喂价每 24
        小时更新一次，触发条件满足后系统将自动结算并分发奖励 NFT。
      </p>
    </section>
  );
}

interface ActionCalloutsProps {
  hasVoted: boolean;
  communityJoined: boolean;
  onJoinCommunity?: () => void;
}

export function ActionCallouts({
  hasVoted,
  communityJoined,
  onJoinCommunity,
}: ActionCalloutsProps) {
  const cards: Array<{
    title: string;
    description: string;
    href: string;
    accent: string;
    icon: JSX.Element;
    external?: boolean;
    onClick?: () => void;
  }> = [
    {
      title: "铸造 vDOT",
      description: "通过 Bifrost SLPx 一次点击完成 DOT → vDOT 跨链兑换。",
      href: "/mint",
      accent: "from-cyan-500/30 to-cyan-300/20",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "抵押 & 获取票券",
      description: "锁定 vDOT 获得投票权，智能合约托管资产确保安全。",
      href: "/stake",
      accent: "from-purple-500/30 to-purple-300/20",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 7l9-4 9 4-9 4-9-4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 17l9 4 9-4"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 12l9 4 9-4"
          />
        </svg>
      ),
    },
    {
      title: hasVoted ? "查看投票结果" : "立即提交预测",
      description: hasVoted
        ? "随时关注社区预测趋势与奖励发放时间。"
        : "选择 BTC 被超越的年度区间，提交后等待 Chainlink 开奖。",
      href: "/vote",
      accent: "from-pink-500/30 to-pink-300/20",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12l2 2 4-4"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 19l9-7-9-7-9 7 9 7z"
          />
        </svg>
      ),
    },
    {
      title: communityJoined ? "已加入社区" : "加入 TG 社区",
      description: communityJoined
        ? "欢迎回来，最新开奖与提案会第一时间同步到群内。"
        : "加入 Telegram 群，实时获取开奖提醒、提案动态与福利活动。",
      href: "https://t.me/vdot_community",
      accent: "from-emerald-500/30 to-teal-300/20",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M7 8h10M7 12h6m-2 8l-4-4H7a4 4 0 01-4-4V8a4 4 0 014-4h10a4 4 0 014 4v4a4 4 0 01-4 4h-2l-4 4z"
          />
        </svg>
      ),
      external: true,
      onClick: onJoinCommunity,
    },
  ];

  return (
    <section className="mb-16" aria-labelledby="actions-title">
      <h2 id="actions-title" className="mb-6 text-2xl font-semibold text-white">
        快速入口
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/30`}
            prefetch={false}
            target={card.external ? "_blank" : undefined}
            rel={card.external ? "noopener noreferrer" : undefined}
            onClick={() => card.onClick?.()}
          >
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm text-gray-200">{card.description}</p>
            </div>
            <span className="mt-6 inline-flex items-center text-sm text-cyan-200">
              查看详情
              <svg
                className="ml-1 h-4 w-4 transition group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
