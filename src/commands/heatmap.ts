// src/commands/heatmap.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { normSymbol } from '../core/symbols';
import { makeExchange } from '../exchange/client';
import { orderbook, ticker } from '../exchange/marketData';

type Mode = 'normal' | 'extended';
const MODES = new Set<Mode>(['normal','extended']);

function startTyping(ctx: Context) {
  const chatId = ctx.chat?.id!;
  let killed = false;
  const tick = async () => { if (!killed) try { await ctx.telegram.sendChatAction(chatId, 'typing'); } catch {} };
  tick(); const iv = setInterval(tick, 4500);
  return () => { killed = true; clearInterval(iv); };
}

function fmt(n: number) {
  const abs = Math.abs(n);
  const dp = abs >= 1000 ? 0 : abs >= 100 ? 1 : abs >= 1 ? 2 : abs >= 0.1 ? 3 : 4;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
}

export function registerHeatmap(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // /heatmap BTC (optional mode)
  bot.command('heatmap', async (ctx) => {
    const stop = startTyping(ctx);
    try {
      const parts = ((ctx.message as any).text || '').trim().split(/\s+/).slice(1);
      if (!parts.length) {
        stop();
        return ctx.reply('Usage: /heatmap <symbol> [normal|extended]');
      }

      const symRaw = parts[0];
      const modeArg = (parts[1] || 'normal').toLowerCase() as Mode;
      const mode: Mode = MODES.has(modeArg) ? modeArg : 'normal';

      const symbol = normSymbol(symRaw, cfg.UNIVERSE_BASE);
      const ex = makeExchange(cfg);

      // small depth for speed; extended doubles it
      const depth = mode === 'extended' ? 100 : 50;
      const [ob, t] = await Promise.all([
        orderbook(ex, symbol, depth),
        ticker(ex, symbol).catch(() => null),
      ]);

      if (!ob?.bids?.length || !ob?.asks?.length) {
        stop();
        return ctx.reply('Couldn’t fetch order book.');
      }

      const bestBid = ob.bids[0][0];
      const bestAsk = ob.asks[0][0];
      const mid     = (bestBid + bestAsk) / 2;
      const last    = Number(t?.last ?? mid);

      // biggest walls
      const maxBid = ob.bids.slice(0, depth).reduce((a, b) => (b[1] > a[1] ? b : a));
      const maxAsk = ob.asks.slice(0, depth).reduce((a, b) => (b[1] > a[1] ? b : a));

      const topBids = ob.bids.slice(0, 5).map(([p, q]) => `B  ${fmt(p)}  (${fmt(q)})  Δ${((mid - p)/mid*100).toFixed(2)}%`);
      const topAsks = ob.asks.slice(0, 5).map(([p, q]) => `A  ${fmt(p)}  (${fmt(q)})  Δ${((p - mid)/mid*100).toFixed(2)}%`);

      const lines = [
        `Heatmap — ${symbol} (${mode})`,
        `Last: ${fmt(last)}  |  Bid: ${fmt(bestBid)}  Ask: ${fmt(bestAsk)}  Mid: ${fmt(mid)}`,
        `Largest bid wall:  ${fmt(maxBid[0])} (${fmt(maxBid[1])})`,
        `Largest ask wall:  ${fmt(maxAsk[0])} (${fmt(maxAsk[1])})`,
        '',
        'Top 5 bids:',
        ...topBids,
        '',
        'Top 5 asks:',
        ...topAsks,
      ];

      stop();
      return ctx.reply(lines.join('\n'));
    } catch {
      stop();
      return ctx.reply('Usage: /heatmap <symbol> [normal|extended]');
    }
  });

  // plain text: heatmap BTC extended
  bot.hears(/^heatmap\s+([A-Za-z0-9\-\/]+)(?:\s+(normal|extended))?$/i, async (ctx) => {
    const [, sym, m] = ctx.match as RegExpMatchArray;
    (ctx as any).message = { text: `/heatmap ${sym} ${m || ''}` }; // reuse handler
    return bot.handleUpdate(ctx.update);
  });
}
