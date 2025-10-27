import { stat } from 'fs/promises'
import { existsSync } from 'fs'

import { ProcessedEventStore } from './store'
import { RelayerMetricsSnapshot } from './metrics'

export type RelayerHealthSnapshot = {
  timestamp: number
  status: string
  queueDepth: number
  totalMinted: number
  failureCount: number
  lastVictoryAt?: number
  lastMintAt?: number
  lastFailureAt?: number
  lastErrorMessage?: string
  processedEvents: number
  cachePath: string
  cacheBytes?: number
  metricsUpdatedAt?: number
}

export const collectHealthSnapshot = async ({
  store,
  metrics,
  healthPath,
}: {
  store: ProcessedEventStore
  metrics: RelayerMetricsSnapshot | null
  healthPath?: string
}): Promise<RelayerHealthSnapshot> => {
  const cachePath = store.path

  let cacheBytes: number | undefined
  if (existsSync(cachePath)) {
    try {
      const stats = await stat(cachePath)
      cacheBytes = stats.size
    } catch {
      cacheBytes = undefined
    }
  }

  if (metrics) {
    return {
      timestamp: Date.now(),
      status: metrics.status,
      queueDepth: metrics.queueDepth,
      totalMinted: metrics.totalMinted,
      failureCount: metrics.failureCount,
      lastVictoryAt: metrics.lastVictoryAt,
      lastMintAt: metrics.lastMintAt,
      lastFailureAt: metrics.lastFailureAt,
      lastErrorMessage: metrics.lastErrorMessage,
      processedEvents: store.size,
      cachePath,
      cacheBytes,
      metricsUpdatedAt: metrics.updatedAt,
      ...(healthPath ? { healthPath } : {}),
    }
  }

  return {
    timestamp: Date.now(),
    status: 'unknown',
    queueDepth: 0,
    totalMinted: 0,
    failureCount: 0,
    processedEvents: store.size,
    cachePath,
    cacheBytes,
    ...(healthPath ? { healthPath } : {}),
  }
}
