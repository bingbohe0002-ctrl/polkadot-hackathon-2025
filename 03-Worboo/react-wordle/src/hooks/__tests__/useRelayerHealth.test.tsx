import { act, render, screen } from '@testing-library/react'
import React from 'react'

import { useRelayerHealth } from '../useRelayerHealth'

const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: jest.fn().mockResolvedValue(response),
  }) as unknown as typeof fetch
}

const TestComponent = ({ url, enabled }: { url?: string; enabled?: boolean }) => {
  const state = useRelayerHealth({ url, enabled })
  return (
    <div>
      <span data-testid="status">{state.health?.status ?? 'none'}</span>
      <span data-testid="queue">{state.health?.queueDepth ?? 0}</span>
      {state.error && <span data-testid="error">{state.error}</span>}
    </div>
  )
}

describe('useRelayerHealth', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockFetch({
      status: 'idle',
      queueDepth: 0,
      totalMinted: 3,
      failureCount: 0,
      timestamp: 123,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  it('fetches health immediately and on interval', async () => {
    render(<TestComponent url="http://test" />)

    await act(async () => {
      await jest.advanceTimersByTime(0)
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('status').textContent).toBe('idle')
    expect(screen.getByTestId('queue').textContent).toBe('0')

    await act(async () => {
      await jest.advanceTimersByTime(15_000)
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('reports error when request fails', async () => {
    mockFetch({}, false)

    render(<TestComponent url="http://test" />)

    await act(async () => {
      await jest.advanceTimersByTime(0)
    })

    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('does nothing when disabled', async () => {
    render(<TestComponent url="http://test" enabled={false} />)

    await act(async () => {
      await jest.advanceTimersByTime(20_000)
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
