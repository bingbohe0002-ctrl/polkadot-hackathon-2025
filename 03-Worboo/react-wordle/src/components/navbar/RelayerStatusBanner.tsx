import React from 'react'

import { RelayerNotification } from '../../hooks/useRelayerNotifications'

type Props = {
  notification: RelayerNotification | null
  pendingRewards: number
  onDismiss: () => void
}

const bannerBase =
  'flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium shadow-md'

export const RelayerStatusBanner: React.FC<Props> = ({
  notification,
  pendingRewards,
  onDismiss,
}) => {
  if (!notification && pendingRewards === 0) {
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
  } else if (!notification) {
    message = (
      <span>
        {pendingRewards} pending rewards queued. The relayer will mint them shortly.
      </span>
    )
    className = `${bannerBase} bg-blue-50 text-blue-900 border border-blue-200`
  }

  const pendingInfo =
    pendingRewards > 0 ? (
      <span className="ml-4 text-xs font-normal text-gray-600 dark:text-gray-300">
        {pendingRewards} pending rewards
      </span>
    ) : null

  return (
    <div
      className={`${className} mb-3`}
      data-testid="relayer-status-banner"
    >
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        {message}
        {pendingInfo}
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
