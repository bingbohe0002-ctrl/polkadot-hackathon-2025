import { describe, expect, it, vi } from 'vitest'

import { createLogger } from '../src/logger'

describe('createLogger', () => {
  it('emits structured info records', () => {
    const lines: string[] = []
    const logger = createLogger({
      context: { component: 'relayer' },
      infoWriter: (line) => lines.push(line),
      errorWriter: (line) => lines.push(line),
    })

    logger.info('boot', { retries: 3 })

    expect(lines).toHaveLength(1)
    const record = JSON.parse(lines[0])
    expect(record.level).toBe('info')
    expect(record.message).toBe('boot')
    expect(record.context).toEqual({ component: 'relayer' })
    expect(record.meta).toEqual({ retries: 3 })
    expect(typeof record.ts).toBe('string')
  })

  it('routes warn/error to error writer', () => {
    const infoWriter = vi.fn()
    const errorWriter = vi.fn()
    const logger = createLogger({ infoWriter, errorWriter })

    logger.warn('retry', { attempt: 2 })
    logger.error('fatal', { reason: 'boom' })

    expect(infoWriter).not.toHaveBeenCalled()
    expect(errorWriter).toHaveBeenCalledTimes(2)
    const warnRecord = JSON.parse(errorWriter.mock.calls[0][0])
    const errorRecord = JSON.parse(errorWriter.mock.calls[1][0])
    expect(warnRecord.level).toBe('warn')
    expect(errorRecord.level).toBe('error')
  })
})
