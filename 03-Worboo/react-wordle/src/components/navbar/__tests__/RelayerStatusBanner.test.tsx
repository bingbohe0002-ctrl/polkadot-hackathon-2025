import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import { RelayerStatusBanner } from '../RelayerStatusBanner'

describe('RelayerStatusBanner', () => {
  it('renders success notifications with amount and dismiss control', () => {
    const onDismiss = jest.fn()
    render(
      <RelayerStatusBanner
        notification={{
          kind: 'success',
          amount: '10',
          tokenSymbol: 'WBOO',
          txHash: '0xmint',
        }}
        pendingRewards={0}
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByText(/Relayer minted/)).toBeInTheDocument()
    expect(screen.getByText(/\+10 WBOO/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('renders pending warnings with outstanding count', () => {
    render(
      <RelayerStatusBanner
        notification={{
          kind: 'warning',
          message:
            'Reward pending—your submission is awaiting relayer confirmation.',
        }}
        pendingRewards={2}
        onDismiss={jest.fn()}
      />
    )

    expect(
      screen.getByText(
        /Reward pending—your submission is awaiting relayer confirmation./i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/2 pending rewards/i)).toBeInTheDocument()
  })

  it('is hidden when nothing to report', () => {
    const { container } = render(
      <RelayerStatusBanner
        notification={null}
        pendingRewards={0}
        onDismiss={jest.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
