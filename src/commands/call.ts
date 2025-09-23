// src/commands/call.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';
import { requireAdmin } from '../core/permissions';
import { parseKvArgs, parseNumberList } from '../core/parser';
import { normSymbol, prettySymbol } from '../core/symbols';

function esc(s: unknown) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function fmt(p: number) {
  const nf = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: dpForPrice(p),
    maximumFractionDigits: dpForPrice(p),
  });
  return nf.format(p);
}

function usage(ctx: Context) {
  const msg = [
    '<b>Usage</b>',
    'call &lt;pair&gt; entry=&lt;price&gt; sl=&lt;price&gt; lev=&lt;X&gt; tp=&lt;p1,p2,...&gt; [side=long|short]',
    '',
    'Example:',
    'call BTCUSDT entry=64200 sl=63450 lev=5x tp=64800,65500',
  ].join('\n');
  return ctx.reply(msg, { parse_mode: 'HTML' });
}

function inferSide(entry: number, sl: number, tps: number[]): 'long' | 'short' {
  // If user specified targets mostly above entry, assume long; mostly below → short.
  const above = tps.filter(tp => tp > entry).length;
  const below = tps.filter(tp => tp < entry).length;
  if (above > below) return 'long';
  if (below > above) return 'short';
  // Tie-breaker: distance to SL vs to average TP
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

  // Split once: first token is pair, rest are kv args
  const [pairRaw, ...kvParts] = rawArgs.trim().split(/\s+/);
  if (!pairRaw) return usage(ctx);

  const kv = parseKvArgs(kvParts.join(' '));
  const entry = Number(kv.entry);
  const sl = Number(kv.sl);
  const levStr = String(kv.lev || kv.leverage || '1').toLowerCase().replace(/x$/, '');
  const lev = Number(levStr);
  const tps = parseNumberList(String(kv.tp ?? kv.tps ?? ''));

  if (!Number.isFinite(entry) || entry <= 0) return ctx.reply('Invalid entry price.');
  if (!Number.isFinite(sl) || sl <= 0) return ctx.reply('Invalid SL price.');
  if (!Number.isFinite(lev) || lev <= 0) return ctx.reply('Invalid leverage (use like lev=5x).');
  if (!tps.length) return ctx.reply('Provide at least one TP via tp=..., e.g. tp=64800,65500');

  const symbol = normSymbol(pairRaw, cfg.UNIVERSE_BASE);
  const pretty = prettySymbol(symbol);

  // Side: explicit or inferred
  const side = /^(long|short)$/i.test(String(kv.side || ''))
    ? (String(kv.side).toLowerCase() as 'long' | 'short')
    : inferSide(entry, sl, tps);

  // Persist (Decimal-safe: store numbers as strings)
  await prisma.tradeCall.create({
    data: {
      chatId: String(ctx.chat?.id),
      userId: String(ctx.from?.id),
      symbol,
      entry: String(entry),
      sl: String(sl),
      leverage: Math.trunc(lev),
      tps: tps.join(','),
    },
  });

  // Build card
  const rows: string[] = [];
  rows.push(`<b>TRADE CALL — ${esc(pretty)}</b>`);
  rows.push(`<code>Side</code>    ${esc(side.toUpperCase())}`);
  rows.push(`<code>Entry</code>   ${fmt(entry)}`);
  rows.push(`<code>SL</code>      ${fmt(sl)}`);
  rows.push(`<code>Lev</code>     ${Math.trunc(lev)}x`);

  // Targets with % and R:R
  rows.push(`<code>TPs</code>`);
  for (const tp of tps) {
    const pct = side === 'long'
      ? ((tp - entry) / entry) * 100
      : ((entry - tp) / entry) * 100;
    const r =
      side === 'long' ? rrLong(entry, sl, tp) : rrShort(entry, sl, tp);
    const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    const rrStr = Number.isFinite(r) ? `${r.toFixed(2)}R` : '—';
    rows.push(`  ${fmt(tp)}   (${pctStr}, ${rrStr})`);
  }

  rows.push('');
  rows.push('⚠️ Not financial advice. Manage risk.');

  return ctx.reply(rows.join('\n'), { parse_mode: 'HTML' });
}

export function registerCall(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // Plain text style
  bot.hears(/^call\s+(.+)/i, async (ctx) => {
    const rest = (ctx.match as RegExpMatchArray)[1];
    return handleCall(ctx, cfg, rest);
  });

  // Slash style
  bot.command('call', async (ctx) => {
    const rest = ((ctx.message as any).text || '').replace(/^\/call\s*/i, '');
    if (!rest) return usage(ctx);
    return handleCall(ctx, cfg, rest);
  });
}
