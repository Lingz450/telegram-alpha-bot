// src/commands/margin.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

function parseKv(msg: string) {
  const out: Record<string,string> = {};
  msg.split(/\s+/).forEach(tok => {
    const m = tok.match(/^([a-zA-Z]+)=(.+)$/);
    if (m) out[m[1].toLowerCase()] = m[2];
  });
  return out;
}
const num = (s?: string) => (s != null ? Number(String(s).replace(/,/g,'')) : NaN);

function usage(ctx: Context) {
  return ctx.reply([
    'Usage:',
    '/margin cmp=<price> sl=<price> risk=<amount> lev=<x>',
    'Example:',
    '/margin cmp=64200 sl=63450 risk=200 lev=5',
  ].join('\n'));
}

export function registerMargin(bot: Telegraf<Context>, _cfg: Cfg, _log: any) {
  bot.command('margin', async (ctx) => {
    const kv = parseKv(((ctx.message as any).text || '').split(/\s+/).slice(1).join(' '));
    const cmp = num(kv.cmp), sl = num(kv.sl), riskAmt = num(kv.risk), lev = Math.max(1, Number(kv.lev) || 1);
    if (![cmp,sl,riskAmt].every(Number.isFinite) || cmp <= 0 || sl <= 0 || riskAmt <= 0) return usage(ctx);

    const stopDist = Math.abs(cmp - sl);
    if (stopDist <= 0) return usage(ctx);

    // Position size in quote currency (USDT) for linear contracts
    const posValue = riskAmt / (stopDist / cmp); // risk = pos * (stopDist/cmp)
    const qty      = posValue / cmp;            // coin size
    const marginReq = posValue / lev;

    const lines = [
      'Position sizing',
      `Price (cmp): ${cmp}`,
      `Stop (sl):   ${sl}  (Δ=${stopDist} | ${(stopDist/cmp*100).toFixed(2)}%)`,
      `Risk:        ${riskAmt}`,
      `Leverage:    ${lev}x`,
      '',
      `Position value: ${posValue.toFixed(2)}`,
      `Quantity:       ${qty.toFixed(6)} (base units)`,
      `Margin needed:  ${marginReq.toFixed(2)}`,
      '',
      'NFA — size responsibly.',
    ];
    return ctx.reply(lines.join('\n'));
  });

  // plain: margin cmp=... sl=... risk=... lev=...
  bot.hears(/^margin\s+/i, (ctx) => {
    (ctx as any).message = { text: (ctx.message as any).text.replace(/^margin\b/i, '/margin') };
    return bot.handleUpdate(ctx.update);
  });
}
