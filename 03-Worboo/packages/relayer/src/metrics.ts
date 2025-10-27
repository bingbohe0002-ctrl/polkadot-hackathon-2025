import { writeFile, mkdir, readFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { existsSync } from 'fs'

export type RelayerMetricsSnapshot = {
  queueDepth: number
  totalMinted: number
  failureCount: number
  lastVictoryAt?: number
  lastMintAt?: number
  lastFailureAt?: number
  lastErrorMessage?: string
  updatedAt: number
  status: 'idle' | 'processing' | 'degraded'
}

type RelayerMetricsOptions = {
  healthPath?: string
}

const computeStatus = (state: RelayerMetricsSnapshot): RelayerMetricsSnapshot['status'] => {
  if (state.failureCount > 0 && state.queueDepth > 0) {
    return 'degraded'
  }
  if (state.queueDepth > 0) {
    return 'processing'
  }
  return 'idle'
}

export class RelayerMetrics {
  private readonly healthPath?: string
  private state: RelayerMetricsSnapshot = {
    queueDepth: 0,
    totalMinted: 0,
    failureCount: 0,
    updatedAt: Date.now(),
    status: 'idle',
  }

  constructor(options: RelayerMetricsOptions = {}) {
    this.healthPath = options.healthPath
  }

  get path(): string | undefined {
    return this.healthPath
  }

  recordGameVictory(): void {
    this.state.queueDepth += 1
    this.state.lastVictoryAt = Date.now()
    this.touch()
  }

  recordMintSuccess(): void {
    this.state.queueDepth = Math.max(this.state.queueDepth - 1, 0)
    this.state.totalMinted += 1
    this.state.lastMintAt = Date.now()
    this.touch()
  }

  recordMintFailure(error?: unknown): void {
    this.state.failureCount += 1
    this.state.lastFailureAt = Date.now()
    if (error instanceof Error) {
      this.state.lastErrorMessage = error.message
    } else if (typeof error === 'string') {
      this.state.lastErrorMessage = error
    } else if (error) {
      this.state.lastErrorMessage = JSON.stringify(error)
    }
    this.touch()
  }

  snapshot(): RelayerMetricsSnapshot {
    return { ...this.state }
  }

  async persist(): Promise<void> {
    if (!this.healthPath) return
    const directory = dirname(this.healthPath)
    if (!existsSync(directory)) {
      await mkdir(directory, { recursive: true })
    }
    await writeFile(
      this.healthPath,
      JSON.stringify(this.state, null, 2),
      'utf-8'
    )
  }

  private touch(): void {
    this.state.updatedAt = Date.now()
    this.state.status = computeStatus(this.state)
    void this.persist()
  }

  static async loadFromFile(
    healthPath?: string
  ): Promise<RelayerMetricsSnapshot | null> {
    if (!healthPath) return null
    if (!existsSync(healthPath)) {
      return null
    }
    try {
      const raw = await readFile(healthPath, 'utf-8')
      const parsed = JSON.parse(raw) as RelayerMetricsSnapshot
      return {
        ...parsed,
        status: computeStatus(parsed),
      }
    } catch {
      return null
    }
  }

  static resolveDefaultPath(provided?: string): string {
    if (provided) return provided
    return resolve(process.cwd(), '.cache', 'health.json')
  }
}
