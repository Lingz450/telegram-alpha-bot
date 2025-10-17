// src/index.ts
import 'dotenv/config';
import { Telegraf } from 'telegraf';
import pino from 'pino';

import { loadConfig } from './config';
import registerCommands from './commands';
import { startAlertLoop } from './jobs/alertWorker';
import { startTop100RefreshLoop } from './jobs/refreshTop100Worker';
import { registerPulse } from './commands/pulse';       // ✅ correct path
import { startMarketPulseLoop } from './jobs/marketPulse';

// ---------------- helpers ----------------
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

  // --- Optional proxy bootstrap (helps if exchange APIs are blocked) ---
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

  // --- Init bot ---
  const bot = new Telegraf(cfg.TELEGRAM_BOT_TOKEN);

  // --- Error handler ---
  bot.catch((err, ctx) => {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ err: msg, update: ctx.update }, 'telegraf error');
  });

  // --- Register commands & core background workers ---
  registerCommands(bot, cfg, log);
  startTop100RefreshLoop(cfg, log);
  startAlertLoop(bot, cfg, log);
  registerPulse(bot, cfg, log);              // one-off /pulse command
  startMarketPulseLoop(bot, cfg, log);       // periodic market pulse messages

  // --- Optional features (auto-detected; safe if missing) ---
  const freeChat = await importOptional<{ enableFreeChat: Function }>('./chat/freeTalk');
  if (freeChat?.enableFreeChat) {
    freeChat.enableFreeChat(bot, cfg, log);
  }

  const coinCmd = await importOptional<{ registerCoin: Function }>('./commands/coin');
  if (coinCmd?.registerCoin) {
    coinCmd.registerCoin(bot, cfg, log);
  }

  const autoAlpha = await importOptional<{ startAutoAlpha: Function }>('./jobs/autoAlpha');
  if (autoAlpha?.startAutoAlpha) {
    autoAlpha.startAutoAlpha(bot, cfg, log);
  }

  const volatility = await importOptional<{ startVolatility: Function }>('./jobs/volatility');
  if (volatility?.startVolatility) {
    volatility.startVolatility(bot, cfg, log);
  }

  // --- Log bot identity ---
  try {
    const me = await bot.telegram.getMe();
    log.info({ id: me.id, username: me.username, name: me.first_name }, 'bot identity');
  } catch (e) {
    log.warn({ err: (e as Error).message }, 'could not fetch bot identity');
  }

  // --- Launch ---
  await bot.launch();
  log.info('🚀 UnknownAI online and trading vibes enabled');

  // --- Graceful shutdown ---
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutting down gracefully');
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

  // --- Global error safety ---
  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    log.error({ err: err.message, stack: err.stack }, 'uncaughtException');
  });
}

// --- Entry ---
main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('💥 Fatal startup error', e);
  process.exit(1);
});
