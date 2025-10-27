import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatUnits } from 'ethers'

import { useWorbooContracts } from '../services/contracts'
import { getOnChainShopItems, getShopItemTokenId } from '../utils/shop'

type PurchaseArgs = {
  itemId: string
  quantity?: number
}

type WorbooProfile = {
  isRegistered: boolean
  totalGames: number
  totalWins: number
  currentStreak: number
  lastDayId: number
  lastSubmissionAt: number
}

type WorbooPlayerHook = {
  isReady: boolean
  profile?: WorbooProfile
  balance: bigint
  balanceFormatted: string
  tokenSymbol: string
  inventory: Record<string, bigint>
  register: () => Promise<void>
  isRegistering: boolean
  purchase: (args: PurchaseArgs) => Promise<void>
  isPurchasing: boolean
  refresh: () => void
}

const ZERO_BALANCE = 0n

export const useWorbooPlayer = (address?: string): WorbooPlayerHook => {
  const queryClient = useQueryClient()
  const contracts = useWorbooContracts()
  const { registry, registryWrite, token, tokenWrite, shop, shopWrite, isReady } =
    contracts

  const hasAddress = Boolean(address)
  const queriesEnabled = isReady && hasAddress

  const profileQuery = useQuery(
    ['worboo', 'profile', address],
    async (): Promise<WorbooProfile> => {
      const result = await registry!.getProfile(address)
      const [
        isRegistered,
        totalGames,
        totalWins,
        currentStreak,
        lastDayId,
        lastSubmissionAt,
      ] = result as unknown as [
        boolean,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint
      ]
      return {
        isRegistered,
        totalGames: Number(totalGames),
        totalWins: Number(totalWins),
        currentStreak: Number(currentStreak),
        lastDayId: Number(lastDayId),
        lastSubmissionAt: Number(lastSubmissionAt),
      }
    },
    {
      enabled: queriesEnabled && Boolean(registry),
    }
  )

  const decimalsQuery = useQuery(
    ['worboo', 'token', 'decimals'],
    () => token!.decimals() as Promise<number>,
    { enabled: Boolean(token) }
  )

  const symbolQuery = useQuery(
    ['worboo', 'token', 'symbol'],
    () => token!.symbol() as Promise<string>,
    { enabled: Boolean(token) }
  )

  const balanceQuery = useQuery(
    ['worboo', 'token', 'balance', address],
    () => token!.balanceOf(address) as Promise<bigint>,
    {
      enabled: queriesEnabled && Boolean(token),
      initialData: ZERO_BALANCE,
    }
  )

  const inventoryQuery = useQuery(
    ['worboo', 'shop', 'inventory', address],
    async () => {
      const items = getOnChainShopItems()
      if (items.length === 0) return {}
      const owners = items.map(() => address)
      const ids = items.map((entry) => entry.tokenId)
      const balances: bigint[] = await shop!.balanceOfBatch(owners, ids)
      return balances.reduce<Record<string, bigint>>((acc, balance, index) => {
        acc[items[index].item.id] = balance
        return acc
      }, {})
    },
    {
      enabled: queriesEnabled && Boolean(shop),
      initialData: {},
    }
  )

  const registerMutation = useMutation(async () => {
    if (!registryWrite) {
      throw new Error('Wallet not connected')
    }
    const tx = await registryWrite.register()
    await tx.wait?.()
    await profileQuery.refetch()
  })

  const purchaseMutation = useMutation(
    async ({ itemId, quantity = 1 }: PurchaseArgs) => {
      if (!shopWrite) {
        throw new Error('Wallet not connected')
      }
      const tokenId = getShopItemTokenId(itemId)
      const tx = await shopWrite.purchase(tokenId, quantity)
      await tx.wait?.()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['worboo', 'token', 'balance', address])
        queryClient.invalidateQueries(['worboo', 'shop', 'inventory', address])
      },
    }
  )

  const balance = balanceQuery.data ?? ZERO_BALANCE
  const decimals = decimalsQuery.data ?? 18

  const balanceFormatted = useMemo(
    () => formatUnits(balance, decimals),
    [balance, decimals]
  )

  return {
    isReady: queriesEnabled,
    profile: profileQuery.data,
    balance,
    balanceFormatted,
    tokenSymbol: symbolQuery.data ?? 'WBOO',
    inventory: inventoryQuery.data ?? {},
    register: async () => {
      await registerMutation.mutateAsync()
      await profileQuery.refetch()
    },
    isRegistering: registerMutation.isLoading,
    purchase: async (args) => {
      await purchaseMutation.mutateAsync(args)
    },
    isPurchasing: purchaseMutation.isLoading,
    refresh: () => {
      profileQuery.refetch()
      balanceQuery.refetch()
      inventoryQuery.refetch()
    },
  }
}
