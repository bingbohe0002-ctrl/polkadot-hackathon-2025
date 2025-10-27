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

export const createLogger = ({
  context,
  infoWriter,
  errorWriter,
}: LoggerOptions = {}): StructuredLogger => {
  const writeInfo = infoWriter ?? ((line: string) => console.log(line))
  const writeError = errorWriter ?? ((line: string) => console.error(line))

  const write = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const record = JSON.stringify(createRecord(level, message, context, meta))
    if (level === 'error') {
      writeError(record)
    } else if (level === 'warn') {
      writeError(record)
    } else {
      writeInfo(record)
    }
  }

  return {
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  }
}
