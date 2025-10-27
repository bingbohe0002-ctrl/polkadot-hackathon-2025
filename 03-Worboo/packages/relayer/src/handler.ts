import type { ContractTransactionResponse } from 'ethers'
import { ProcessedEventStore } from './store'

type Logger = (message: string, meta?: Record<string, unknown>) => void

type GameRecordedArgs = {
  player: string
  dayId: bigint
  wordHash: string
  guesses: number
  victory: boolean
  streak: bigint
  totalGames: bigint
  totalWins: bigint
}

type GameRecordedEvent = {
  transactionHash: string
  logIndex: number
}

type HandlerDependencies = {
  store: ProcessedEventStore
  token: { mintTo: (player: string, amount: bigint) => Promise<ContractTransactionResponse> }
  rewardPerWin: bigint
  maxRetries: number
  backoffMs: number
  logger?: Logger
}

const DEFAULT_FACTOR = 3

const delay = (ms: number) =>
  new Promise((resolve) => {
    if (ms <= 0) {
      resolve(null)
      return
    }
    setTimeout(resolve, ms)
  })

export const createGameRecordedHandler =
  ({
    store,
    token,
    rewardPerWin,
    maxRetries,
    backoffMs,
    logger = () => undefined,
  }: HandlerDependencies) =>
  async (args: GameRecordedArgs, event: GameRecordedEvent): Promise<void> => {
    if (!args.victory) {
      logger('[relayer] skipping (loss)', { player: args.player })
      return
    }

    const key = `${event.transactionHash}:${event.logIndex}`
    if (store.hasProcessed(key)) {
      logger('[relayer] skipping already processed event', {
        key,
        player: args.player,
      })
      return
    }

    const streakValue =
      typeof args.streak === 'bigint' ? args.streak : BigInt(args.streak ?? 0)
    const totalWinsValue =
      typeof args.totalWins === 'bigint'
        ? args.totalWins
        : BigInt(args.totalWins ?? 0)

    let attempt = 0
    let lastError: unknown = null

    while (attempt < maxRetries) {
      attempt += 1
      try {
        logger('[relayer] minting reward', {
          player: args.player,
          streak: streakValue.toString(),
          attempt,
        })
        const tx = await token.mintTo(args.player, rewardPerWin)
        logger('[relayer] mint transaction submitted', {
          key,
          txHash: tx.hash,
        })
        await tx.wait()
        await store.markProcessed(key, { txHash: tx.hash })
        logger('[relayer] reward confirmed', { key, txHash: tx.hash })
        return
      } catch (error) {
        lastError = error
        logger('[relayer] mint failed, retrying mint', {
          key,
          attempt,
          error: error instanceof Error ? error.message : serializeError(error),
        })

        if (attempt >= maxRetries) {
          break
        }

        const delayMs = backoffMs * DEFAULT_FACTOR ** (attempt - 1)
        await delay(delayMs)
      }
    }

    logger('[relayer] mint failed permanently', {
      key,
      error:
        lastError instanceof Error ? lastError.message : serializeError(lastError),
    })
  }

const serializeError = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : JSON.stringify(value ?? {})
