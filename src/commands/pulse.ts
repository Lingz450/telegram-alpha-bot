import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange } from '../exchange/client';
import { ticker } from '../exchange/marketData';
import { normSymbol, prettySymbol } from '../core/symbols';

const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function fmtUSD(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '-';
  const abs = Math.abs(n);
  return abs >= 1000 ? `$${nf0.format(n)}` : `$${nf2.format(n)}`;
}
function fmtPct(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '-';
  const s = n >= 0 ? '+' : '';
  return `${s}${nf2.format(n)}%`;
}
function card(symbol: string, last?: number | null, pct?: number | null, low?: number | null, high?: number | null) {
  return [
    `🧭 **${prettySymbol(symbol)}**`,
    `• Price: ${fmtUSD(last)}  (${fmtPct(pct)})`,
    `• Day Range: ${fmtUSD(low)} → ${fmtUSD(high)}`,
    '',
    '_⚠️ Educational only. Not financial advice._',
  ].join('\n');
}

export function registerPulse(bot: Telegraf<Context>, cfg: Cfg) {
  bot.command('pulse', async (ctx) => {
    const parts = ((ctx.message as any).text || '').split(/\s+/).slice(1);
    const list = parts.length
      ? parts
      : (process.env.PULSE_SYMBOLS || 'BTC,ETH,SOL,BNB').split(',').map(s => s.trim());
    const ex = makeExchange(cfg);

    for (const raw of list) {
      const sym = normSymbol(raw, cfg.UNIVERSE_BASE);
      try {
        const t = await ticker(ex, sym);
        const last = Number(t?.last ?? t?.close ?? t?.info?.last ?? t?.info?.c ?? NaN);
        const pct  = Number(t?.percentage ?? t?.info?.priceChangePercent ?? NaN);
        const high = Number(t?.high ?? t?.info?.high ?? t?.info?.h ?? NaN);
        const low  = Number(t?.low ?? t?.info?.low ?? t?.info?.l ?? NaN);

        await ctx.reply(
          card(sym,
               Number.isFinite(last) ? last : null,
               Number.isFinite(pct)  ? pct  : null,
               Number.isFinite(low)  ? low  : null,
               Number.isFinite(high) ? high : null),
          { parse_mode: 'Markdown' }
        );
      } catch {
        await ctx.reply(`Couldn’t fetch ${prettySymbol(sym)} right now.`);
      }
    }
  });
}
