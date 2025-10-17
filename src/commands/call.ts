// src/commands/call.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';
import { requireAdmin } from '../core/permissions';
import { parseKvArgs, parseNumberList } from '../core/parser';
import { normSymbol, prettySymbol } from '../core/symbols';

/** Basic HTML esc */
function esc(s: unknown) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Normalize numeric text like "64,200" -> 64200 */
function toNum(x: unknown): number {
  if (x == null) return NaN;
  const s = String(x).trim().replace(/,/g, '');
  const m = s.match(/^[-+]?\d+(?:\.\d+)?$/);
  return m ? Number(s) : NaN;
}

/** Price DP heuristic */
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
function fmt(p: number) {
  const d = dpForPrice(p);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(p);
}

function usage(ctx: Context) {
  const msg = [
    '<b>Usage</b>',
    'call &lt;pair&gt; entry=&lt;price&gt; sl=&lt;price&gt; lev=&lt;X&gt; tp=&lt;p1,p2,...&gt; [side=long|short]',
    '',
    'Examples:',
    'call BTCUSDT entry=64200 sl=63450 lev=5x tp=64800,65500',
    'call $eth entry=3170 sl=3095 lev=x3 tp=3225|3290|3380 side=long',
  ].join('\n');
  return ctx.reply(msg, { parse_mode: 'HTML' });
}

/** Infer side from targets vs entry */
function inferSide(entry: number, sl: number, tps: number[]): 'long' | 'short' {
  const above = tps.filter(tp => tp > entry).length;
  const below = tps.filter(tp => tp < entry).length;
  if (above > below) return 'long';
  if (below > above) return 'short';
  const avg = tps.length ? tps.reduce((a, b) => a + b, 0) / tps.length : entry;
  return avg >= entry ? 'long' : 'short';
}

function rrLong(entry: number, sl: number, tp: number) {
  const risk = Math.max(entry - sl, 0);
  if (risk <= 0) return NaN;
  return (tp - entry) / risk;
}
function rrShort(entry: number, sl: number, tp: number) {
  const risk = Math.max(sl - entry, 0);
  if (risk <= 0) return NaN;
  return (entry - tp) / risk;
}

async function handleCall(ctx: Context, cfg: Cfg, rawArgs: string) {
  if (!requireAdmin(ctx, cfg)) return;
  if (!rawArgs?.trim()) return usage(ctx);

  // First token: pair (allows $btc, BTC/USDT, btcusdt)
  const [pairRaw0, ...restParts] = rawArgs.trim().split(/\s+/);
  if (!pairRaw0) return usage(ctx);

  const pairRaw = pairRaw0.replace(/^\$/, ''); // drop $prefix if present
  const kvText = restParts.join(' ');

  // Parse key=val args
  const kv = parseKvArgs(kvText);

  const entry = toNum(kv.entry);
  const sl = toNum(kv.sl);

  // lev can be "5", "5x", "x5"
  const levStr = String(kv.lev ?? kv.leverage ?? '1')
    .toLowerCase()
    .replace(/^x/, '')
    .replace(/x$/, '');
  const lev = Number(levStr);

  // Accept commas, pipes, or spaces in tp list
  const rawTp = String(kv.tp ?? kv.tps ?? '');
  const tps = parseNumberList(rawTp.replace(/[| ]/g, ','))
    .map(n => (typeof n === 'number' ? n : toNum(n)))
    .filter(n => Number.isFinite(n));

  if (!Number.isFinite(entry) || entry <= 0) return ctx.reply('❌ Invalid entry price.');
  if (!Number.isFinite(sl) || sl <= 0) return ctx.reply('❌ Invalid SL price.');
  if (!Number.isFinite(lev) || lev <= 0) return ctx.reply('❌ Invalid leverage (use like lev=5x).');
  if (!tps.length) return ctx.reply('❌ Provide at least one TP via tp=..., e.g. tp=64800,65500');

  const symbol = normSymbol(pairRaw, cfg.UNIVERSE_BASE);
  const pretty = prettySymbol(symbol);

  // Side: explicit or inferred
  const side: 'long' | 'short' = /^(long|short)$/i.test(String(kv.side || ''))
    ? (String(kv.side).toLowerCase() as 'long' | 'short')
    : inferSide(entry, sl, tps);

  // Persist (store numbers as strings to fit Prisma.Decimal)
  await prisma.tradeCall.create({
    data: {
      chatId: String(ctx.chat?.id),
      userId: String(ctx.from?.id),
      symbol,
      entry: String(entry),
      sl: String(sl),
      leverage: Math.trunc(lev),
      tps: tps.join(','),
      side,                           // <-- make sure we save the side
      status: 'open',
    },
  });

  // Build a clean, compact card
  const rows: string[] = [];
  rows.push(`📣 <b>TRADE CALL — ${esc(pretty)}</b>`);
  rows.push(`<code>Side</code>    ${esc(side.toUpperCase())}`);
  rows.push(`<code>Entry</code>   ${fmt(entry)}`);
  rows.push(`<code>SL</code>      ${fmt(sl)}`);
  rows.push(`<code>Lev</code>     ${Math.trunc(lev)}x`);
  rows.push(`<code>TPs</code>`);

  for (const tp of tps) {
    const pct =
      side === 'long'
        ? ((tp - entry) / entry) * 100
        : ((entry - tp) / entry) * 100;
    const r = side === 'long' ? rrLong(entry, sl, tp) : rrShort(entry, sl, tp);
    const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    const rrStr = Number.isFinite(r) ? `${r.toFixed(2)}R` : '—';
    rows.push(`  ${fmt(tp)}   (${pctStr}, ${rrStr})`);
  }

  rows.push('');
  rows.push('⚠️ Educational only. Manage risk.');

  return ctx.reply(rows.join('\n'), { parse_mode: 'HTML' });
}

export function registerCall(bot: Telegraf<Context>, cfg: Cfg, _log?: any) {
  // Natural language: "call BTCUSDT entry=... sl=... lev=... tp=..."
  bot.hears(/^call\s+(.+)/i, async (ctx) => {
    const rest = (ctx.match as RegExpMatchArray)[1];
    return handleCall(ctx, cfg, rest);
  });

  // Slash style: "/call BTCUSDT entry=... sl=... lev=... tp=..."
  bot.command('call', async (ctx) => {
    const rest = ((ctx.message as any).text || '').replace(/^\/call\s*/i, '');
    if (!rest) return usage(ctx);
    return handleCall(ctx, cfg, rest);
  });
}
