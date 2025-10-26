'use client';

import { useState, useCallback } from 'react';
import { parseEther, formatEther } from 'viem';
import { MarginVaultABI } from '@/lib/contracts/abi';
import { getContractAddresses } from '@/lib/contracts/addresses';
import { 
  DepositParams, 
  WithdrawParams, 
  Account, 
  CollateralInfo 
} from '@/lib/contracts/types';

export function useMarginVault(chainId: number) {
  const contractAddresses = getContractAddresses(chainId);

  // Deposit Collateral
  const useDeposit = () => {
    const [isLoading, setIsLoading] = useState(false);

    const deposit = useCallback(async (params: DepositParams) => {
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        console.log('Depositing collateral:', params);
        
        // Simulate contract interaction
        const result = {
          hash: '0x' + Math.random().toString(16).substr(2, 64),
          success: true,
          amount: params.amount,
          token: params.token,
        };
        
        return result;
      } catch (error) {
        console.error('Error depositing collateral:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);

    return {
      deposit,
      isLoading,
      isSuccess: false,
      error: null,
    };
  };

  // Withdraw Collateral
  const useWithdraw = () => {
    const [isLoading, setIsLoading] = useState(false);

    const withdraw = useCallback(async (params: WithdrawParams) => {
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        console.log('Withdrawing collateral:', params);
        
        // Simulate contract interaction
        const result = {
          hash: '0x' + Math.random().toString(16).substr(2, 64),
          success: true,
          amount: params.amount,
          token: params.token,
        };
        
        return result;
      } catch (error) {
        console.error('Error withdrawing collateral:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);

    return {
      withdraw,
      isLoading,
      isSuccess: false,
      error: null,
    };
  };

  // Get Account Info
  const useGetAccount = (trader?: string) => {
    const [account, setAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAccount = useCallback(async () => {
      if (!trader) return;
      
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        const mockAccount: Account = {
          trader: trader as `0x${string}`,
          totalCollateral: parseEther('10000'), // $10,000 USD
          availableCollateral: parseEther('7500'), // $7,500 USD available
          usedCollateral: parseEther('2500'), // $2,500 USD used
          totalDebt: parseEther('1000'), // $1,000 USD debt
          healthFactor: parseEther('3.5'), // 3.5x health factor
          liquidationThreshold: parseEther('1.2'), // 1.2x liquidation threshold
          lastUpdateTime: BigInt(Date.now()),
        };
        
        setAccount(mockAccount);
      } catch (error) {
        console.error('Error fetching account:', error);
        setAccount(null);
      } finally {
        setIsLoading(false);
      }
    }, [trader]);

    return {
      account,
      isLoading,
      error: null,
      refetch: fetchAccount,
    };
  };

  // Get Collateral Info
  const useGetCollateralInfo = (trader?: string, token?: string) => {
    const [collateralInfo, setCollateralInfo] = useState<CollateralInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCollateralInfo = useCallback(async () => {
      if (!trader || !token) return;
      
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        const mockCollateralInfo: CollateralInfo = {
          token: token as `0x${string}`,
          balance: parseEther('5000'), // 5000 tokens
          value: parseEther('5000'), // $5000 USD value
          collateralFactor: parseEther('0.8'), // 80% collateral factor
          liquidationThreshold: parseEther('0.85'), // 85% liquidation threshold
          isActive: true,
          lastPriceUpdate: BigInt(Date.now()),
        };
        
        setCollateralInfo(mockCollateralInfo);
      } catch (error) {
        console.error('Error fetching collateral info:', error);
        setCollateralInfo(null);
      } finally {
        setIsLoading(false);
      }
    }, [trader, token]);

    return {
      collateralInfo,
      isLoading,
      error: null,
      refetch: fetchCollateralInfo,
    };
  };

  // Get Available Collateral
  const useGetAvailableCollateral = (trader?: string) => {
    const [availableCollateral, setAvailableCollateral] = useState<bigint>(0n);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAvailableCollateral = useCallback(async () => {
      if (!trader) return;
      
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        const mockAvailable = parseEther('7500'); // $7,500 USD available
        setAvailableCollateral(mockAvailable);
      } catch (error) {
        console.error('Error fetching available collateral:', error);
        setAvailableCollateral(0n);
      } finally {
        setIsLoading(false);
      }
    }, [trader]);

    return {
      availableCollateral,
      availableCollateralFormatted: formatEther(availableCollateral),
      isLoading,
      error: null,
      refetch: fetchAvailableCollateral,
    };
  };

  // Calculate Max Leverage
  const useCalculateMaxLeverage = (trader?: string, market?: string) => {
    const [maxLeverage, setMaxLeverage] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    const calculateMaxLeverage = useCallback(async () => {
      if (!trader || !market) return;
      
      setIsLoading(true);
      
      try {
        // Mock implementation - replace with actual contract call
        // Calculate based on available collateral and market risk parameters
        const mockMaxLeverage = Math.floor(Math.random() * 50) + 1; // 1-50x
        setMaxLeverage(mockMaxLeverage);
      } catch (error) {
        console.error('Error calculating max leverage:', error);
        setMaxLeverage(0);
      } finally {
        setIsLoading(false);
      }
    }, [trader, market]);

    return {
      maxLeverage,
      isLoading,
      error: null,
      refetch: calculateMaxLeverage,
    };
  };

  return {
    useDeposit,
    useWithdraw,
    useGetAccount,
    useGetCollateralInfo,
    useGetAvailableCollateral,
    useCalculateMaxLeverage,
  };
}

// Hook for getting all collateral balances
export function useCollateralBalances(chainId: number, trader?: string) {
  const [balances, setBalances] = useState<Record<string, CollateralInfo>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!trader) return;
    
    setIsLoading(true);
    
    try {
      // Mock implementation - replace with actual contract call
      const mockBalances: Record<string, CollateralInfo> = {
        'USDC': {
          token: '0x' + 'USDC'.padEnd(40, '0') as `0x${string}`,
          balance: parseEther('5000'),
          value: parseEther('5000'),
          collateralFactor: parseEther('0.9'),
          liquidationThreshold: parseEther('0.95'),
          isActive: true,
          lastPriceUpdate: BigInt(Date.now()),
        },
        'WETH': {
          token: '0x' + 'WETH'.padEnd(40, '0') as `0x${string}`,
          balance: parseEther('2'),
          value: parseEther('6000'),
          collateralFactor: parseEther('0.8'),
          liquidationThreshold: parseEther('0.85'),
          isActive: true,
          lastPriceUpdate: BigInt(Date.now()),
        },
        'WBTC': {
          token: '0x' + 'WBTC'.padEnd(40, '0') as `0x${string}`,
          balance: parseEther('0.1'),
          value: parseEther('4500'),
          collateralFactor: parseEther('0.75'),
          liquidationThreshold: parseEther('0.8'),
          isActive: true,
          lastPriceUpdate: BigInt(Date.now()),
        },
      };
      
      setBalances(mockBalances);
    } catch (error) {
      console.error('Error fetching collateral balances:', error);
      setBalances({});
    } finally {
      setIsLoading(false);
    }
  }, [trader]);

  return {
    balances,
    isLoading,
    error: null,
    refetch: fetchBalances,
  };
}

// Hook for portfolio summary
export function usePortfolioSummary(chainId: number, trader?: string) {
  const { useGetAccount } = useMarginVault(chainId);
  const { account, isLoading: isLoadingAccount, refetch: refetchAccount } = useGetAccount(trader);
  
  const [summary, setSummary] = useState({
    totalValue: '0',
    totalPnl: '0',
    totalPnlPercentage: '0',
    marginUsed: '0',
    marginAvailable: '0',
    marginUtilization: '0',
  });

  const calculateSummary = useCallback(() => {
    if (!account) return;

    const totalValue = formatEther(account.totalCollateral);
    const marginUsed = formatEther(account.usedCollateral);
    const marginAvailable = formatEther(account.availableCollateral);
    const marginUtilization = account.totalCollateral > 0n 
      ? ((Number(account.usedCollateral) / Number(account.totalCollateral)) * 100).toFixed(2)
      : '0';

    // Mock PnL calculation
    const totalPnl = (Math.random() * 2000 - 1000).toFixed(2); // -$1000 to +$1000
    const totalPnlPercentage = account.totalCollateral > 0n
      ? ((Number(totalPnl) / Number(formatEther(account.totalCollateral))) * 100).toFixed(2)
      : '0';

    setSummary({
      totalValue,
      totalPnl,
      totalPnlPercentage,
      marginUsed,
      marginAvailable,
      marginUtilization,
    });
  }, [account]);

  return {
    summary,
    isLoading: isLoadingAccount,
    error: null,
    refetch: () => {
      refetchAccount();
      calculateSummary();
    },
  };
}