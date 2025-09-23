import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange } from '../exchange/client';
import { klines, ticker } from '../exchange/marketData';

export function registerPulse(bot: Telegraf<Context>, cfg: Cfg, _log:any){
  bot.command('pulse', async (ctx)=>{
    const symRaw = ((ctx.message as any).text||'').split(/\s+/)[1];
    if (!symRaw) return ctx.reply('Usage: /pulse BTC');

    try{
      const ex = await makeExchange(cfg);
      const symbol = symRaw.toUpperCase().replace('/','') + (symRaw.toUpperCase().includes(cfg.UNIVERSE_BASE) ? '' : cfg.UNIVERSE_BASE);

      const t = await ticker(ex, symbol).catch(()=>null);
      const last = Number(t?.last ?? 0);
      const vol  = Number(t?.quoteVolume ?? t?.baseVolume ?? 0);

      // daily change via 1d klines if available
      const d = await klines(ex, symbol, '1d' as any, 2).catch(()=>[]);
      let dayChg=0;
      if (d.length>=2){
        const prevClose = d[d.length-2].c;
        const currClose = d[d.length-1].c;
        dayChg = ((currClose - prevClose)/prevClose)*100;
      }

      const lines = [
        `*Pulse — ${symbol}*`,
        `Last: ${last || 'n/a'}`,
        `24h Change: ${Number.isFinite(dayChg) ? dayChg.toFixed(2)+'%' : 'n/a'}`,
        `24h Vol (approx): ${Number.isFinite(vol) ? vol.toFixed(0) : 'n/a'}`,
        '',
        `_Headlines disabled (no API key). This is market pulse only._`
      ];
      return ctx.reply(lines.join('\n'), { parse_mode:'Markdown' });
    } catch {
      return ctx.reply('Could not fetch pulse.');
    }
  });
}
