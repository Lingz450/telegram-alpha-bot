// Netlify Function: Telegram webhook handler (minimal)
// - Webhook mode only; no long-running process.
// - Avoid importing heavy app modules (prisma/puppeteer/jobs) to keep bundle small.

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info', base: undefined });
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN missing');
}

// Initialize once per warm container
const bot = new Telegraf(BOT_TOKEN);

bot.catch((err, ctx) => {
  const msg = err instanceof Error ? err.message : String(err);
  log.error({ err: msg, update: ctx.update }, 'telegraf error');
});

// Minimal commands just to verify webhook wiring
bot.start((ctx) => ctx.reply('Hi! I am online via Netlify webhook.'));
bot.help((ctx) => ctx.reply('Use /start or type a symbol like BTC.'));
bot.hears(/^[#$]?([A-Za-z]{2,10})$/, async (ctx) => {
  const sym = (ctx.match as RegExpMatchArray)[1].toUpperCase();
  await ctx.reply(`You said ${sym}. Full features run on a worker process.`);
});

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

