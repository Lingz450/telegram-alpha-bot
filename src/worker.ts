// src/worker.ts
// Railway Worker: Background jobs only (no command handlers, no polling)
// This runs alongside the Netlify webhook to handle persistent tasks

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import pino from 'pino';

import { loadConfig } from './config';
import { startAlertLoop } from './jobs/alertWorker';
import { startTop100RefreshLoop } from './jobs/refreshTop100Worker';
import { startMarketPulseLoop } from './jobs/marketPulse';

// ---------------- Optional imports ----------------
async function importOptional<T = any>(path: string): Promise<T | null> {
  try {
    // @ts-ignore — dynamic import for optional modules
    const mod = await import(path);
    return (mod?.default ?? mod) as T;
  } catch {
    return null;
  }
}

async function main() {
  // --- Logger ---
  const log = pino({
    level: process.env.LOG_LEVEL || 'info',
    messageKey: 'msg',
    base: undefined,
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });

  log.info('🔧 Starting Railway Worker (background jobs only)');

  // --- Optional proxy bootstrap ---
  try {
    const proxy =
      process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.HTTP_PROXY;
    if (proxy) {
      const { setGlobalDispatcher, ProxyAgent } = await import('undici');
      setGlobalDispatcher(new ProxyAgent(proxy));
      log.info({ proxy }, 'proxy configured for outbound HTTP(S)');
    }
  } catch {
    if (process.env.HTTPS_PROXY || process.env.ALL_PROXY || process.env.HTTP_PROXY) {
      log.warn('undici not installed; proxy env will be ignored');
    }
  }

  // --- Load config ---
  const cfg = loadConfig();
  if (!cfg.TELEGRAM_BOT_TOKEN) {
    log.error('TELEGRAM_BOT_TOKEN missing in .env');
    process.exit(1);
  }

  // --- Init bot (for sending messages only, NO polling/webhook) ---
  const bot = new Telegraf(cfg.TELEGRAM_BOT_TOKEN);

  // Error handler
  bot.catch((err, ctx) => {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ err: msg, update: ctx.update }, 'telegraf error');
  });

  // --- Log bot identity ---
  try {
    const me = await bot.telegram.getMe();
    log.info({ id: me.id, username: me.username, name: me.first_name }, 'bot identity');
  } catch (e) {
    log.warn({ err: (e as Error).message }, 'could not fetch bot identity');
  }

  // --- Start background workers (NO bot.launch()) ---
  log.info('🚀 Starting background jobs...');

  // Core jobs
  startTop100RefreshLoop(cfg, log);
  startAlertLoop(bot, cfg, log);
  startMarketPulseLoop(bot, cfg, log);

  // Optional jobs
  const autoAlpha = await importOptional<{ startAutoAlpha: Function }>('./jobs/autoAlpha');
  if (autoAlpha?.startAutoAlpha) {
    autoAlpha.startAutoAlpha(bot, cfg, log);
    log.info('✅ Auto Alpha job started');
  }

  const volatility = await importOptional<{ startVolatility: Function }>('./jobs/volatility');
  if (volatility?.startVolatility) {
    volatility.startVolatility(bot, cfg, log);
    log.info('✅ Volatility job started');
  }

  log.info('✅ All background jobs running');
  log.info('💡 Worker does NOT handle user messages (Netlify webhook does that)');

  // --- Graceful shutdown ---
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutting down worker gracefully');
    try {
      // No bot.stop() needed since we never called bot.launch()
      log.info('worker stopped');
    } catch (e) {
      log.warn({ err: (e as Error).message }, 'error during shutdown');
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  // --- Global error safety ---
  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    log.error({ err: err.message, stack: err.stack }, 'uncaughtException');
  });

  // Keep process alive
  setInterval(() => {
    log.debug('worker heartbeat');
  }, 60000); // every minute
}

// --- Entry ---
main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('💥 Fatal worker startup error', e);
  process.exit(1);
});

