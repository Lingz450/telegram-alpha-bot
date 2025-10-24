// Netlify Function: Telegram webhook handler (minimal)
// - Webhook mode only; no long-running process.
// - Avoid importing heavy app modules (prisma/puppeteer/jobs) to keep bundle small.

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import pino from 'pino';
import { loadConfig } from '../../src/config';
import { registerLiteCommands } from '../../src/netlify/registerLiteCommands';

const log = pino({ level: process.env.LOG_LEVEL || 'info', base: undefined });

const baseCfg = loadConfig();
// Constrain universe and intervals for serverless execution
const cfg = { ...baseCfg, UNIVERSE_LIMIT: Math.min(baseCfg.UNIVERSE_LIMIT || 500, 50) } as typeof baseCfg;
if (!cfg.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN missing');
}

// Initialize once per warm container
const bot = new Telegraf(cfg.TELEGRAM_BOT_TOKEN);

bot.catch((err, ctx) => {
  const msg = err instanceof Error ? err.message : String(err);
  log.error({ err: msg, update: ctx.update }, 'telegraf error');
});

// Quick sanity command to verify deploy version
bot.command('version', (ctx) => ctx.reply('netlify:function v2'));

// Register a safe subset of commands for serverless
registerLiteCommands(bot, cfg, log);

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
    // Return 200 so Telegram doesn't disable the webhook on occasional errors
    return { statusCode: 200, body: 'OK' };
  }
}
