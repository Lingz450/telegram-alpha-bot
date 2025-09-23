// src/index.ts
import 'dotenv/config';
import { Telegraf } from 'telegraf';
import pino from 'pino';

import { loadConfig } from './config';
import registerCommands from './commands';
import { startAlertLoop } from './jobs/alertWorker';
import { startTop100RefreshLoop } from './jobs/refreshTop100Worker';

async function main() {
  const log = pino({
    level: process.env.LOG_LEVEL || 'info',
    messageKey: 'msg',
    base: undefined,
  });

  // --- Optional proxy bootstrap (helps if exchange APIs are blocked) ---
  // Set HTTPS_PROXY / HTTP_PROXY / ALL_PROXY in .env to activate.
  try {
    const proxy =
      process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.HTTP_PROXY;
    if (proxy) {
      // No hard dependency: only used if available.
      const { setGlobalDispatcher, ProxyAgent } = await import('undici');
      setGlobalDispatcher(new ProxyAgent(proxy));
      log.info({ proxy }, 'proxy configured for outbound HTTP(S)');
    }
  } catch {
    // undici not installed; ignore and continue
    if (process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.HTTP_PROXY) {
      log.warn('undici not installed; proxy env will be ignored');
    }
  }

  const cfg = loadConfig();

  if (!cfg.TELEGRAM_BOT_TOKEN) {
    log.error('TELEGRAM_BOT_TOKEN missing in .env');
    process.exit(1);
  }

  const bot = new Telegraf(cfg.TELEGRAM_BOT_TOKEN);

  // Centralized bot error capture (avoid silent failures)
  bot.catch((err, ctx) => {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ err: msg, update: ctx.update }, 'telegraf error');
  });

  // Register all commands
  registerCommands(bot, cfg, log);

  // Start background loops
  startTop100RefreshLoop(cfg, log);
  startAlertLoop(bot, cfg, log);

  // Helpful identity log
  try {
    const me = await bot.telegram.getMe();
    log.info({ id: me.id, username: me.username, name: me.first_name }, 'bot identity');
  } catch (e) {
    log.warn({ err: (e as Error).message }, 'could not fetch bot identity');
  }

  // Launch long polling
  await bot.launch();
  log.info('telegram bot up');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutting down');
    try {
      await bot.stop(signal);
    } catch (e) {
      log.warn({ err: (e as Error).message }, 'error during bot.stop');
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  // Catch unhandled errors to avoid hard crashes
  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    log.error({ err: err.message, stack: err.stack }, 'uncaughtException');
  });
}

main().catch((e) => {
  // final safety net
  // eslint-disable-next-line no-console
  console.error('fatal startup error', e);
  process.exit(1);
});
