// src/commands/watchlist.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';

function toSym(raw: string, base: string): string {
  const s = raw.trim().toUpperCase().replace(/\s+/g, '').replace('/', '');
  if (!s) return '';
  return s.endsWith(base) ? s : s + base;
}

function splitSymbols(s: string): string[] {
  return s
    .split(/[\s,]+/)
    .map(x => x.trim())
    .filter(Boolean);
}

export function registerWatchlist(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // /watch BTC ETH SOL  OR  "watch add BTC,ETH,SOL"
  bot.command('watch', async (ctx) => {
    const args = ((ctx.message as any).text || '').split(/\s+/).slice(1).join(' ');
    if (!args) return ctx.reply('Usage: /watch BTC ETH SOL');

    const symbols = splitSymbols(args).map(s => toSym(s, cfg.UNIVERSE_BASE)).slice(0, 50);
    if (!symbols.length) return ctx.reply('No symbols provided.');

    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);

    let added = 0;
    for (const symbol of symbols) {
      try {
        await prisma.watchItem.create({ data: { chatId, userId, symbol } });
        added++;
      } catch {
        // ignore unique violations
      }
    }
    return ctx.reply(`✅ Watchlist: added ${added}/${symbols.length}`);
  });

  // /unwatch BTC ETH   OR  "watch rm BTC"
  bot.command('unwatch', async (ctx) => {
    const args = ((ctx.message as any).text || '').split(/\s+/).slice(1).join(' ');
    if (!args) return ctx.reply('Usage: /unwatch BTC ETH');

    const symbols = splitSymbols(args).map(s => toSym(s, cfg.UNIVERSE_BASE));
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);

    let removed = 0;
    for (const symbol of symbols) {
      const r = await prisma.watchItem.deleteMany({ where: { chatId, userId, symbol } });
      removed += r.count;
    }
    return ctx.reply(`♻️ Watchlist: removed ${removed}`);
  });

  // Plain text variants (optional)
  bot.hears(/^watch\s+add\s+(.+)$/i, async (ctx) => {
    const list = (ctx.match as RegExpMatchArray)[1];
    (ctx as any).message = { text: `/watch ${list}` };
    return (bot as any).handleUpdate(ctx.update); // reuse /watch handler
  });

  bot.hears(/^watch\s+rm\s+(.+)$/i, async (ctx) => {
    const list = (ctx.match as RegExpMatchArray)[1];
    (ctx as any).message = { text: `/unwatch ${list}` };
    return (bot as any).handleUpdate(ctx.update);
  });

  bot.hears(/^watch\s+clear$/i, async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const r = await prisma.watchItem.deleteMany({ where: { chatId, userId } });
    return ctx.reply(`🧹 Watchlist cleared (${r.count})`);
  });

  // /watchlist
  bot.command('watchlist', async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);

    // 🔴 If prisma is undefined, this would throw. With the prisma.ts above it won’t.
    const items = await prisma.watchItem.findMany({
      where: { chatId, userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!items.length) {
      return ctx.reply('Your watchlist is empty.\nAdd with: /watch BTC ETH SOL');
    }

    const lines = items.map((w, i) => `${i + 1}. ${w.symbol}`);
    return ctx.replyWithHTML(
      `<b>Your Watchlist</b>\n` + lines.join('\n')
    );
  });
}
