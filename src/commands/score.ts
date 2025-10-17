// src/commands/score.ts
import { Telegraf, Context } from 'telegraf';
import { makeExchange } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { ema } from '../indicators/ema';
import { rsi } from '../indicators/rsi';
import { atr } from '../indicators/atr';

export function registerScore(bot: Telegraf<Context>, cfg: any, _log: any) {
  bot.command('score', async (ctx) => {
    const parts = (ctx.message as any).text.split(/\s+/);
    if (parts.length < 2) return ctx.reply('Usage: /score BTC');
    const symbol = parts[1].toUpperCase() + '/USDT';
    const ex = makeExchange(cfg);
    const data = await klines(ex, symbol, '4h' as any, 200);
    const closes = data.map((r) => r.c);
    const e50 = ema(closes, 50).at(-1)!;
    const e200 = ema(closes, 200).at(-1)!;
    const r = rsi(closes, 14).at(-1)!;
    const a = atr(data, 14).at(-1)!;
    const price = closes.at(-1)!;

    const emaScore = price > e200 ? 100 : price > e50 ? 70 : 30;
    const rsiScore = r > 70 ? 30 : r > 50 ? 80 : r > 30 ? 60 : 40;
    const volScore = a / price < 0.02 ? 60 : a / price < 0.05 ? 80 : 40;

    const score = Math.round((emaScore + rsiScore + volScore) / 3);
    const tone = score > 75 ? '🟢 Strong' : score > 55 ? '🟡 Neutral' : '🔴 Weak';

    const msg = `
💎 <b>${symbol}</b>
• <b>GhostScore:</b> ${score}/100 ${tone}
• <b>EMA:</b> ${e50.toFixed(2)} / ${e200.toFixed(2)}
• <b>RSI:</b> ${r.toFixed(1)}
• <b>ATR%:</b> ${(a / price * 100).toFixed(2)}%
⚙️ Composite of EMA, RSI, and Volatility
`;

    await ctx.reply(msg, { parse_mode: 'HTML' });
  });
}
