import { config as loadEnv } from 'dotenv'

import { ProcessedEventStore } from './store'
import { RelayerMetrics, RelayerMetricsSnapshot } from './metrics'
import { collectHealthSnapshot } from './health'

loadEnv()

async function main() {
  const cachePath = process.env.RELAYER_CACHE_PATH?.trim()
  const healthPath = RelayerMetrics.resolveDefaultPath(process.env.RELAYER_HEALTH_PATH?.trim())
  const store = await ProcessedEventStore.open({ filePath: cachePath })

  let metricsSnapshot: RelayerMetricsSnapshot | null = null
  metricsSnapshot = await RelayerMetrics.loadFromFile(healthPath)

  const snapshot = await collectHealthSnapshot({
    store,
    metrics: metricsSnapshot,
    healthPath,
  })

  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`)
}

main().catch((error) => {
  console.error('[relayer] status command failed', error)
  process.exit(1)
})
