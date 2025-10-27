import { createServer, IncomingMessage, ServerResponse } from 'http'
import { AddressInfo } from 'net'

import { ProcessedEventStore } from './store'
import { RelayerMetrics } from './metrics'
import { collectHealthSnapshot } from './health'
import { StructuredLogger } from './logger'

type HealthServerOptions = {
  store: ProcessedEventStore
  metrics: RelayerMetrics
  host: string
  port: number
  logger: StructuredLogger
}

export type HealthServer = {
  close: () => Promise<void>
  address: () => AddressInfo | null
}

export const startHealthServer = async ({
  store,
  metrics,
  host,
  port,
  logger,
}: HealthServerOptions): Promise<HealthServer> => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && req.url && req.url.startsWith('/healthz')) {
      try {
        const snapshot = await collectHealthSnapshot({
          store,
          metrics: metrics.snapshot(),
          healthPath: metrics.path,
        })
        const payload = JSON.stringify(snapshot)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.writeHead(200)
        res.end(`${payload}\n`)
        return
      } catch (error) {
        logger.error('[relayer] health endpoint failed', {
          error: error instanceof Error ? error.message : error,
        })
        res.writeHead(500)
        res.end('{"error":"health_unavailable"}\n')
        return
      }
    }

    res.writeHead(404)
    res.end('{"error":"not_found"}\n')
  })

  server.on('error', (error) => {
    logger.error('[relayer] health server error', {
      error: error instanceof Error ? error.message : error,
    })
  })

  server.on('clientError', (err, socket) => {
    logger.warn('[relayer] health server client error', {
      error: err instanceof Error ? err.message : err,
    })
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', (err) => reject(err))
    server.listen(port, host, () => resolve())
  })

  const addressInfo = server.address() as AddressInfo | null
  logger.info('[relayer] health server listening', {
    host: addressInfo?.address ?? host,
    port: addressInfo?.port ?? port,
  })

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      }),
    address: () => server.address() as AddressInfo | null,
  }
}
