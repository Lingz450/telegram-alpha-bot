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
  if (abs >= 100000) return 0;
  if (abs >= 10000) return 0;
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

// keep the chat “typing…” while we compute
function startTyping(ctx: Context) {
  const chatId = ctx.chat?.id!;
  let killed = false;
  const tick = async () => {
    if (killed) return;
    try { await ctx.telegram.sendChatAction(chatId, 'typing'); } catch {}
  };
  tick();
  const iv = setInterval(tick, 4000);
  return () => { killed = true; clearInterval(iv); };
}

// --- sanity guard to avoid mismatched level scales (e.g., SOL levels on BTC) ---
function levelsLookReasonable(price: number, low: number, high: number) {
  if (!Number.isFinite(price) || !Number.isFinite(low) || !Number.isFinite(high)) return false;
  if (low <= 0 || high <= 0 || low >= high) return false;
  const span = high - low;
  if (span <= 0) return false;
  const mid = (low + high) / 2;
  const ratio = price / Math.max(1, mid);
  // very forgiving but catches obvious cross-symbol mistakes
  return ratio > 0.2 && ratio < 5;
}

// -------- core builder --------
async function buildAlphaText(cfg: Cfg, symbol: string, tf: string): Promise<string> {
  const ex = makeExchange(cfg);
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
  let recentHigh = Math.max(...highs.slice(-span));
  let recentLow  = Math.min(...lows.slice(-span));

  // pivots
  const win = 6;
  const pivHi: number[] = [];
  const pivLo: number[] = [];
  for (let i = win; i < rows.length - win; i++) {
    const segH = highs.slice(i - win, i + win + 1);
    const segL = lows.slice(i - win, i + win + 1);
    if (highs[i] === Math.max(...segH)) pivHi.push(highs[i]);
    if (lows[i]  === Math.min(...segL)) pivLo.push(lows[i]);
  }
  let nearRes = pivHi.length ? pivHi.at(-1)! : recentHigh;
  let nearSup = pivLo.length ? pivLo.at(-1)! : recentLow;

  // sanity fallback if the range looks totally off for the current price
  if (!levelsLookReasonable(price, recentLow, recentHigh)) {
    const slice = closes.slice(-Math.min(120, closes.length));
    const lo = Math.min(...slice);
    const hi = Math.max(...slice);
    recentLow = lo;
    recentHigh = hi;
    nearSup = lo;
    nearRes = hi;
  }

  const pretty = prettySymbol(symbol);
  const dp = priceDp(price);
  const n  = nf(dp);
  const n2 = nf(Math.min(4, Math.max(2, dp)));
  const nRSI = nf(1);

  // concise take
  const trend = price >= lastE200 ? 'Uptrend' : 'Downtrend';
  const mom   = lastE50 >= lastE200 ? 'Momentum up' : 'Momentum weak';
  const bias  = rsiVal > 70 ? 'Caution: overbought' : rsiVal < 30 ? 'Oversold bounce potential' : 'Neutral zone';

  // simple, clean output; no runaway decimals
  const lines = [
    `📈 <b>${pretty}</b> (${tf})`,
    ``,
    `• <b>Price:</b> ${n.format(price)} (${price >= prev ? '+' : '−'}${n2.format(Math.abs(price - prev))})`,
    `• <b>Trend:</b> ${trend} (vs EMA200)`,
    `• <b>Momentum:</b> ${mom} (EMA50)`,
    `• <b>RSI(14):</b> ${nRSI.format(rsiVal)} (${labelRSI(rsiVal)})`,
    `• <b>ATR(14):</b> ${n2.format(atrVal)} (${n2.format(atrPct)}%)`,
    ``,
    `<b>Levels:</b>`,
    `• Support ≈ ${n.format(nearSup)}`,
    `• Resistance ≈ ${n.format(nearRes)}`,
    `• Range: L=${n.format(recentLow)} / H=${n.format(recentHigh)}`,
    ``,
    `💡 <b>Take:</b> ${trend}, ${bias}.`,
    `⚠️ <i>Educational only. DYOR.</i>`,
  ];

  return lines.join('\n');
}

// -------- handler --------
export function registerAlpha(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // /alpha BTC [ltf=…]
  bot.command('alpha', async (ctx) => {
    const stopTyping = startTyping(ctx);
    try {
      const parts = ((ctx.message as any).text || '').split(/\s+/).slice(1);
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
      const ph = await ctx.reply(`👀 ${prettySymbol(symbol)} — checking…`);
      const msg = await buildAlphaText(cfg, symbol, tf);
      stopTyping();
      return ctx.telegram.editMessageText(
        ph.chat.id,
        ph.message_id,
        undefined,
        msg,
        { parse_mode: 'HTML', disable_web_page_preview: true }
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

      const ph = await ctx.reply(`👀 ${prettySymbol(symbol)} — checking…`);
      const msg = await buildAlphaText(cfg, symbol, tf);
      stopTyping();
      return ctx.telegram.editMessageText(
        ph.chat.id,
        ph.message_id,
        undefined,
        msg,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
    } catch {
      stopTyping();
      return ctx.reply('Could not compute a take right now. Try a different timeframe or symbol.');
    }
  });
}
