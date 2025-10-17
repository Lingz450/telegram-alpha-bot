// src/commands/atrbreak.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange, getTop100Symbols } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { atr } from '../indicators/atr';

const TF_SET = new Set(['5m', '15m', '1h', '2h', '4h', '1d'] as const);

function esc(s: unknown) {
  return String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]!));
}

function usage(ctx: Context) {
  const msg = [
    '<b>ATR Breakout Scanner</b>',
    'Find symbols where the latest candle range is large relative to ATR.',
    '',
    '<b>Usage</b>',
    'atrbreak &lt;tf&gt; &lt;top|bottom&gt; [k=&lt;threshold&gt;]',
    '',
    '<b>Examples</b>',
    'atrbreak 1h top k=1.5',
    'atrbreak 15m bottom',
    '',
    'Defaults: tf=1h, side=top, k=1.5',
  ].join('\n');
  return ctx.reply(msg, { parse_mode: 'HTML' });
}

async function runScan(cfg: Cfg, tf: string, side: 'top' | 'bottom', k: number) {
  const ex = makeExchange(cfg);
  const universe = await getTop100Symbols(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT);

  const out: { symbol: string; ratio: number; range: number }[] = [];

  for (const sym of universe) {
    try {
      const rows = await klines(ex, sym, tf as any, 220);
      if (!rows || rows.length < 50) continue;

      // ATR(14) using the same helper signature used elsewhere: atr(rows, period)
      const a14 = atr(rows, 14);
      const lastAtr = a14.at(-1);
      const last = rows.at(-1)!; // {h,l,c,...}

      if (!lastAtr || !Number.isFinite(lastAtr) || lastAtr <= 0) continue;

      const range = Number(last.h) - Number(last.l);
      if (!Number.isFinite(range) || range <= 0) continue;

      const ratio = range / Number(lastAtr);
      out.push({ symbol: sym, ratio, range });
    } catch {
      // skip symbol if anything fails (network, bad data, etc.)
    }
  }

  // Rank & filter
  const sorted = out.sort((a, b) =>
    side === 'top' ? b.ratio - a.ratio : a.ratio - b.ratio
  );

  const filtered = side === 'top' ? sorted.filter((r) => r.ratio >= k) : sorted;
  const top = (filtered.length ? filtered : sorted).slice(0, 10);

  return top;
}

export function registerATRBreak(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // Natural text: "atrbreak 1h top k=1.5"
  bot.hears(/^atrbreak(?:\s+(.+))?$/i, async (ctx) => {
    const args = ((ctx.match as RegExpMatchArray)[1] || '').trim();

    if (!args) {
      // Defaults with no args
      const tf = '1h', side: 'top' | 'bottom' = 'top', k = 1.5;
      const list = await runScan(cfg, tf, side, k);
      if (!list.length) return ctx.reply('No ATR signals right now.');
      const lines = list.map(
        (r) => `• <b>${esc(r.symbol)}</b> — ratio <code>${r.ratio.toFixed(2)}</code>, range <code>${r.range.toFixed(6)}</code>`
      );
      const msg = `📈 <b>ATR Breakout — ${esc(tf)}</b>\n<b>Side:</b> ${esc(side)}  <b>k:</b> ${k}\n\n` + lines.join('\n');
      return ctx.reply(msg, { parse_mode: 'HTML' });
    }

    // Parse args
    const parts = args.split(/\s+/);
    let tf = '1h';
    let side: 'top' | 'bottom' = 'top';
    let k = 1.5;

    // first two tokens can be tf and side in any order
    for (const p of parts) {
      if (TF_SET.has(p as any)) tf = p as any;
      else if (/^(top|bottom)$/i.test(p)) side = p.toLowerCase() as any;
      else if (/^k=\d+(\.\d+)?$/i.test(p)) k = Number(p.split('=')[1]);
    }

    if (!TF_SET.has(tf as any)) return usage(ctx);

    const list = await runScan(cfg, tf, side, k);
    if (!list.length) return ctx.reply('No ATR signals right now.');

    const lines = list.map(
      (r) => `• <b>${esc(r.symbol)}</b> — ratio <code>${r.ratio.toFixed(2)}</code>, range <code>${r.range.toFixed(6)}</code>`
    );
    const msg = `📈 <b>ATR Breakout — ${esc(tf)}</b>\n<b>Side:</b> ${esc(side)}  <b>k:</b> ${k}\n\n` + lines.join('\n');
    return ctx.reply(msg, { parse_mode: 'HTML' });
  });

  // Slash: "/atrbreak 1h top k=1.5"
  bot.command('atrbreak', async (ctx) => {
    const raw = ((ctx.message as any).text || '').replace(/^\/atrbreak\s*/i, '').trim();
    if (!raw) return usage(ctx);

    const parts = raw.split(/\s+/);
    let tf = '1h';
    let side: 'top' | 'bottom' = 'top';
    let k = 1.5;

    for (const p of parts) {
      if (TF_SET.has(p as any)) tf = p as any;
      else if (/^(top|bottom)$/i.test(p)) side = p.toLowerCase() as any;
      else if (/^k=\d+(\.\d+)?$/i.test(p)) k = Number(p.split('=')[1]);
    }

    if (!TF_SET.has(tf as any)) return usage(ctx);

    const list = await runScan(cfg, tf, side, k);
    if (!list.length) return ctx.reply('No ATR signals right now.');

    const lines = list.map(
      (r) => `• <b>${esc(r.symbol)}</b> — ratio <code>${r.ratio.toFixed(2)}</code>, range <code>${r.range.toFixed(6)}</code>`
    );
    const msg = `📈 <b>ATR Breakout — ${esc(tf)}</b>\n<b>Side:</b> ${esc(side)}  <b>k:</b> ${k}\n\n` + lines.join('\n');
    return ctx.reply(msg, { parse_mode: 'HTML' });
  });
}
