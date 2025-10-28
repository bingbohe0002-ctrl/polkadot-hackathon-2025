import React from 'react'

import { RelayerNotification } from '../../hooks/useRelayerNotifications'
import { RelayerHealth } from '../../hooks/useRelayerHealth'

type Props = {
  notification: RelayerNotification | null
  pendingRewards: number
  onDismiss: () => void
  health?: RelayerHealth | null
  lastUpdated?: number
  error?: string
}

const bannerBase =
  'flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium shadow-md'

const formatRelativeTime = (timestamp?: number): string | null => {
  if (!timestamp) return null
  const delta = Date.now() - timestamp
  if (delta < 0) return null
  const seconds = Math.floor(delta / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export const RelayerStatusBanner: React.FC<Props> = ({
  notification,
  pendingRewards,
  onDismiss,
  health,
  lastUpdated,
  error,
}) => {
  const shouldRender =
    Boolean(notification) ||
    pendingRewards > 0 ||
    Boolean(error) ||
    (health && health.status !== 'idle')

  if (!shouldRender) {
    return null
  }

  let message: React.ReactNode = null
  let className = `${bannerBase} bg-blue-50 text-blue-900 border border-blue-200`

  if (notification?.kind === 'success') {
    message = (
      <span>
        Relayer minted <strong>+{notification.amount} {notification.tokenSymbol}</strong>
      </span>
    )
    className = `${bannerBase} bg-emerald-50 text-emerald-900 border border-emerald-200`
  } else if (notification?.kind === 'warning') {
    message = <span>{notification.message}</span>
    className = `${bannerBase} bg-amber-50 text-amber-900 border border-amber-200`
  } else if (pendingRewards > 0) {
    message = (
      <span>
        {pendingRewards} pending rewards queued. The relayer will mint them shortly.
      </span>
    )
  } else {
    message = <span>Relayer is processing submissions.</span>
  }

  const pendingInfo =
    pendingRewards > 0 ? (
      <span className="ml-4 text-xs font-normal text-gray-600 dark:text-gray-300">
        {pendingRewards} pending rewards
      </span>
    ) : null

  const statusInfo = (() => {
    if (error) {
      return (
        <div className="mt-2 text-xs font-normal text-red-600 dark:text-red-400">
          Health check failed: {error}
        </div>
      )
    }

    if (!health) return null

    return (
      <div className="mt-2 text-xs font-normal text-gray-600 dark:text-gray-300">
        <span className="mr-2">Status: {health.status}</span>
        <span className="mr-2">Queue: {health.queueDepth}</span>
        {health.lastMintAt && (
          <span>Last mint: {formatRelativeTime(health.lastMintAt)}</span>
        )}
        {!health.lastMintAt && lastUpdated && (
          <span>Checked: {formatRelativeTime(lastUpdated)}</span>
        )}
      </div>
    )
  })()

  if (error) {
    className = `${bannerBase} bg-amber-50 text-amber-900 border border-amber-200`
  }

  return (
    <div className={`${className} mb-3`} data-testid="relayer-status-banner">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        <div className="flex items-center">
          {message}
          {pendingInfo}
        </div>
        {statusInfo}
      </div>
      <button
        type="button"
        className="ml-4 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs uppercase tracking-wide text-current transition hover:bg-black/5"
        onClick={onDismiss}
        aria-label="Dismiss relayer status"
      >
        Dismiss
      </button>
    </div>
  )
}
