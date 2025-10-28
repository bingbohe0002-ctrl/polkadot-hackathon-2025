"use client";

import {
  useReadContract,
  useAccount,
  useChainId,
  useBalance,
  useWatchContractEvent,
} from "wagmi";
import { useMemo, useState, useEffect } from "react";
import { getContractAddress } from "@/config/contracts";
import vDOTAbi from "@/contracts/abis/vDOT.json";
import VotingTicketAbi from "@/contracts/abis/VotingTicket.json";
import StakingContractAbi from "@/contracts/abis/StakingContract.json";
import VotingContractAbi from "@/contracts/abis/VotingContract.json";

/**
 * 格式化大数字显示
 */
function formatNumber(value: bigint, decimals = 18): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = value / divisor;
  const fractionalPart = value % divisor;

  // 转换为数字进行格式化
  const wholeNumber = Number(wholePart);
  const fractionalNumber = Number(fractionalPart) / Number(divisor);
  const totalNumber = wholeNumber + fractionalNumber;

  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(totalNumber);
}

/**
 * 用户数据接口
 */
export interface UserData {
  // 原生代币余额（ETH/DOT）
  nativeBalance: string;
  // vDOT 余额
  vDOTBalance: string;
  // 已抵押总量
  stakedAmount: string;
  // 投票权（票券数量）
  votingPower: string;
  // 票券余额
  ticketBalance: string;
  // 是否已投票
  hasVoted: boolean;
  // 已铸造 vDOT（vDOT 余额 + 已抵押量）
  totalVDOT: string;
  // 加载状态
  isLoading: boolean;
  // 错误状态
  hasError: boolean;
  // 错误信息
  error: Error | null;
}

/**
 * 获取用户个人数据的 Hook
 */
export function useUserData(): UserData {
  const chainId = useChainId();
  const { address } = useAccount();

  // 获取合约地址
  const vDOTAddress = getContractAddress(chainId, "vDOT");
  const votingTicketAddress = getContractAddress(chainId, "VotingTicket");
  const stakingContractAddress = getContractAddress(chainId, "StakingContract");
  const votingContractAddress = getContractAddress(chainId, "VotingContract");

  // 获取抵押详情
  const stakeDetails = useUserStakeDetails();

  // 读取原生代币余额（ETH/DOT）
  const { data: nativeBalance } = useBalance({
    address,
    query: {
      refetchInterval: 10000, // 每10秒刷新
    },
  });

  // 读取用户 vDOT 余额
  const {
    data: vDOTBalance,
    isLoading: isLoadingVDOT,
    error: vDOTError,
  } = useReadContract({
    address: vDOTAddress,
    abi: vDOTAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 10000,
    },
  });

  // 读取用户票券余额
  const {
    data: ticketBalance,
    isLoading: isLoadingTickets,
    error: ticketError,
  } = useReadContract({
    address: votingTicketAddress,
    abi: VotingTicketAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 10000,
    },
  });

  // 读取用户抵押记录数量
  const {
    data: _stakeCount,
    isLoading: isLoadingStakeCount,
    error: stakeCountError,
  } = useReadContract({
    address: stakingContractAddress,
    abi: StakingContractAbi,
    functionName: "getUserStakeCount",
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 10000,
    },
  });

  // 读取用户投票记录数量
  const {
    data: voteCount,
    isLoading: isLoadingVoteCount,
    error: voteCountError,
    refetch: refetchVoteCount,
  } = useReadContract({
    address: votingContractAddress,
    abi: VotingContractAbi,
    functionName: "getUserVoteCount",
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 10000,
    },
  });

  // 监听 vDOT 转账事件
  useWatchContractEvent({
    address: vDOTAddress,
    abi: vDOTAbi,
    eventName: "Transfer",
    args: {
      from: address, // 监听用户相关的转账
    },
    onLogs: (_logs) => {
      console.log("检测到 vDOT 转账事件，刷新数据");
      // 当有转账时，重新获取数据
      // 这里可以触发重新获取，但由于 useReadContract 已经有 refetchInterval，会自动更新
    },
  });

  // 监听抵押事件
  useWatchContractEvent({
    address: stakingContractAddress,
    abi: StakingContractAbi,
    eventName: "Staked",
    args: {
      user: address,
    },
    onLogs: (_logs) => {
      console.log("检测到抵押事件，刷新数据");
      // 当有抵押时，重新获取数据
      // 这里可以触发重新获取，但由于 useReadContract 已经有 refetchInterval，会自动更新
    },
  });

  // 监听投票事件
  useWatchContractEvent({
    address: votingContractAddress,
    abi: VotingContractAbi,
    eventName: "Voted",
    args: {
      voter: address,
    },
    onLogs: (_logs) => {
      console.log("检测到投票事件，刷新数据");
      // 当有投票时，重新获取数据
      void refetchVoteCount();
    },
  });

  // 计算用户数据
  const userData = useMemo(() => {
    const isLoading =
      isLoadingVDOT ??
      isLoadingTickets ??
      isLoadingStakeCount ??
      isLoadingVoteCount ??
      stakeDetails.isLoading;

    const hasError = Boolean(
      vDOTError ?? ticketError ?? stakeCountError ?? voteCountError,
    );

    const error = vDOTError ?? ticketError ?? stakeCountError ?? voteCountError;

    // 如果没有连接钱包，返回默认值
    if (!address) {
      return {
        nativeBalance: "0",
        vDOTBalance: "0",
        stakedAmount: "0",
        votingPower: "0",
        ticketBalance: "0",
        hasVoted: false,
        totalVDOT: "0",
        isLoading: false,
        hasError: false,
        error: null,
      };
    }

    // 如果正在加载或出错，返回加载状态
    if (isLoading || hasError) {
      return {
        nativeBalance: "0",
        vDOTBalance: "0",
        stakedAmount: "0",
        votingPower: "0",
        ticketBalance: "0",
        hasVoted: false,
        totalVDOT: "0",
        isLoading,
        hasError,
        error,
      };
    }

    // 格式化数据
    const formattedNativeBalance = nativeBalance
      ? formatNumber(nativeBalance.value, nativeBalance.decimals)
      : "0";

    const formattedVDOTBalance = vDOTBalance
      ? formatNumber(vDOTBalance as bigint)
      : "0";

    const formattedTicketBalance = ticketBalance
      ? formatNumber(ticketBalance as bigint)
      : "0";

    // 使用真实的抵押数据
    const formattedStakedAmount = formatNumber(stakeDetails.totalStaked);
    const formattedVotingPower = formatNumber(stakeDetails.totalVotingPower);

    // 计算已铸造 vDOT（vDOT 余额 + 已抵押量）
    const totalVDOTValue =
      (vDOTBalance ? (vDOTBalance as bigint) : BigInt(0)) +
      stakeDetails.totalStaked;
    const formattedTotalVDOT = formatNumber(totalVDOTValue);

    // 检查是否已投票
    const hasVoted = voteCount ? Number(voteCount) > 0 : false;

    return {
      nativeBalance: formattedNativeBalance,
      vDOTBalance: formattedVDOTBalance,
      stakedAmount: formattedStakedAmount,
      votingPower: formattedVotingPower,
      ticketBalance: formattedTicketBalance,
      hasVoted,
      totalVDOT: formattedTotalVDOT,
      isLoading: false,
      hasError: false,
      error: null,
    };
  }, [
    address,
    nativeBalance,
    vDOTBalance,
    ticketBalance,
    voteCount,
    stakeDetails,
    isLoadingVDOT,
    isLoadingTickets,
    isLoadingStakeCount,
    isLoadingVoteCount,
    vDOTError,
    ticketError,
    stakeCountError,
    voteCountError,
  ]);

  return userData;
}

