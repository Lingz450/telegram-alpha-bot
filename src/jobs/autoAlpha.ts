import { Telegraf } from 'telegraf';
import { makeExchange } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { ema } from '../indicators/ema';
import { rsi } from '../indicators/rsi';
import { atr } from '../indicators/atr';
import dayjs from 'dayjs';

export function startAutoAlpha(bot: Telegraf, cfg: any, log: any) {
  const chatIds = (process.env.AUTO_ALPHA_CHAT_IDS || '').split(',').filter(Boolean);
  const ex = makeExchange(cfg);
  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
  const tfs = ['1h', '4h'];

  async function analyze(symbol: string, tf: string) {
    const data = await klines(ex, symbol, tf as any, 200);
    const closes = data.map(r => r.c);
    const highs = data.map(r => r.h);
    const lows = data.map(r => r.l);

    const e50 = ema(closes, 50).at(-1)!;
    const e200 = ema(closes, 200).at(-1)!;
    const rsiVal = rsi(closes, 14).at(-1)!;
    const atrVal = atr(data, 14).at(-1)!;
    const price = closes.at(-1)!;
    const trend = price > e200 ? 'Uptrend ✅' : 'Downtrend ❌';
    const mom = price > e50 ? 'Rising' : 'Weak';
    const atrPct = (atrVal / price * 100).toFixed(2);

    return `
📊 <b>${symbol}</b> (${tf})
• <b>Price:</b> ${price.toFixed(2)}
• <b>Trend:</b> ${trend}
• <b>Momentum:</b> ${mom}
• <b>RSI(14):</b> ${rsiVal.toFixed(2)}
• <b>ATR(14):</b> ${atrVal.toFixed(2)} (${atrPct}%)
💡 <b>Setup:</b> ${trend.includes('Up') ? 'Buy dips near EMA50' : 'Short rallies below EMA200'}
⚠️ <i>DYOR. Educational only.</i>
`;
  }

  async function post() {
    for (const pair of pairs) {
      for (const tf of tfs) {
        const text = await analyze(pair, tf);
        for (const chatId of chatIds) {
          await bot.telegram.sendMessage(chatId, text, { parse_mode: 'HTML' }).catch(() => {});
        }
      }
    }
  }

  setInterval(post, 1000 * 60 * 60 * 3); // every 3 hours
  setTimeout(post, 5000); // first run after startup
}
