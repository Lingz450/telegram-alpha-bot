// Netlify Function: Telegram webhook handler
// Converts the bot to webhook mode for serverless environments like Netlify.
// - Do NOT call bot.launch() in serverless.
// - Register commands and handle each update via bot.handleUpdate.

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import pino from 'pino';

import { loadConfig } from '../../src/config';
import registerCommands from '../../src/commands';
import { registerPulse } from '../../src/commands/pulse';

async function importOptional<T = any>(path: string): Promise<T | null> {
  try {
    // @ts-ignore - dynamic import for optional modules
    const mod = await import(path);
    return (mod?.default ?? mod) as T;
  } catch {
    return null;
  }
}

// Initialize once per warm container to reuse bot across invocations
const log = pino({ level: process.env.LOG_LEVEL || 'info', base: undefined });
const cfg = loadConfig();
if (!cfg.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN missing');
}

const bot = new Telegraf(cfg.TELEGRAM_BOT_TOKEN);

bot.catch((err, ctx) => {
  const msg = err instanceof Error ? err.message : String(err);
  log.error({ err: msg, update: ctx.update }, 'telegraf error');
});

// Register commands and optional features once
registerCommands(bot, cfg, log);
registerPulse(bot, cfg, log);

// Optional features (auto-detected; safe if missing)
// Keep these fast — heavy/looping work does not belong in request handler.
(async () => {
  const freeChat = await importOptional<{ enableFreeChat: Function }>('../../src/chat/freeTalk');
  if (freeChat?.enableFreeChat) {
    freeChat.enableFreeChat(bot, cfg, log);
  }

  const coinCmd = await importOptional<{ registerCoin: Function }>('../../src/commands/coin');
  if (coinCmd?.registerCoin) {
    coinCmd.registerCoin(bot, cfg, log);
  }
})();

export async function handler(event: any) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 200, body: 'OK' };
    }

    const update = JSON.parse(event.body || '{}');
    await bot.handleUpdate(update);
    return { statusCode: 200, body: 'OK' };
  } catch (e: any) {
    log.error({ err: e?.message, stack: e?.stack }, 'webhook handler error');
    // Return 200 so Telegram doesn’t disable the webhook on occasional errors
    return { statusCode: 200, body: 'OK' };
  }
}

