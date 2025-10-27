import { Wallet, Contract, JsonRpcProvider } from 'ethers'
import { loadConfig } from './config'
import registryArtifact from '../../contracts/artifacts/contracts/WorbooRegistry.sol/WorbooRegistry.json'
import tokenArtifact from '../../contracts/artifacts/contracts/WorbooToken.sol/WorbooToken.json'
import { ProcessedEventStore } from './store'
import { createGameRecordedHandler } from './handler'

type GameRecordedEvent = {
  player: string
  dayId: bigint
  wordHash: string
  guesses: number
  victory: boolean
  streak: bigint
  totalGames: bigint
  totalWins: bigint
}

async function main() {
  const cfg = loadConfig()

  const provider = new JsonRpcProvider(cfg.rpcUrl)
  const wallet = new Wallet(cfg.privateKey, provider)

  const registry = new Contract(
    cfg.registryAddress,
    registryArtifact.abi,
    provider
  )
  const token = new Contract(
    cfg.tokenAddress,
    tokenArtifact.abi,
    wallet
  )

  const store = await ProcessedEventStore.open({ filePath: cfg.cachePath })
  const handler = createGameRecordedHandler({
    rewardPerWin: cfg.rewardPerWin,
    store,
    token: token as any,
    maxRetries: cfg.maxRetries,
    backoffMs: cfg.backoffMs,
    logger: (message, meta) => {
      if (meta) {
        console.log(message, meta)
      } else {
        console.log(message)
      }
    },
  })

  console.log('[relayer] starting Worboo reward listener')
  console.log(` - registry: ${cfg.registryAddress}`)
  console.log(` - token:    ${cfg.tokenAddress}`)
  console.log(` - reward:   ${cfg.rewardPerWin.toString()} wei`)
  console.log(` - operator: ${wallet.address}`)
  console.log(` - retries:  ${cfg.maxRetries} (backoff ${cfg.backoffMs}ms)`)
  console.log(` - cache:    ${store.path}`)

  registry.on(
    'GameRecorded',
    async (
      player: string,
      dayId: bigint,
      wordHash: string,
      guesses: number,
      victory: boolean,
      streak: bigint,
      totalGames: bigint,
      totalWins: bigint,
      event
    ) => {
      const payload: GameRecordedEvent = {
        player,
        dayId,
        wordHash,
        guesses,
        victory,
        streak,
        totalGames,
        totalWins,
      }

      console.log('[relayer] GameRecorded received', {
        player,
        victory,
        streak: streak.toString(),
        totalWins: totalWins.toString(),
      })

      await handler(payload as any, {
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
      })
    }
  )

  process.on('SIGINT', () => {
    console.log('Shutting down relayer...')
    registry.removeAllListeners()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('[relayer] fatal error', error)
  process.exit(1)
})
