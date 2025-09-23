// src/commands/alpha.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

import { normSymbol, prettySymbol } from '../core/symbols';
import { makeExchange } from '../exchange/client';
import { klines } from '../exchange/marketData';

import { ema } from '../indicators/ema';
import { rsi } from '../indicators/rsi';
import { atr } from '../indicators/atr';

// -------- utils --------
const TF = new Set(['5m', '15m', '1h', '2h', '4h', '1d'] as const);

function nf(decimals: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function priceDp(p: number): number {
  if (!Number.isFinite(p) || p === 0) return 2;
  const abs = Math.abs(p);
  if (abs >= 1000) return 0;
  if (abs >= 100) return 1;
  if (abs >= 1) return 2;
  if (abs >= 0.1) return 3;
  if (abs >= 0.01) return 4;
  if (abs >= 0.001) return 5;
  return 6;
}

function labelRSI(v: number) {
  if (v >= 70) return 'overbought';
  if (v <= 30) return 'oversold';
  if (v >= 60) return 'neutral+';
  if (v <= 40) return 'neutral-';
  return 'neutral';
}

function takeSummary(params: {
  price: number;
  ema50: number;
  ema200: number;
  rsiVal: number;
  atrPct: number;
}) {
  const { price, ema50, ema200, rsiVal, atrPct } = params;
  const uptrend = price >= ema200;
  const momUp =
    ema50 >= ema200 && ema50 >= price
      ? false
      : ema50 - ema200 >= 0 || price - ema50 >= 0;

  // Simple human heuristics
  if (uptrend && momUp && rsiVal < 70) {
    if (atrPct < 0.7)
      return 'Uptrend, steady momentum. Dips toward EMA50 look buyable; keep stops sensible.';
    return 'Uptrend with juice. Momentum strong — consider buying pullbacks above EMA50.';
  }
  if (uptrend && !momUp) {
    return 'Uptrend but momentum cooling. Safer to buy dips into EMA200; avoid chasing breakouts.';
  }
  if (!uptrend && !momUp) {
    if (rsiVal < 35)
      return 'Downtrend. Relief bounces likely, but rallies are for selling until back above EMA200.';
    return 'Downtrend/weak. Consider fades into resistance; wait for confirmation to flip bias.';
  }
  if (!uptrend && momUp) {
    return 'Attempting a turn. Look for higher lows and a reclaim of EMA200 to confirm trend change.';
  }
  return 'Mixed signals. Let price choose; trade level-to-level with tight risk.';
}

// Little helper: show typing while we work
function startTyping(ctx: Context) {
  const chatId = ctx.chat?.id!;
  let killed = false;
  const tick = async () => {
    if (killed) return;
    try { await ctx.telegram.sendChatAction(chatId, 'typing'); } catch {}
  };
  tick();
  const iv = setInterval(tick, 4000); // Telegram clears chat action after ~5s
  return () => { killed = true; clearInterval(iv); };
}

// Build the analysis text for a given symbol/timeframe (plain text)
async function buildAlphaText(cfg: Cfg, symbol: string, tf: string): Promise<string> {
  const ex = makeExchange(cfg); // sync
  const rows = await klines(ex, symbol, tf as any, 300);
  if (!rows?.length) throw new Error('no-data');

  const closes = rows.map(r => r.c);
  const highs  = rows.map(r => r.h);
  const lows   = rows.map(r => r.l);

  const e50  = ema(closes, 50);
  const e200 = ema(closes, 200);
  const r14  = rsi(closes, 14);
  const a14  = atr(rows, 14);

  const price = closes.at(-1)!;
  const prev  = closes.at(-2)!;
  const lastE50 = e50.at(-1)!;
  const lastE200 = e200.at(-1)!;
  const rsiVal = r14.at(-1)!;
  const atrVal = a14.at(-1) || 0;
  const atrPct = price ? (atrVal / price) * 100 : 0;

  const span = Math.min(100, rows.length);
  const recentHigh = Math.max(...highs.slice(-span));
  const recentLow  = Math.min(...lows.slice(-span));

  // Lightweight local pivots
  const win = 6;
  const pivHi: number[] = [];
  const pivLo: number[] = [];
  for (let i = win; i < rows.length - win; i++) {
    const segH = highs.slice(i - win, i + win + 1);
    const segL = lows.slice(i - win, i + win + 1);
    if (highs[i] === Math.max(...segH)) pivHi.push(highs[i]);
    if (lows[i]  === Math.min(...segL)) pivLo.push(lows[i]);
  }
  const nearRes = pivHi.length ? pivHi.at(-1)! : recentHigh;
  const nearSup = pivLo.length ? pivLo.at(-1)! : recentLow;

  const pretty = prettySymbol(symbol);
  const dp = priceDp(price);
  const n  = nf(dp);
  const n2 = nf(Math.min(4, Math.max(2, dp)));

  const trend = price >= lastE200 ? 'Up' : 'Down';
  const mom   = lastE50 >= lastE200 ? 'Rising' : (lastE50 <= lastE200 ? 'Falling' : 'Flat');

  const lines = [
    `Alpha — ${pretty} (${tf})`,
    `Price: ${n.format(price)}  (${price >= prev ? '+' : '-'}${n2.format(Math.abs(price - prev))})`,
    `Trend: ${trend} (vs EMA200)`,
    `Momentum: ${mom} (EMA50)`,
    `RSI(14): ${rsiVal.toFixed(1)}  (${labelRSI(rsiVal)})`,
    `ATR(14): ${n2.format(atrVal)}  (${n2.format(atrPct)}%)`,
    `Levels:`,
    `  Support ≈ ${n.format(nearSup)}   Resistance ≈ ${n.format(nearRes)}`,
    `  Range ${span} bars: L=${n.format(recentLow)}  H=${n.format(recentHigh)}`,
    '',
    takeSummary({ price, ema50: lastE50, ema200: lastE200, rsiVal, atrPct }),
    '',
    '⚠️ Educational only. Not financial advice — manage risk.',
  ];

  return lines.join('\n');
}

// -------- handler --------
export function registerAlpha(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // Slash: /alpha BTC [ltf=1h]
  bot.command('alpha', async (ctx) => {
    const stopTyping = startTyping(ctx);
    try {
      const text = ((ctx.message as any).text || '').trim();
      const parts = text.split(/\s+/).slice(1);
      if (!parts.length) {
        stopTyping();
        return ctx.reply('Usage: /alpha BTC [ltf=5m|15m|1h|2h|4h|1d]');
      }

      const symRaw = parts[0];
      let tf = '1h';
      const tfArg = parts.find(p => /^ltf=/.test(p));
      if (tfArg) {
        const v = tfArg.split('=')[1];
        if (TF.has(v as any)) tf = v;
      }

      const symbol = normSymbol(symRaw, cfg.UNIVERSE_BASE);

      // Quick placeholder → edit when ready
      const ph = await ctx.reply(`Analyzing ${prettySymbol(symbol)} on ${tf}…`);

      const msg = await buildAlphaText(cfg, symbol, tf);
      stopTyping();
      return ctx.telegram.editMessageText(
        ph.chat.id,
        ph.message_id,
        undefined,
        msg
      );
    } catch {
      stopTyping();
      return ctx.reply('Could not compute a take right now. Try a different timeframe or symbol.');
    }
  });

  // Quick: "$btc" or "$eth ltf=4h"
  bot.hears(/^\$([A-Za-z0-9\-\/]{2,15})(?:\s+ltf=(5m|15m|1h|2h|4h|1d))?$/i, async (ctx) => {
    const stopTyping = startTyping(ctx);
    try {
      const [, raw, tfRaw] = ctx.match as RegExpMatchArray;
      const tf = tfRaw && TF.has(tfRaw as any) ? tfRaw : '1h';
      const symbol = normSymbol(raw, cfg.UNIVERSE_BASE);

      const ph = await ctx.reply(`Analyzing ${prettySymbol(symbol)} on ${tf}…`);

      const msg = await buildAlphaText(cfg, symbol, tf);
      stopTyping();
      return ctx.telegram.editMessageText(
        ph.chat.id,
        ph.message_id,
        undefined,
        msg
      );
    } catch {
      stopTyping();
      return ctx.reply('Could not compute a take right now. Try a different timeframe or symbol.');
    }
  });
}