/**
 * 获取用户抵押详情的 Hook
 * 用于计算真实的已抵押总量和投票权
 */
export function useUserStakeDetails() {
  const chainId = useChainId();
  const { address } = useAccount();
  const stakingContractAddress = getContractAddress(chainId, "StakingContract");
  const [stakeDetails, setStakeDetails] = useState({
    totalStaked: BigInt(0),
    totalVotingPower: BigInt(0),
    activeStakes: 0,
    isLoading: false,
  });

  // 读取用户抵押记录数量
  const { data: stakeCount, refetch: refetchStakeCount } = useReadContract({
    address: stakingContractAddress,
    abi: StakingContractAbi,
    functionName: "getUserStakeCount",
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 10000,
    },
  });

  // 计算抵押详情
  useEffect(() => {
    const fetchStakeDetails = async () => {
      if (!address || !stakeCount || Number(stakeCount) === 0) {
        setStakeDetails({
          totalStaked: BigInt(0),
          totalVotingPower: BigInt(0),
          activeStakes: 0,
          isLoading: false,
        });
        return;
      }

      setStakeDetails((prev) => ({ ...prev, isLoading: true }));

      try {
        // 创建公共客户端
        const { createPublicClient, http } = await import("viem");
        const { getChainById } = await import("@/config/chains");

        const client = createPublicClient({
          chain: getChainById(chainId),
          transport: http(),
        });

        // 遍历所有抵押记录
        const stakePromises = [];
        for (let i = 0; i < Number(stakeCount); i++) {
          stakePromises.push(
            client.readContract({
              address: stakingContractAddress,
              abi: StakingContractAbi,
              functionName: "getUserStake",
              args: [address, BigInt(i)],
            }),
          );
        }

        // 等待所有抵押记录读取完成
        const stakes = await Promise.all(stakePromises);

        let totalStaked = BigInt(0);
        let totalVotingPower = BigInt(0);
        let activeStakes = 0;

        stakes.forEach((stake: unknown) => {
          const stakeData = stake as {
            active: boolean;
            amount: bigint;
            ticketsMinted: bigint;
          };
          if (stakeData?.active) {
            totalStaked += stakeData.amount;
            totalVotingPower += stakeData.ticketsMinted;
            activeStakes++;
          }
        });

        setStakeDetails({
          totalStaked,
          totalVotingPower,
          activeStakes,
          isLoading: false,
        });
      } catch (error) {
        console.error("获取抵押详情失败:", error);
        setStakeDetails({
          totalStaked: BigInt(0),
          totalVotingPower: BigInt(0),
          activeStakes: 0,
          isLoading: false,
        });
      }
    };

    void fetchStakeDetails();
  }, [address, stakeCount, stakingContractAddress, chainId]);

  return {
    ...stakeDetails,
    refetch: refetchStakeCount,
  };
}
