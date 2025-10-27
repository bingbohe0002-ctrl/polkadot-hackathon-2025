import type { Address } from "viem";

/**
 * 合约地址配置
 * 支持多链部署，根据链 ID 返回对应的合约地址
 */

// 已部署的合约地址（Hardhat Local Network - Chain ID: 31337）
const HARDHAT_CONTRACTS = {
  vDOT: "0xBEc49fA140aCaA83533fB00A2BB19bDdd0290f25" as Address,
  StakingContract: "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d" as Address,
  VotingTicket: "0x4EE6eCAD1c2Dae9f525404De8555724e3c35d07B" as Address,
  VotingContract: "0xD84379CEae14AA33C123Af12424A37803F885889" as Address,
  VotingNFTReward: "0x172076E0166D1F9Cc711C77Adf8488051744980C" as Address,
  BTCOracle: "0xf4B146FbA71F41E0592668ffbF264F1D186b2Ca8" as Address,
  OmniLSAdapter: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318" as Address,
} as const;

// Moonbase Alpha 测试网合约地址
const MOONBASE_ALPHA_CONTRACTS = {
  vDOT: "0xD8e779Ca9D22E587f64f613dE9615c797095d225" as Address,
  StakingContract: "0xc0b279c4918F236e9d82f54DFd2e4A819c1Ce156" as Address,
  VotingTicket: "0x911896E86EC581cAD2D919247F5ae2f61F17849C" as Address,
  VotingContract: "0x0CeCa1B57D8f024c81223ABAE786C643BBBd3F8B" as Address,
  VotingNFTReward: "0xF7496a303D8D811f8A10203B5825fed9e6119b01" as Address,
  BTCOracle: "0x0bc48e6406C91448D8BE6c00AD77Cad8FaE4Fb2b" as Address,
  OmniLSAdapter: "0x0000000000000000000000000000000000000000" as Address,
} as const;

// Moonbeam 主网合约地址（待部署）
const MOONBEAM_CONTRACTS = {
  vDOT: "0x0000000000000000000000000000000000000000" as Address,
  StakingContract: "0x0000000000000000000000000000000000000000" as Address,
  VotingTicket: "0x0000000000000000000000000000000000000000" as Address,
  VotingContract: "0x0000000000000000000000000000000000000000" as Address,
  VotingNFTReward: "0x0000000000000000000000000000000000000000" as Address,
  BTCOracle: "0x0000000000000000000000000000000000000000" as Address,
  OmniLSAdapter: "0x0000000000000000000000000000000000000000" as Address,
} as const;

// Moonriver 测试网合约地址（待部署）
const MOONRIVER_CONTRACTS = {
  vDOT: "0x0000000000000000000000000000000000000000" as Address,
  StakingContract: "0x0000000000000000000000000000000000000000" as Address,
  VotingTicket: "0x0000000000000000000000000000000000000000" as Address,
  VotingContract: "0x0000000000000000000000000000000000000000" as Address,
  VotingNFTReward: "0x0000000000000000000000000000000000000000" as Address,
  BTCOracle: "0x0000000000000000000000000000000000000000" as Address,
  OmniLSAdapter: "0x0000000000000000000000000000000000000000" as Address,
} as const;

/**
 * 根据链 ID 获取合约地址
 */
export function getContractAddresses(
  chainId: number,
): typeof HARDHAT_CONTRACTS {
  switch (chainId) {
    case 31337: // Hardhat Local
      return HARDHAT_CONTRACTS;
    case 1287: // Moonbase Alpha
      return MOONBASE_ALPHA_CONTRACTS;
    case 1284: // Moonbeam
      return MOONBEAM_CONTRACTS;
    case 1285: // Moonriver
      return MOONRIVER_CONTRACTS;
    default:
      console.warn(
        `Unsupported chain ID: ${chainId}, falling back to Moonbase Alpha`,
      );
      return MOONBASE_ALPHA_CONTRACTS;
  }
}

/**
 * 获取特定合约地址
 */
export function getContractAddress(
  chainId: number,
  contractName: keyof typeof HARDHAT_CONTRACTS,
): Address {
  const contracts = getContractAddresses(chainId);
  return contracts[contractName];
}

/**
 * 检查合约是否已部署（地址不为零地址）
 */
export function isContractDeployed(
  chainId: number,
  contractName: keyof typeof HARDHAT_CONTRACTS,
): boolean {
  const address = getContractAddress(chainId, contractName);
  return address !== "0x0000000000000000000000000000000000000000";
}

/**
 * 获取所有已部署的合约信息
 */
export function getDeployedContracts(chainId: number): Record<string, Address> {
  const contracts = getContractAddresses(chainId);
  const deployed: Record<string, Address> = {};

  Object.entries(contracts).forEach(([name, address]) => {
    if (address !== "0x0000000000000000000000000000000000000000") {
      deployed[name] = address;
    }
  });

  return deployed;
}

// 导出默认配置（当前使用 Moonbase Alpha）
export const DEFAULT_CONTRACTS = MOONBASE_ALPHA_CONTRACTS;

// 导出各个合约地址和 ABI
export const btcOracleAddress = MOONBASE_ALPHA_CONTRACTS.BTCOracle;
export const votingContractAddress = MOONBASE_ALPHA_CONTRACTS.VotingContract;
export const votingTicketAddress = MOONBASE_ALPHA_CONTRACTS.VotingTicket;
export const stakingContractAddress = MOONBASE_ALPHA_CONTRACTS.StakingContract;
export const vDOTAddress = MOONBASE_ALPHA_CONTRACTS.vDOT;

// 导入 ABIs
import BTCOracleAbi from "@/contracts/abis/BTCOracle.json";
import VotingContractAbi from "@/contracts/abis/VotingContract.json";
import VotingTicketAbi from "@/contracts/abis/VotingTicket.json";
import StakingContractAbi from "@/contracts/abis/StakingContract.json";
import VDOTAbi from "@/contracts/abis/vDOT.json";

export const btcOracleAbi = BTCOracleAbi;
export const votingContractAbi = VotingContractAbi;
export const votingTicketAbi = VotingTicketAbi;
export const stakingContractAbi = StakingContractAbi;
export const vDOTAbi = VDOTAbi;
