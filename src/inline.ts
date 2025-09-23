// src/inline.ts
import { Telegraf } from 'telegraf';
import type { Cfg } from './config';
import { makeExchange } from './exchange/client';
import { ticker } from './exchange/marketData';

function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return String(n);
  return Math.abs(n) >= 100 ? n.toFixed(1) : n.toFixed(d);
}

export function registerInline(bot: Telegraf, cfg: Cfg) {
  bot.on('inline_query', async (ctx) => {
    const q = (ctx.inlineQuery?.query || '').trim();
    if (!q) return ctx.answerInlineQuery([], { cache_time: 5 });

    const symbol = (/usdt/i.test(q) ? q : `${q}USDT`).toUpperCase();
    try {
      const ex = await makeExchange(cfg);
      const t = await ticker(ex, symbol);
      const last = Number(t.last);
      const pct  = Number(t.percentage);
      const title = `${symbol} — ${fmt(last, 6)} (${Number.isFinite(pct) ? (pct>=0?'+':'')+fmt(pct)+'%' : '24h ?'})`;

      const message =
        `📈 <b>${symbol}</b>\n` +
        `Last: <code>${fmt(last, 6)}</code>\n` +
        (Number.isFinite(pct) ? `24h: <code>${pct>=0?'+':''}${fmt(pct)}%</code>\n` : '') +
        `<i>Type /alpha ${symbol.replace('USDT','')}</i>`;

      await ctx.answerInlineQuery([{
        type: 'article',
        id: '1',
        title,
        input_message_content: { message_text: message, parse_mode: 'HTML' },
        description: 'Tap to send quick price card',
      }], { cache_time: 3 });
    } catch {
      await ctx.answerInlineQuery([], { cache_time: 3 });
    }
  });
}
