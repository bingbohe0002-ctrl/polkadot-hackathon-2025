import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_HEALTH_URL = process.env.REACT_APP_RELAYER_HEALTH_URL

const resolveDefaultUrl = () => {
  if (DEFAULT_HEALTH_URL && DEFAULT_HEALTH_URL.trim().length > 0) {
    return DEFAULT_HEALTH_URL.trim()
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/healthz`
  }
  return ''
}

export type RelayerHealth = {
  status: string
  queueDepth: number
  totalMinted: number
  failureCount: number
  lastVictoryAt?: number
  lastMintAt?: number
  lastFailureAt?: number
  lastErrorMessage?: string
  timestamp?: number
}

type UseRelayerHealthOptions = {
  enabled?: boolean
  url?: string
  pollIntervalMs?: number
}

type RelayerHealthState = {
  health: RelayerHealth | null
  error?: string
  lastUpdated?: number
  isLoading: boolean
}

const toRelayerHealth = (input: any): RelayerHealth | null => {
  if (!input || typeof input !== 'object') return null
  const queueDepth = Number.parseInt(String(input.queueDepth ?? 0), 10)
  return {
    status: typeof input.status === 'string' ? input.status : 'unknown',
    queueDepth: Number.isNaN(queueDepth) ? 0 : queueDepth,
    totalMinted: Number.parseInt(String(input.totalMinted ?? 0), 10) || 0,
    failureCount: Number.parseInt(String(input.failureCount ?? 0), 10) || 0,
    lastVictoryAt: input.lastVictoryAt ? Number(input.lastVictoryAt) : undefined,
    lastMintAt: input.lastMintAt ? Number(input.lastMintAt) : undefined,
    lastFailureAt: input.lastFailureAt ? Number(input.lastFailureAt) : undefined,
    lastErrorMessage:
      typeof input.lastErrorMessage === 'string'
        ? input.lastErrorMessage
        : undefined,
    timestamp: input.timestamp ? Number(input.timestamp) : undefined,
  }
}

export const useRelayerHealth = ({
  enabled = true,
  url,
  pollIntervalMs = 15_000,
}: UseRelayerHealthOptions = {}): RelayerHealthState => {
  const targetUrl = useMemo(() => {
    const direct = url?.trim()
    if (direct && direct.length > 0) return direct
    return resolveDefaultUrl()
  }, [url])

  const [state, setState] = useState<RelayerHealthState>({
    health: null,
    isLoading: Boolean(targetUrl) && enabled,
  })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled || !targetUrl) {
      setState((prev) => ({ ...prev, isLoading: false, health: null }))
      return
    }

    let cancelled = false

    const fetchHealth = async () => {
      if (cancelled) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Health request failed (${response.status})`)
        }
        const json = await response.json()
        const health = toRelayerHealth(json)
        setState({
          health,
          isLoading: false,
          error: undefined,
          lastUpdated: Date.now(),
        })
      } catch (error) {
        if (controller.signal.aborted || cancelled) return
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to fetch health',
          lastUpdated: Date.now(),
        }))
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, pollIntervalMs)

    return () => {
      cancelled = true
      abortRef.current?.abort()
      clearInterval(interval)
    }
  }, [enabled, targetUrl, pollIntervalMs])

  return state
}
