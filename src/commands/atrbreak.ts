// src/commands/atrbreak.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange, getTop100Symbols } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { atr } from '../indicators/atr';

function esc(s: unknown) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function registerATRBreak(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // atrbreak 1h top [k=1.5]
  bot.hears(/^atrbreak\s+(5m|15m|1h|2h|4h|1d)\s+(top|bottom)(?:\s+k=(\d+(\.\d+)?))?$/i, async (ctx) => {
    const [, tf, side, kStr] = ctx.match as RegExpMatchArray;
    const k = kStr ? Number(kStr) : 1.5;

    const ex = makeExchange(cfg);
    const universe = await getTop100Symbols(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT);

    const rows: { symbol: string; ratio: number; range: number }[] = [];
    for (const sym of universe) {
      try {
        const ks = await klines(ex, sym, tf as any, 220);
        if (ks.length < 50) continue;
        const highs = ks.map(c => c.h), lows = ks.map(c => c.l), closes = ks.map(c => c.c);
        const a = atr(highs, lows, closes, 14);
        const lastAtr = a.at(-1)!;
        const last = ks.at(-1)!;
        const rng = last.h - last.l;
        if (!Number.isFinite(lastAtr) || lastAtr <= 0) continue;
        const ratio = rng / lastAtr;
        rows.push({ symbol: sym, ratio, range: rng });
      } catch {}
    }

    const sorted = side === 'top'
      ? rows.sort((a,b) => b.ratio - a.ratio)
      : rows.sort((a,b) => a.ratio - b.ratio);

    const filt = side === 'top' ? sorted.filter(r => r.ratio >= k) : sorted;
    const top = (filt.length ? filt : sorted).slice(0, 10);

    if (!top.length) return ctx.reply('No ATR signals right now.');

    const lines = top.map(r => `- ${r.symbol}  ratio=<code>${r.ratio.toFixed(2)}</code>  range=<code>${r.range.toFixed(6)}</code>`);
    const msg = `<b>ATR breakout — ${esc(tf)}</b> (${esc(side)}; k=${k})\n` + lines.join('\n');
    return ctx.reply(msg, { parse_mode: 'HTML' });
  });
}
