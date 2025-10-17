// src/commands/coach.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { normSymbol, prettySymbol } from '../core/symbols';
import { makeExchange } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { ema } from '../indicators/ema';
import { rsi } from '../indicators/rsi';
import { atr } from '../indicators/atr';
import { classifyRegime, suggestRiskBPS } from '../core/regime';
import { wireNfaAction } from '../telegram/withNfa';
import { NFA_INLINE } from '../utils/nfa';

const TF = '1h'; // default coaching TF

function startTyping(ctx: Context) {
  const chatId = ctx.chat?.id!;
  let killed = false;
  const tick = async () => { if (!killed) try { await ctx.telegram.sendChatAction(chatId, 'typing'); } catch {} };
  tick();
  const iv = setInterval(tick, 4000);
  return () => { killed = true; clearInterval(iv); };
}

export function registerCoach(bot: Telegraf<Context>, cfg: Cfg) {
  wireNfaAction(bot);

  bot.command('coach', async (ctx) => {
    const stop = startTyping(ctx);
    try {
      const rest = ((ctx.message as any).text || '').split(/\s+/).slice(1).join(' ').trim();
      if (!rest) {
        stop();
        return ctx.reply('Usage: /coach <symbol> [free text]\nExample: /coach sol thinking of long at 203');
      }

      // very light parse
      const symMatch = rest.match(/([a-z0-9\/]{2,15})/i);
      if (!symMatch) { stop(); return ctx.reply('Couldn’t find a symbol. Try: /coach btc at 65000 long'); }
      const symbol = normSymbol(symMatch[1], cfg.UNIVERSE_BASE);

      const ex = makeExchange(cfg);
      const rows = await klines(ex, symbol, TF as any, 300);
      if (!rows.length) { stop(); return ctx.reply('No candles found. Try another pair.'); }

      const closes = rows.map(r => r.c);
      const highs  = rows.map(r => r.h);
      const lows   = rows.map(r => r.l);

      const e50  = ema(closes, 50);
      const e200 = ema(closes, 200);
      const r14  = rsi(closes, 14);
      const a14  = atr(rows, 14);

      const price = closes.at(-1)!;
      const ema50v = e50.at(-1)!;
      const ema200v = e200.at(-1)!;
      const rsiVal = r14.at(-1)!;
      const atrAbs = a14.at(-1) || 0;
      const atrPct = price ? (atrAbs / price) * 100 : 0;

      // local S/R
      const span = Math.min(100, rows.length);
      const recentHigh = Math.max(...highs.slice(-span));
      const recentLow  = Math.min(...lows.slice(-span));

      const regime = classifyRegime({ price, ema50: ema50v, ema200: ema200v, atrPct, rsi: rsiVal });
      const riskBps = suggestRiskBPS(regime, atrPct);

      // knife catch & reclaim ideas
      const slKnife = Math.max(recentLow - 0.6 * atrAbs, 0);
      const tp1 = price + 0.6 * atrAbs;
      const tp2 = price + 1.2 * atrAbs;
      const tp3 = Math.max(recentHigh, price + 1.8 * atrAbs);

      const reclaim = price < ema50v ? `long only on reclaim ${ema50v.toFixed(3)}–${ema200v.toFixed(3)}` :
                                       `watch ${ema50v.toFixed(3)} hold; add on ${ema200v.toFixed(3)} reclaim`;

      const pretty = prettySymbol(symbol);
      const lines = [
        `💬 ${pretty} (${TF})`,
        regime === 'uptrend-strong' ? 'Uptrend with momentum — favor pullback buys.' :
        regime === 'uptrend-cooling' ? 'Uptrend cooling — buy dips, avoid chasing.' :
        regime === 'transition' ? 'Transition — let price choose; scalp only with tight risk.' :
        regime === 'downtrend-strong' ? 'Strong downtrend — knife-catch only with hard stops; prefer fades.' :
        'Weak downtrend — rallies are for selling until EMA200 reclaim.',
        '',
        `• ${reclaim}`,
        `• Knife-catch zone near recent low ${recentLow.toFixed(3)} (hard SL ${slKnife.toFixed(3)})`,
        `• Targets: ${tp1.toFixed(3)} / ${tp2.toFixed(3)} / ${tp3.toFixed(3)}`,
        `• Sizing guide: ~${(riskBps/100).toFixed(2)}% of account risk per idea`,
        `• Volatility(ATR): ${atrAbs.toFixed(4)} (${atrPct.toFixed(2)}%), RSI(14): ${rsiVal.toFixed(1)}`,
      ];

      stop();
      return ctx.reply(lines.join('\n'), { reply_markup: { inline_keyboard: [NFA_INLINE] } });
    } catch (e) {
      stop();
      return ctx.reply('Coach failed to analyze that. Try a different symbol/text.');
    }
  });
}
