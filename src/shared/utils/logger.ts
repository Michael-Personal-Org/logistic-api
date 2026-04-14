import winston from 'winston'
import { env } from '@/shared/config/env'

const { combine, timestamp, json, colorize, printf } = winston.format

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  return `${ts} [${level}]: ${message} ${metaStr}`
})

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  transports: [
    new winston.transports.Console({
      format:
        env.NODE_ENV === 'development'
          ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat)
          : combine(timestamp(), json()),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})
