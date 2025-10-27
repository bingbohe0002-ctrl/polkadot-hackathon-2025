import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGameRecordedHandler } from '../src/handler'
import { ProcessedEventStore } from '../src/store'

type MockStore = Pick<
  ProcessedEventStore,
  'hasProcessed' | 'markProcessed'
> & { size?: number }

const createMockStore = (): MockStore => ({
  hasProcessed: vi.fn(),
  markProcessed: vi.fn().mockResolvedValue(undefined),
})

const createEvent = (overrides?: Partial<{ transactionHash: string; logIndex: number }>) => ({
  transactionHash: '0xtx',
  logIndex: 1,
  ...overrides,
})

describe('createGameRecordedHandler', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('skips tokens that were already processed', async () => {
    const store = createMockStore()
    store.hasProcessed.mockReturnValue(true)

    const token = {
      mintTo: vi.fn(),
    }

    const handler = createGameRecordedHandler({
      rewardPerWin: 10n,
      store,
      token: token as any,
      maxRetries: 1,
      backoffMs: 0,
      logger: vi.fn(),
    })

    await handler(
      {
        player: '0xplayer',
        victory: true,
      } as any,
      createEvent()
    )

    expect(token.mintTo).not.toHaveBeenCalled()
    expect(store.markProcessed).not.toHaveBeenCalled()
  })

  it('mints rewards and records processed events', async () => {
    const store = createMockStore()
    store.hasProcessed.mockReturnValue(false)

    const waitMock = vi.fn().mockResolvedValue({ blockNumber: 99 })
    const token = {
      mintTo: vi.fn().mockResolvedValue({ hash: '0xmint', wait: waitMock }),
    }

    const handler = createGameRecordedHandler({
      rewardPerWin: 10n,
      store,
      token: token as any,
      maxRetries: 1,
      backoffMs: 0,
      logger: vi.fn(),
    })

    await handler(
      {
        player: '0xplayer',
        victory: true,
      } as any,
      createEvent({ transactionHash: '0xabc', logIndex: 2 })
    )

    expect(token.mintTo).toHaveBeenCalledWith('0xplayer', 10n)
    expect(waitMock).toHaveBeenCalled()
    expect(store.markProcessed).toHaveBeenCalledWith('0xabc:2', {
      txHash: '0xmint',
    })
  })

  it('retries failed mints with backoff and only records success once', async () => {
    vi.useFakeTimers()

    const store = createMockStore()
    store.hasProcessed.mockReturnValue(false)

    const waitMock = vi.fn().mockResolvedValue({ blockNumber: 42 })
    const token = {
      mintTo: vi
        .fn()
        .mockRejectedValueOnce(new Error('temporary error'))
        .mockRejectedValueOnce(new Error('still bad'))
        .mockResolvedValue({ hash: '0xok', wait: waitMock }),
    }

    const logger = vi.fn()

    const handler = createGameRecordedHandler({
      rewardPerWin: 5n,
      store,
      token: token as any,
      maxRetries: 3,
      backoffMs: 1000,
      logger,
    })

    const promise = handler(
      {
        player: '0xplayer',
        victory: true,
      } as any,
      createEvent({ transactionHash: '0xe', logIndex: 7 })
    )

    await vi.advanceTimersByTimeAsync(1_000)
    await vi.advanceTimersByTimeAsync(3_000)
    await promise

    expect(token.mintTo).toHaveBeenCalledTimes(3)
    expect(store.markProcessed).toHaveBeenCalledTimes(1)
    expect(store.markProcessed).toHaveBeenCalledWith('0xe:7', {
      txHash: '0xok',
    })
    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining('retrying mint'),
      expect.objectContaining({ attempt: 2 })
    )
  })
})
