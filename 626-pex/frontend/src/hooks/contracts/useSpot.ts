'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { SpotOrderBookABI, SpotMarketABI } from '@/lib/contracts/abi';
import { getContractAddresses } from '@/lib/contracts/addresses';

export function useSpot(chainId: number) {
  const { address } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const usePlaceSpotOrder = () => {
    // Avoid storing bigint in React state to prevent runtime BigInt/number mixing
    const [params, setParams] = useState<{ marketId: string; type: 'LIMIT' | 'MARKET'; side: 'BUY' | 'SELL'; size: string; price?: string; valueWei?: bigint } | null>(null);
    const submittedRef = useRef(false);

    const { config, error: prepareError } = usePrepareContractWrite({
      chainId,
      address: (contractAddresses.spotOrderBook || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      abi: SpotOrderBookABI,
      functionName: 'placeOrder',
      args: params ? [
        BigInt(params.marketId),
        params.type === 'LIMIT' ? 0 : 1,
        params.side === 'BUY' ? 0 : 1,
        parseEther(params.size),
        params.price ? parseEther(params.price) : 0n,
      ] : undefined,
      value: params?.valueWei,
      enabled: !!params && !!address && !!contractAddresses.spotOrderBook && contractAddresses.spotOrderBook !== '0x0000000000000000000000000000000000000000',
    });

    const { write, isLoading, isSuccess, error } = useContractWrite(config);

    const placeOrder = useCallback((p: { marketId: number | bigint | string; type: 'LIMIT' | 'MARKET'; side: 'BUY' | 'SELL'; size: string; price?: string; valueWei?: bigint }) => {
      submittedRef.current = false;
      setParams({ marketId: String(p.marketId), type: p.type, side: p.side, size: p.size, price: p.price, valueWei: p.valueWei });
    }, []);

    useEffect(() => {
      if (!params) return;
      if (!write) return;
      if (submittedRef.current) return;
      submittedRef.current = true;
      try { write(); } catch (_) {}
    }, [params, write]);

    useEffect(() => {
      submittedRef.current = false;
      setParams(null);
    }, [address]);

    return { placeOrder, isLoading, isSuccess, error: error || prepareError };
  };

  // Direct writer to avoid BigInt/number mixing in prepare/write hooks
  const usePlaceSpotOrderDirect = () => {
    const publicClient = usePublicClient({ chainId });
    const { data: walletClient } = useWalletClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeOrder = useCallback(async (p: { marketId: number | bigint | string; type: 'LIMIT' | 'MARKET'; side: 'BUY' | 'SELL'; size: string; price?: string; valueWei?: bigint }) => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      try {
        const args = [
          BigInt(p.marketId),
          p.type === 'LIMIT' ? 0 : 1,
          p.side === 'BUY' ? 0 : 1,
          parseEther(p.size),
          p.price ? parseEther(p.price) : 0n,
        ] as const;

        const hash = await walletClient!.writeContract({
          account: address as `0x${string}`,
          address: (contractAddresses.spotOrderBook || '0x0000000000000000000000000000000000000000') as `0x${string}`,
          abi: SpotOrderBookABI,
          functionName: 'placeOrder',
          args,
          value: p.valueWei,
          chain: { ...walletClient!.chain!, id: Number(walletClient!.chain!.id) } as any,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
        setIsSuccess(true);
      } catch (e: any) {
        console.error('[useSpot] placeOrder error:', e);
        if (e?.stack) console.error('[useSpot] stack:', e.stack);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }, [address, contractAddresses.spotOrderBook, publicClient, walletClient]);

    return { placeOrder, isLoading, isSuccess, error };
  };

  const useCancelSpotOrder = () => {
    const [orderId, setOrderId] = useState<bigint | null>(null);
    const submittedRef = useRef(false);

    const { config, error: prepareError } = usePrepareContractWrite({
      chainId,
      address: (contractAddresses.spotOrderBook || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      abi: SpotOrderBookABI,
      functionName: 'cancelOrder',
      args: orderId ? [orderId] : undefined,
      enabled: !!orderId && !!address && !!contractAddresses.spotOrderBook && contractAddresses.spotOrderBook !== '0x0000000000000000000000000000000000000000',
    });

    const { write, isLoading, isSuccess, error } = useContractWrite(config);

    const cancelOrder = useCallback((id: number | string | bigint) => {
      submittedRef.current = false;
      setOrderId(BigInt(id));
    }, []);

    useEffect(() => {
      if (!orderId) return;
      if (!write) return;
      if (submittedRef.current) return;
      submittedRef.current = true;
      try { write(); } catch (_) {}
    }, [orderId, write]);

    useEffect(() => {
      submittedRef.current = false;
      setOrderId(null);
    }, [address]);

    return { cancelOrder, isLoading, isSuccess, error: error || prepareError };
  };

  const useGetSpotMarkets = () => {
    const { data, isLoading, error, refetch } = useContractRead({
      chainId,
      address: (contractAddresses.spotMarket || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      abi: SpotMarketABI,
      functionName: 'getAllMarkets',
      // args: [],
      enabled: !!contractAddresses.spotMarket && contractAddresses.spotMarket !== '0x0000000000000000000000000000000000000000',
      watch: true,
    });
    return { markets: (data as any) || [], isLoading, error, refetch };
  };

  return { usePlaceSpotOrder, usePlaceSpotOrderDirect, useCancelSpotOrder, useGetSpotMarkets };
}