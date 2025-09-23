// src/commands/ema.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange, getTop100Symbols } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { ema } from '../indicators/ema';

const TF = new Set(['5m', '15m', '1h', '2h', '4h', '1d']);
const PERIOD = new Set(['50', '100', '200']);

// Show “typing…” while we work
function startTyping(ctx: Context) {
  const chatId = ctx.chat?.id!;
  let killed = false;
  const tick = async () => {
    if (killed) return;
    try { await ctx.telegram.sendChatAction(chatId, 'typing'); } catch {}
  };
  tick();
  const iv = setInterval(tick, 4500);
  return () => { killed = true; clearInterval(iv); };
}

function usage(ctx: Context) {
  return ctx.reply('Usage: /ema <50|100|200> <5m|15m|1h|2h|4h|1d>\nExample: /ema 200 4h');
}

// simple bounded concurrency runner
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<R | null>
): Promise<R[]> {
  const out: (R | null)[] = new Array(items.length).fill(null);
  let i = 0;
  const runners: Promise<void>[] = [];
  async function run() {
    while (i < items.length) {
      const idx = i++;
      try {
        out[idx] = await worker(items[idx], idx);
      } catch {
        out[idx] = null;
      }
    }
  }
  for (let c = 0; c < Math.max(1, limit); c++) runners.push(run());
  await Promise.all(runners);
  return out.filter((x): x is R => x !== null);
}

function dpForPrice(p: number): number {
  if (!Number.isFinite(p) || p === 0) return 2;
  const a = Math.abs(p);
  if (a >= 1000) return 0;
  if (a >= 100) return 1;
  if (a >= 1) return 2;
  if (a >= 0.1) return 3;
  if (a >= 0.01) return 4;
  if (a >= 0.001) return 5;
  return 6;
}

async function runScan(cfg: Cfg, period: number, tf: string) {
  const ex = makeExchange(cfg); // sync constructor
  const universe = await getTop100Symbols(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT);

  // Bound concurrent OHLCV requests (tune 5–8 depending on venue/network)
  const CONCURRENCY = 6;

  type Row = { symbol: string; distPct: number; price: number; ema: number };

  const results = await mapLimit<string, Row>(
    universe,
    CONCURRENCY,
    async (sym) => {
      try {
        const k = await klines(ex, sym, tf as any, 300);
        const closes = k.map((x) => x.c);
        if (closes.length < period + 5) return null;

        const series = ema(closes, period);
        const lastEMA = series.at(-1)!;
        const lastPrice = closes.at(-1)!;
        if (!Number.isFinite(lastEMA) || !Number.isFinite(lastPrice) || lastEMA === 0) return null;

        const distPct = Math.abs((lastPrice - lastEMA) / lastEMA) * 100;
        return { symbol: sym, distPct, price: lastPrice, ema: lastEMA };
      } catch {
        return null;
      }
    }
  );

  results.sort((a, b) => a.distPct - b.distPct);
  return results.slice(0, 15); // show a bit more
}

export function registerEMA(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // Slash: /ema 200 4h
  bot.command('ema', async (ctx) => {
    const [pStr, tf] = ((ctx.message as any).text || '').split(/\s+/).slice(1);
    if (!PERIOD.has(String(pStr)) || !TF.has(String(tf))) return usage(ctx);

    const stop = startTyping(ctx);
    try {
      const period = Number(pStr);
      const top = await runScan(cfg, period, tf!);
      if (!top.length) return ctx.reply('No results. Try a different timeframe.');

      const rows = top.map((r) => {
        const dp = dpForPrice(r.price);
        const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
        const fmtE = new Intl.NumberFormat('en-US', { minimumFractionDigits: Math.min(4, dp), maximumFractionDigits: Math.min(4, dp) });
        return `• ${r.symbol.padEnd(10)}  ${r.distPct.toFixed(2).padStart(6)}%  P:${fmt.format(r.price)}  EMA:${fmtE.format(r.ema)}`;
      });

      return ctx.reply(
        `📊 Top pairs closest to EMA${period} on ${tf}\n` +
        rows.join('\n') +
        `\n\n⚠️ Not financial advice — trade carefully and manage risk.`
      );
    } finally {
      stop();
    }
  });

  // Plain text: ema 200 4h
  bot.hears(/^ema\s+(50|100|200)\s+(5m|15m|1h|2h|4h|1d)$/i, async (ctx) => {
    const [, pStr, tf] = ctx.match as RegExpMatchArray;

    const stop = startTyping(ctx);
    try {
      const period = Number(pStr);
      const top = await runScan(cfg, period, tf);
      if (!top.length) return ctx.reply('No results. Try a different timeframe.');

      const rows = top.map((r) => {
        const dp = dpForPrice(r.price);
        const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
        const fmtE = new Intl.NumberFormat('en-US', { minimumFractionDigits: Math.min(4, dp), maximumFractionDigits: Math.min(4, dp) });
        return `• ${r.symbol.padEnd(10)}  ${r.distPct.toFixed(2).padStart(6)}%  P:${fmt.format(r.price)}  EMA:${fmtE.format(r.ema)}`;
      });

      return ctx.reply(
        `📊 Top pairs closest to EMA${period} on ${tf}\n` +
        rows.join('\n') +
        `\n\n⚠️ Not financial advice — trade carefully and manage risk.`
      );
    } finally {
      stop();
    }
  });
}
