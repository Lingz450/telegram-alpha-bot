import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

function parseArgs(text: string) {
  // /plan symbol:BTC entry:64000 sl:63000 rr:2 lev:5x risk:50 fee:0.08%
  const m = new Map<string,string>();
  for (const part of text.split(/\s+/).slice(1)) {
    const [k, v] = part.split(':');
    if (k && v) m.set(k.toLowerCase(), v);
  }
  return m;
}

function pctStr(n:number){ return `${n.toFixed(2)}%`; }

export function registerPlan(bot: Telegraf<Context>, _cfg: Cfg, _log:any){
  bot.command('plan', async (ctx)=>{
    const text = ((ctx.message as any).text||'').trim();
    const args = parseArgs(text);

    const sym = (args.get('symbol') || args.get('s') || '').toUpperCase().replace('/','');
    const entry = Number(args.get('entry'));
    const sl    = Number(args.get('sl'));
    const rr    = Number(args.get('rr') ?? 2);
    const lev   = Number((args.get('lev')||'1x').replace(/x/i,''));
    const risk  = Number(args.get('risk') ?? 50); // risk in quote currency
    const feePc = Number((args.get('fee')||'0.08%').replace('%','')); // taker per side

    if (!sym || !isFinite(entry) || !isFinite(sl) || entry<=0 || sl<=0) {
      return ctx.reply('Usage: /plan symbol:BTC entry:64000 sl:63000 rr:2 lev:5x risk:50 fee:0.08%');
    }

    const long = entry > sl;
    const stopPct = Math.abs((entry - sl) / entry);
    if (stopPct <= 0) return ctx.reply('Bad SL vs entry.');

    const notional = risk / stopPct;      // unlevered notional to risk that amount
    const withLev  = notional * lev;
    const qty      = withLev / entry;

    const tp = long
      ? entry + rr * (entry - sl)
      : entry - rr * (sl - entry);

    const movePct = Math.abs((tp - entry)/entry) * 100;
    const fees = withLev * (feePc/100) * 2; // entry+exit

    const pnl = (tp - entry) * qty * (long?1:-1) - fees;
    const rrReal = Math.abs(pnl / risk);

    const lines = [
      `*Plan — ${sym}*`,
      `\`Entry\`  ${entry}`,
      `\`SL\`     ${sl}  (risk ${pctStr(stopPct*100)})`,
      `\`TP\`     ${tp.toFixed(6)}  (move ${pctStr(movePct)})`,
      '',
      `\`Lev\`    ${lev}x`,
      `\`Risk\`   ${risk.toFixed(2)}`,
      `\`Size\`   Notional=${withLev.toFixed(2)}  Qty=${qty.toFixed(6)}`,
      `\`Fees\`   ≈ ${fees.toFixed(2)} (at ${feePc}%/side)`,
      `\`Est PnL\` ${pnl.toFixed(2)}  (RR≈${rrReal.toFixed(2)}:1)`,
    ];
    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
  });
}
