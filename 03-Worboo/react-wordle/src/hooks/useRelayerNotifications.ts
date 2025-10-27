import { useEffect, useMemo, useRef, useState } from 'react'
import { ZeroAddress, formatUnits } from 'ethers'
import { useAccount } from 'wagmi'

import { useWorbooContracts } from '../services/contracts'

type SuccessNotification = {
  kind: 'success'
  amount: string
  tokenSymbol: string
  txHash?: string
}

type WarningNotification = {
  kind: 'warning'
  message: string
}

export type RelayerNotification = SuccessNotification | WarningNotification

type UseRelayerNotificationsOptions = {
  tokenSymbol: string
  warningTimeoutMs?: number
  onRewardAcknowledged?: () => void
}

const formatAmount = (value: bigint): string => {
  try {
    return formatUnits(value, 18)
  } catch {
    return value.toString()
  }
}

export const useRelayerNotifications = ({
  tokenSymbol,
  warningTimeoutMs = 45_000,
  onRewardAcknowledged,
}: UseRelayerNotificationsOptions) => {
  const { registry, token, isReady } = useWorbooContracts()
  const { address, isConnected } = useAccount()
  const [pendingRewards, setPendingRewards] = useState(0)
  const [notification, setNotification] = useState<RelayerNotification | null>(
    null
  )

  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const normalizedAddress = useMemo(
    () => address?.toLowerCase() ?? null,
    [address]
  )

  useEffect(() => {
    if (!isReady || !registry || !token || !normalizedAddress || !isConnected) {
      return
    }

    const addWarningTimer = () => {
      const timer = setTimeout(() => {
        setNotification({
          kind: 'warning',
          message:
            'Reward pending—your submission is awaiting relayer confirmation.',
        })
      }, warningTimeoutMs)
      pendingTimers.current.push(timer)
    }

    const clearNextWarningTimer = () => {
      const timer = pendingTimers.current.shift()
      if (timer) {
        clearTimeout(timer)
      }
    }

    const handleGameRecorded = (
      player: string,
      dayId: bigint,
      wordHash: string,
      guesses: number,
      victory: boolean
    ) => {
      if (!victory) return
      if (player.toLowerCase() !== normalizedAddress) return

      setPendingRewards((value) => value + 1)
      addWarningTimer()
    }

    const handleTransfer = (
      from: string,
      to: string,
      value: bigint,
      event: { transactionHash: string }
    ) => {
      if (from !== ZeroAddress) return
      if (to.toLowerCase() !== normalizedAddress) return

      clearNextWarningTimer()
      setPendingRewards((value) => Math.max(value - 1, 0))
      setNotification({
        kind: 'success',
        amount: formatAmount(value),
        tokenSymbol,
        txHash: event.transactionHash,
      })
      onRewardAcknowledged?.()
    }

    registry.on('GameRecorded', handleGameRecorded)
    token.on('Transfer', handleTransfer)

    return () => {
      registry.off('GameRecorded', handleGameRecorded)
      token.off('Transfer', handleTransfer)
      pendingTimers.current.forEach((timer) => clearTimeout(timer))
      pendingTimers.current = []
    }
  }, [
    isReady,
    registry,
    token,
    normalizedAddress,
    warningTimeoutMs,
    tokenSymbol,
    onRewardAcknowledged,
    isConnected,
  ])

  const clearNotification = () => setNotification(null)

  return {
    notification,
    clearNotification,
    pendingRewards,
  }
}
