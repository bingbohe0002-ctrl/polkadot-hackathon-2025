import { mkdtempSync, rmSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import { RelayerMetrics } from '../src/metrics'

const createTempPath = () => {
  const dir = mkdtempSync(join(tmpdir(), 'worboo-metrics-'))
  const path = resolve(dir, 'health.json')
  return { dir, path }
}

describe('RelayerMetrics', () => {
  let tempDir: string
  let healthPath: string

  beforeEach(() => {
    const tmp = createTempPath()
    tempDir = tmp.dir
    healthPath = tmp.path
  })

  afterEach(() => {
    rmSync(tempDir, { force: true, recursive: true })
  })

  it('tracks queue depth and persists to disk', async () => {
    const metrics = new RelayerMetrics({ healthPath })
    metrics.recordGameVictory()
    metrics.recordGameVictory()
    metrics.recordMintFailure(new Error('network hiccup'))
    metrics.recordMintSuccess()
    await metrics.persist()

    const snapshot = metrics.snapshot()
    expect(snapshot.queueDepth).toBe(1)
    expect(snapshot.totalMinted).toBe(1)
    expect(snapshot.failureCount).toBeGreaterThanOrEqual(1)
    expect(snapshot.status).toBe('degraded')
    expect(snapshot.lastVictoryAt).toBeDefined()
    expect(snapshot.lastMintAt).toBeDefined()
    expect(snapshot.lastFailureAt).toBeDefined()
    expect(metrics.path).toBe(healthPath)

    const loaded = await RelayerMetrics.loadFromFile(healthPath)
    expect(loaded?.queueDepth).toBe(1)
    expect(loaded?.status).toBe('degraded')
  })

  it('returns null when file missing', async () => {
    const missing = await RelayerMetrics.loadFromFile(resolve(tempDir, 'missing.json'))
    expect(missing).toBeNull()
  })
})
