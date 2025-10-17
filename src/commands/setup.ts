// src/commands/setup.ts
import { Telegraf, Context } from 'telegraf';
import { makeExchange } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { ema } from '../indicators/ema';
import { rsi } from '../indicators/rsi';
import { atr } from '../indicators/atr';

export function registerSetup(bot: Telegraf<Context>, cfg: any, _log: any) {
  bot.command('setup', async (ctx) => {
    const text = (ctx.message as any).text.split(/\s+/);
    if (text.length < 3) {
      return ctx.reply('Usage: /setup BTC long or /setup ETH short');
    }

    const [_, symRaw, direction] = text;
    const symbol = symRaw.toUpperCase() + '/USDT';
    const ex = makeExchange(cfg);
    const data = await klines(ex, symbol, '1h' as any, 200);
    const closes = data.map((r) => r.c);
    const e50 = ema(closes, 50).at(-1)!;
    const e200 = ema(closes, 200).at(-1)!;
    const r = rsi(closes, 14).at(-1)!;
    const a = atr(data, 14).at(-1)!;
    const price = closes.at(-1)!;

    const dir = direction.toLowerCase();
    const bias = price > e200 ? 'Uptrend ✅' : 'Downtrend ❌';
    const stop = dir === 'long' ? (price - a).toFixed(2) : (price + a).toFixed(2);
    const tp1 = dir === 'long' ? (price + a * 1.5).toFixed(2) : (price - a * 1.5).toFixed(2);
    const tp2 = dir === 'long' ? (price + a * 2.5).toFixed(2) : (price - a * 2.5).toFixed(2);

    const msg = `
<b>${symbol}</b> 1h Setup (${dir.toUpperCase()})
• Trend: ${bias}
• EMA50/200: ${e50.toFixed(2)} / ${e200.toFixed(2)}
• RSI(14): ${r.toFixed(2)}
• ATR(14): ${a.toFixed(2)}
💡 <b>Plan:</b> ${dir === 'long' ? 'Buy dips above EMA200' : 'Sell rallies under EMA200'}
🎯 <b>TP:</b> ${tp1} / ${tp2}
🛑 <b>SL:</b> ${stop}
⚠️ <i>For education only. DYOR.</i>
`;

    await ctx.reply(msg, { parse_mode: 'HTML' });
  });
}
