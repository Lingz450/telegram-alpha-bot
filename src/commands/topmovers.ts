// src/commands/topmovers.ts
import { Telegraf, Context } from 'telegraf';
import { makeExchange } from '../exchange/client';

export function registerTopMovers(bot: Telegraf<Context>, cfg: any, _log: any) {
  bot.command('topmovers', async (ctx) => {
    const ex = makeExchange(cfg);
    const tickers = await ex.fetchTickers();
    const arr = Object.entries(tickers)
      .filter(([sym, t]) => sym.endsWith('/USDT'))
      .map(([sym, t]) => ({ sym, change: t.percentage ?? 0 }));

    const top = arr.sort((a, b) => b.change - a.change).slice(0, 5);
    const bottom = arr.sort((a, b) => a.change - b.change).slice(0, 5);

    let msg = '🔥 <b>Top Movers (24h)</b>\n';
    msg += top.map((x, i) => `${i + 1}. ${x.sym} +${x.change.toFixed(2)}%`).join('\n');
    msg += '\n\n❄️ <b>Top Losers (24h)</b>\n';
    msg += bottom.map((x, i) => `${i + 1}. ${x.sym} ${x.change.toFixed(2)}%`).join('\n');

    await ctx.reply(msg, { parse_mode: 'HTML' });
  });
}
