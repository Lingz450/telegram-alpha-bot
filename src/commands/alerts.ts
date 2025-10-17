// src/commands/alerts.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';
import { normSymbol } from '../core/symbols';
import { isAdmin } from '../core/permissions';

/** Parse prices like: 65k, 1.25m, 0.0000321, 64,200 */
function parseHumanPrice(input: string): number | null {
  const raw = input.trim().toLowerCase().replace(/[, ]/g, '');
  const m = raw.match(/^(\d+(?:\.\d+)?)([kmb])?$/i);
  if (!m) return null;

  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  const suf = (m[2] || '').toLowerCase();
  const mul = suf === 'k' ? 1e3 : suf === 'm' ? 1e6 : suf === 'b' ? 1e9 : 1;

  return n * mul;
}

function usage(ctx: Context) {
  return ctx.reply(['Usage:', '/alert BTC 65000', 'Quick style: $btc 65k'].join('\n'));
}

async function createAlert(ctx: Context, cfg: Cfg, symRaw: string, priceRaw: string) {
  const symbol = normSymbol(symRaw.replace(/^\$/, ''), cfg.UNIVERSE_BASE);
  const priceNum = parseHumanPrice(priceRaw);

  if (!priceNum) {
    return ctx.reply('Invalid price. Try: /alert BTC 65000 or $btc 65k');
  }

  await prisma.alert.create({
    data: {
      chatId: String(ctx.chat?.id),
      userId: String(ctx.from?.id),
      symbol,
      triggerPrice: String(priceNum), // store as string for Decimal
      direction: 'either',            // above|below|either
    },
  });

  return ctx.reply(`✅ Alert set on ${symbol} at ${priceNum}`);
}

export function registerAlerts(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // 1) /alert <symbol> <price>
  bot.command('alert', async (ctx) => {
    const parts = ((ctx.message as any).text || '').split(/\s+/).slice(1);
    if (parts.length < 2) return usage(ctx);
    const [sym, price] = parts;
    return createAlert(ctx, cfg, sym, price);
  });

  // 2) Quick style: "$btc 100000" or "btc 65k"
  bot.hears(/^\$?([A-Za-z0-9\-\/]{2,15})\s+([\d.,]+[kKmMbB]?)$/i, async (ctx, next) => {
    const text = (ctx.message as any)?.text || '';
    if (text.startsWith('/')) return next(); // skip slash commands

    const m = text.match(/^\$?([A-Za-z0-9\-\/]{2,15})\s+([\d.,]+[kKmMbB]?)$/i);
    if (!m) return next();

    const [, sym, price] = m;
    if (!/^[A-Za-z0-9\-\/]+$/.test(sym)) return next();

    return createAlert(ctx, cfg, sym, price);
  });

  // 3) /alertlist or plain "alertlist"
  const listHandler = async (ctx: Context) => {
    const chatId = String(ctx.chat?.id);
    const alerts = await prisma.alert.findMany({
      where: { chatId, active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!alerts.length) return ctx.reply('No active alerts.');

    const lines = alerts.map((a) => `- ${a.symbol} @ ${a.triggerPrice}`);
    return ctx.reply(['Active alerts', ...lines].join('\n'));
  };
  bot.command('alertlist', listHandler);
  bot.hears(/^alertlist$/i, listHandler);

  // 4) /alertreset [symbol] [price] — admin only
  const resetHandler = async (ctx: Context) => {
    if (!isAdmin(ctx, cfg)) return ctx.reply('Admin only.');

    const parts = ((ctx.message as any).text || '').split(/\s+/).slice(1);
    const chatId = String(ctx.chat?.id);

    if (parts.length === 0) {
      await prisma.alert.updateMany({ where: { chatId, active: true }, data: { active: false } });
      return ctx.reply('🔁 Cleared all alerts.');
    }

    const symbol = normSymbol(parts[0], cfg.UNIVERSE_BASE);
    const price = parts[1] ? parseHumanPrice(parts[1]) : null;

    await prisma.alert.updateMany({
      where: { chatId, symbol, active: true, ...(price ? { triggerPrice: String(price) } : {}) },
      data: { active: false },
    });

    return ctx.reply(price ? `Cleared alert ${symbol} @ ${price}` : `Cleared alerts for ${symbol}`);
  };
  bot.command('alertreset', resetHandler);
  bot.hears(/^alertreset(?:\s+.+)?$/i, resetHandler);
}
