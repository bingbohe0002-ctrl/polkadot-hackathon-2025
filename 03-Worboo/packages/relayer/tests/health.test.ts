import { mkdtempSync, rmSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import { ProcessedEventStore } from '../src/store'
import { RelayerMetrics } from '../src/metrics'
import { collectHealthSnapshot } from '../src/health'

const setup = () => {
  const dir = mkdtempSync(join(tmpdir(), 'worboo-health-'))
  const cachePath = resolve(dir, 'events.jsonl')
  const healthPath = resolve(dir, 'health.json')
  return { dir, cachePath, healthPath }
}

describe('collectHealthSnapshot', () => {
  let cachePath: string
  let healthPath: string
  let dir: string

  beforeEach(() => {
    const tmp = setup()
    dir = tmp.dir
    cachePath = tmp.cachePath
    healthPath = tmp.healthPath
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('includes metrics when available', async () => {
    const store = await ProcessedEventStore.open({ filePath: cachePath })
    await store.markProcessed('0xhash:0', { txHash: '0xmint' })

    const metrics = new RelayerMetrics({ healthPath })
    metrics.recordGameVictory()
    metrics.recordMintSuccess()
    await metrics.persist()

    const snapshot = await collectHealthSnapshot({
      store,
      metrics: metrics.snapshot(),
      healthPath,
    })

    expect(snapshot.processedEvents).toBe(1)
    expect(snapshot.queueDepth).toBe(0)
    expect(snapshot.totalMinted).toBe(1)
    expect(snapshot.status).toBe('idle')
    expect(snapshot.cachePath).toBe(cachePath)
    expect(snapshot.healthPath).toBe(healthPath)
  })

  it('falls back to unknown status when metrics missing', async () => {
    const store = await ProcessedEventStore.open({ filePath: cachePath })

    const snapshot = await collectHealthSnapshot({
      store,
      metrics: null,
      healthPath,
    })

    expect(snapshot.status).toBe('unknown')
    expect(snapshot.queueDepth).toBe(0)
  })
})
