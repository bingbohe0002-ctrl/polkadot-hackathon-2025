import { EventEmitter } from 'events'
import { act, render } from '@testing-library/react'
import React, { useEffect } from 'react'

import { useRelayerNotifications } from '../useRelayerNotifications'

jest.mock('ethers', () => ({
  ZeroAddress: '0x0000000000000000000000000000000000000000',
  formatUnits: () => '10',
}))

jest.mock('../../services/contracts', () => ({
  useWorbooContracts: jest.fn(() => ({
    registry: null,
    registryWrite: null,
    token: null,
    tokenWrite: null,
    shop: null,
    shopWrite: null,
    isReady: false,
  })),
}))

jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0xPlayer',
    isConnected: true,
  }),
}))

const { ZeroAddress } = require('ethers') as { ZeroAddress: string }

class MockContract extends EventEmitter {
  on(event: string, listener: (...args: any[]) => void): this {
    super.on(event, listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void): this {
    super.off(event, listener)
    return this
  }
}

describe('useRelayerNotifications', () => {
  const registry = new MockContract()
  const token = new MockContract()
  const refreshMock = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    registry.removeAllListeners()
    token.removeAllListeners()
    refreshMock.mockReset()

    const { useWorbooContracts } = require('../../services/contracts') as {
      useWorbooContracts: jest.Mock
    }
    useWorbooContracts.mockReturnValue({
      registry,
      registryWrite: null,
      token,
      tokenWrite: null,
      shop: null,
      shopWrite: null,
      isReady: true,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  const renderHook = () => {
    const values: any[] = []

    const TestComponent = () => {
      const value = useRelayerNotifications({
        tokenSymbol: 'WBOO',
        onRewardAcknowledged: refreshMock,
      })
      useEffect(() => {
        values.push(value)
      }, [value])
      return null
    }

    render(<TestComponent />)
    return values
  }

  it('emits a success notification when a mint is observed', async () => {
    const values = renderHook()

    act(() => {
      registry.emit(
        'GameRecorded',
        '0xPlayer',
        1n,
        '0xhash',
        3,
        true,
        1n,
        10n,
        5n,
        { transactionHash: '0xgame', logIndex: 0 }
      )
    })

    act(() => {
      token.emit(
        'Transfer',
        ZeroAddress,
        '0xplayer',
        BigInt('10000000000000000000'),
        { transactionHash: '0xmint' }
      )
    })

    const latest = values.at(-1)
    expect(latest.notification?.kind).toBe('success')
    expect(latest.notification?.amount).toBe('10')
    expect(latest.notification?.tokenSymbol).toBe('WBOO')
    expect(latest.pendingRewards).toBe(0)
  })

  it('emits a warning if a mint does not arrive soon enough', async () => {
    const values = renderHook()

    act(() => {
      registry.emit(
        'GameRecorded',
        '0xPlayer',
        1n,
        '0xhash',
        3,
        true,
        1n,
        10n,
        5n,
        { transactionHash: '0xgame', logIndex: 0 }
      )
    })

    await act(async () => {
      jest.advanceTimersByTime(45_000)
    })

    const latest = values.at(-1)
    expect(latest.notification?.kind).toBe('warning')
    expect(latest.notification?.message).toMatch(/pending/)
    expect(latest.pendingRewards).toBeGreaterThan(0)
  })
})
