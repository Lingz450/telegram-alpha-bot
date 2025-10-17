// src/commands/watch.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';
import { normSymbol, prettySymbol } from '../core/symbols';

// Parse a list like: "BTC ETH, SOL  xrp/usdt"
function parseSymbols(raw: string): string[] {
  return raw
    .split(/[,\s]+/)          // split on comma or spaces
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 50);            // soft cap to avoid spam
}

// Normalize to BASE (USDT, etc.)
function normalizeList(list: string[], base: string): string[] {
  return list
    .map(s => normSymbol(s.replace(/^\$/, ''), base))
    .filter(Boolean);
}

export function registerWatch(bot: Telegraf<Context>, cfg: Cfg, _log?: any) {
  const base = cfg.UNIVERSE_BASE;

  // ---------- ADD ----------
  // Phrase: "watch add BTC ETH SOL"
  bot.hears(/^watch\s+add\s+(.+)$/i, async (ctx) => {
    const list = normalizeList(parseSymbols((ctx.match as RegExpMatchArray)[1]), base);
    if (!list.length) return ctx.reply('Usage: watch add BTC ETH SOL');

    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);

    let added = 0;
    for (const symbol of list) {
      await prisma.watchItem
        .upsert({
          where: { chatId_userId_symbol: { chatId, userId, symbol } },
          update: {},
          create: { chatId, userId, symbol },
        })
        .then(() => { added++; })
        .catch(() => { /* ignore */ });
    }

    const pretty = list.map(prettySymbol).join(', ');
    return ctx.reply(
      `👀 Added <b>${added}</b> / ${list.length} to your watchlist:\n<code>${pretty}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  // Slash: "/watch BTC ETH SOL" (alias of add)
  bot.command('watch', async (ctx) => {
    const parts = ((ctx.message as any).text || '').split(/\s+/).slice(1).join(' ');
    if (!parts) return ctx.reply('Usage: /watch BTC ETH SOL');
    const list = normalizeList(parseSymbols(parts), base);

    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);

    let added = 0;
    for (const symbol of list) {
      await prisma.watchItem
        .upsert({
          where: { chatId_userId_symbol: { chatId, userId, symbol } },
          update: {},
          create: { chatId, userId, symbol },
        })
        .then(() => { added++; })
        .catch(() => { /* ignore */ });
    }

    const pretty = list.map(prettySymbol).join(', ');
    return ctx.reply(
      `👀 Added <b>${added}</b> / ${list.length} to your watchlist:\n<code>${pretty}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  // ---------- REMOVE ----------
  // Phrase: "watch rm BTC ETH"
  bot.hears(/^watch\s+rm\s+(.+)$/i, async (ctx) => {
    const list = normalizeList(parseSymbols((ctx.match as RegExpMatchArray)[1]), base);
    if (!list.length) return ctx.reply('Usage: watch rm BTC ETH');

    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);

    let removed = 0;
    for (const symbol of list) {
      const r = await prisma.watchItem.deleteMany({ where: { chatId, userId, symbol } });
      removed += r.count;
    }
    return ctx.reply(`🗑️ Removed <b>${removed}</b> item(s) from your watchlist.`, { parse_mode: 'HTML' });
  });

  // Slash: "/unwatch BTC ETH"
  bot.command('unwatch', async (ctx) => {
    const parts = ((ctx.message as any).text || '').split(/\s+/).slice(1).join(' ');
    if (!parts) return ctx.reply('Usage: /unwatch BTC ETH');
    const list = normalizeList(parseSymbols(parts), base);

    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);

    let removed = 0;
    for (const symbol of list) {
      const r = await prisma.watchItem.deleteMany({ where: { chatId, userId, symbol } });
      removed += r.count;
    }
    return ctx.reply(`🗑️ Removed <b>${removed}</b> item(s) from your watchlist.`, { parse_mode: 'HTML' });
  });

  // ---------- CLEAR ----------
  // Phrase: "watch clear"
  bot.hears(/^watch\s+clear$/i, async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const r = await prisma.watchItem.deleteMany({ where: { chatId, userId } });
    return ctx.reply(`🧹 Watchlist cleared (<b>${r.count}</b>)`, { parse_mode: 'HTML' });
  });

  // Slash: "/watchclear"
  bot.command('watchclear', async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const r = await prisma.watchItem.deleteMany({ where: { chatId, userId } });
    return ctx.reply(`🧹 Watchlist cleared (<b>${r.count}</b>)`, { parse_mode: 'HTML' });
  });

  // ---------- SHOW ----------
  // Phrase: "watch show"
  bot.hears(/^watch\s+show$/i, async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const items = await prisma.watchItem.findMany({
      where: { chatId, userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!items.length) {
      return ctx.reply('Your watchlist is empty. Add some: <code>/watch BTC ETH SOL</code>', { parse_mode: 'HTML' });
    }
    const lines = items.map((w, i) => `${i + 1}. ${prettySymbol(w.symbol)}`);
    return ctx.reply(['📜 <b>Your watchlist</b>', ...lines].join('\n'), { parse_mode: 'HTML' });
  });

  // Slash: "/watchlist"
  bot.command('watchlist', async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const items = await prisma.watchItem.findMany({
      where: { chatId, userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!items.length) {
      return ctx.reply('Your watchlist is empty. Add some: <code>/watch BTC ETH SOL</code>', { parse_mode: 'HTML' });
    }
    const lines = items.map((w, i) => `${i + 1}. ${prettySymbol(w.symbol)}`);
    return ctx.reply(['📜 <b>Your watchlist</b>', ...lines].join('\n'), { parse_mode: 'HTML' });
  });
}
