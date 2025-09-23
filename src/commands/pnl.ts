// src/commands/pnl.ts
import { Telegraf, Context } from 'telegraf';

function usage(ctx: Context) {
  return ctx.reply([
    'Usage:',
    '/pnl entry=<price> qty=<amount> last=<price> [side=long|short]',
    'Example:',
    '/pnl entry=0.035 qty=12000 last=0.036 side=long',
  ].join('\n'));
}

function parseKv(msg: string) {
  const out: Record<string,string> = {};
  msg.split(/\s+/).forEach(tok => {
    const m = tok.match(/^([a-zA-Z]+)=(.+)$/);
    if (m) out[m[1].toLowerCase()] = m[2];
  });
  return out;
}

export function registerPnL(bot: Telegraf<Context>, _cfg: any, _log: any) {
  bot.command('pnl', (ctx) => {
    const kv = parseKv(((ctx.message as any).text || '').split(/\s+/).slice(1).join(' '));
    const entry = Number(kv.entry), qty = Number(kv.qty), last = Number(kv.last);
    const side = (kv.side || 'long').toLowerCase();
    if (![entry, qty, last].every(Number.isFinite) || qty <= 0 || entry <= 0 || last <= 0 || !['long','short'].includes(side))
      return usage(ctx);

    const dir = side === 'long' ? 1 : -1;
    const pnl = (last - entry) * qty * dir;
    const retPct = ((last - entry) / entry) * 100 * dir;

    return ctx.reply([
      `PnL (${side})`,
      `Entry: ${entry}`,
      `Last:  ${last}`,
      `Qty:   ${qty}`,
      '',
      `PnL:   ${pnl.toFixed(4)}`,
      `Return: ${retPct.toFixed(2)}%`,
      '',
      'NFA — manage risk.',
    ].join('\n'));
  });

  // plain
  bot.hears(/^pnl\s+/i, (ctx) => {
    (ctx as any).message = { text: (ctx.message as any).text.replace(/^pnl\b/i, '/pnl') };
    return bot.handleUpdate(ctx.update);
  });
}
