// src/utils/logger.ts
import pino from 'pino';
import chalk from 'chalk';

/**
 * Color-coded emoji logger with trader-style tone.
 * Replaces boring console logs with clean, emotional trade vibes.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: undefined,
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            ignore: 'pid,hostname',
            messageFormat(log, messageKey) {
              const level = log.level;
              const msg = log[messageKey];
              let emoji = '⚪';
              let color = chalk.white;

              switch (level) {
                case 10: // trace
                case 20: // debug
                  emoji = '🔍';
                  color = chalk.gray;
                  break;
                case 30: // info
                  emoji = '🟢';
                  color = chalk.greenBright;
                  break;
                case 40: // warn
                  emoji = '🟡';
                  color = chalk.yellowBright;
                  break;
                case 50: // error
                  emoji = '🔴';
                  color = chalk.redBright;
                  break;
                case 60: // fatal
                  emoji = '💀';
                  color = chalk.bgRed.white.bold;
                  break;
              }

              return `${emoji} ${color(msg)}`;
            },
          },
        }
      : undefined,
});

/**
 * Shortcut wrappers to match trader lingo
 */
export const tradeLog = {
  info: (msg: string) => logger.info(msg),
  success: (msg: string) => logger.info(`✅ ${msg}`),
  warn: (msg: string) => logger.warn(`⚠️ ${msg}`),
  error: (msg: string) => logger.error(`❌ ${msg}`),
  pulse: (pair: string, price: number) =>
    logger.info(`📊 ${pair} @ $${price.toLocaleString()}`),
};
