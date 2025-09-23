// src/commands/rsi.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange, getTop100Symbols } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { rsi } from '../indicators/rsi';

const TF = new Set(['5m', '15m', '1h', '2h', '4h', '1d']);
const KIND = new Set(['overbought', 'oversold']);

// Show "typing…" while long tasks run
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
  return ctx.reply('Usage: /rsi <5m|15m|1h|2h|4h|1d> <overbought|oversold>\nExample: /rsi 1h overbought');
}

// Simple bounded concurrency helper
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
      try { out[idx] = await worker(items[idx], idx); }
      catch { out[idx] = null; }
    }
  }
  for (let c = 0; c < Math.max(1, limit); c++) runners.push(run());
  await Promise.all(runners);
  return out.filter((x): x is R => x !== null);
}

async function scanRSI(cfg: Cfg, tf: string, kind: 'overbought' | 'oversold') {
  const ex = makeExchange(cfg); // sync creator
  const universe = await getTop100Symbols(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT);

  type Row = { symbol: string; rsi: number };

  // Tune concurrency (5–8 is a good range for public endpoints)
  const CONCURRENCY = 6;

  const rows = await mapLimit<string, Row>(universe, CONCURRENCY, async (sym) => {
    try {
      const k = await klines(ex, sym, tf as any, 300);
      const closes = k.map(x => x.c);
      if (closes.length < 30) return null;
      const series = rsi(closes, 14);
      const val = series.at(-1);
      if (!val || !Number.isFinite(val)) return null;
      return { symbol: sym, rsi: val };
    } catch {
      return null;
    }
  });

  const sorted = kind === 'overbought'
    ? rows.sort((a, b) => b.rsi - a.rsi)
    : rows.sort((a, b) => a.rsi - b.rsi);

  return sorted.slice(0, 15);
}

function rsiEmoji(v: number): string {
  if (v >= 70) return '🔥';
  if (v >= 60) return '⬆️';
  if (v <= 30) return '🧊';
  if (v <= 40) return '⬇️';
  return '➖';
}

export function registerRSI(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // Slash style: /rsi 1h overbought
  bot.command('rsi', async (ctx) => {
    const [tfRaw, kindRaw] = ((ctx.message as any).text || '').split(/\s+/).slice(1);
    const tf = (tfRaw || '').toLowerCase();
    const kind = (kindRaw || '').toLowerCase();

    if (!TF.has(tf) || !KIND.has(kind)) return usage(ctx);

    const stop = startTyping(ctx);
    try {
      const top = await scanRSI(cfg, tf, kind as 'overbought' | 'oversold');
      if (!top.length) return ctx.reply('No results. Try a different timeframe.');

      const lines = top.map(r => {
        const emoji = rsiEmoji(r.rsi);
        return `• ${r.symbol.padEnd(10)}  RSI=${r.rsi.toFixed(2).padStart(6)} ${emoji}`;
      });

      return ctx.reply(
        `📈 RSI ${tf} — ${kind}\n` +
        lines.join('\n') +
        `\n\n⚠️ Not financial advice — trade carefully and manage risk.`
      );
    } finally {
      stop();
    }
  });

  // Plain text style: rsi 1h overbought
  bot.hears(/^rsi\s+(5m|15m|1h|2h|4h|1d)\s+(overbought|oversold)$/i, async (ctx) => {
    const [, tf, kind] = ctx.match as RegExpMatchArray;

    const stop = startTyping(ctx);
    try {
      const top = await scanRSI(cfg, tf.toLowerCase(), kind.toLowerCase() as 'overbought' | 'oversold');
      if (!top.length) return ctx.reply('No results. Try a different timeframe.');

      const lines = top.map(r => {
        const emoji = rsiEmoji(r.rsi);
        return `• ${r.symbol.padEnd(10)}  RSI=${r.rsi.toFixed(2).padStart(6)} ${emoji}`;
      });

      return ctx.reply(
        `📈 RSI ${tf} — ${kind.toLowerCase()}\n` +
        lines.join('\n') +
        `\n\n⚠️ Not financial advice — trade carefully and manage risk.`
      );
    } finally {
      stop();
    }
  });
}
