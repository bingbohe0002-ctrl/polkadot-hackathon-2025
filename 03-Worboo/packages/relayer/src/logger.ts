import { appendFile, mkdir, rename, stat, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { dirname } from "path";

type LogLevel = 'info' | 'warn' | 'error'

export type StructuredLogger = {
  info: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
}

type LoggerOptions = {
  context?: Record<string, unknown>
  infoWriter?: (line: string) => void
  errorWriter?: (line: string) => void
  filePath?: string
  maxBytes?: number
  backups?: number
}

const createRecord = (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  meta?: Record<string, unknown>
) => ({
  ts: new Date().toISOString(),
  level,
  message,
  ...(context ? { context } : {}),
  ...(meta ? { meta } : {}),
})

class FileAppender {
  private readonly filePath: string
  private readonly maxBytes: number
  private readonly backups: number
  private writing = Promise.resolve()
  private currentSize = 0
  private initialised = false

  constructor(filePath: string, maxBytes: number, backups: number) {
    this.filePath = filePath
    this.maxBytes = maxBytes
    this.backups = backups
  }

  private async ensureFile(): Promise<void> {
    if (this.initialised) return
    const dir = dirname(this.filePath)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
    if (existsSync(this.filePath)) {
      const stats = await stat(this.filePath)
      this.currentSize = stats.size
    } else {
      await writeFile(this.filePath, '', { encoding: 'utf-8' })
      this.currentSize = 0
    }
    this.initialised = true
  }

  async write(line: string): Promise<void> {
    this.writing = this.writing.then(async () => {
      await this.ensureFile()
      const entry = `${line}\n`
      await appendFile(this.filePath, entry, { encoding: 'utf-8' })
      this.currentSize += Buffer.byteLength(entry)
      if (this.currentSize >= this.maxBytes) {
        await this.rotate()
      }
    })
    return this.writing
  }

  private async rotate(): Promise<void> {
    await this.ensureFile()
    for (let index = this.backups; index >= 1; index -= 1) {
      const source = index === 1 ? this.filePath : `${this.filePath}.${index - 1}`
      const destination = `${this.filePath}.${index}`
      if (existsSync(source)) {
        await rename(source, destination)
      }
    }
    await writeFile(this.filePath, '', { encoding: 'utf-8' })
    this.currentSize = 0
  }
}

export const createLogger = ({
  context,
  infoWriter,
  errorWriter,
  filePath,
  maxBytes = 5 * 1024 * 1024,
  backups = 5,
}: LoggerOptions = {}): StructuredLogger => {
  const writeInfo = infoWriter ?? ((line: string) => console.log(line))
  const writeError = errorWriter ?? ((line: string) => console.error(line))
  const fileAppender = filePath ? new FileAppender(filePath, maxBytes, backups) : undefined

  const write = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const record = JSON.stringify(createRecord(level, message, context, meta))
    if (level === 'error') {
      writeError(record)
    } else if (level === 'warn') {
      writeError(record)
    } else {
      writeInfo(record)
    }
    if (fileAppender) {
      void fileAppender.write(record).catch((error) => {
        writeError(
          JSON.stringify(
            createRecord('error', '[relayer] failed to write log file', context, {
              error: error instanceof Error ? error.message : error,
            })
          )
        )
      })
    }
  }

  return {
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  }
}

