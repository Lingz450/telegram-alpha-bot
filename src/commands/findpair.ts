// src/commands/findpair.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange, getTop100Symbols } from '../exchange/client';
import { ticker } from '../exchange/marketData';

function parseHumanPrice(s: string): number | null {
  const raw = s.trim().toLowerCase().replace(/[, ]/g, '');
  const m = raw.match(/^(\d+(?:\.\d+)?)([kmb])?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const mul = m[2]?.toLowerCase() === 'k' ? 1e3 : m[2]?.toLowerCase() === 'm' ? 1e6 : m[2]?.toLowerCase() === 'b' ? 1e9 : 1;
  return Number.isFinite(n) ? n * mul : null;
}

function startTyping(ctx: Context) {
  const id = ctx.chat?.id!;
  let killed = false;
  const ping = async () => { if (!killed) try { await ctx.telegram.sendChatAction(id,'typing'); } catch {} };
  ping(); const iv = setInterval(ping, 4500);
  return () => { killed = true; clearInterval(iv); };
}

export function registerFindPair(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  bot.command('findpair', async (ctx) => {
    const stop = startTyping(ctx);
    try {
      const [priceRaw] = ((ctx.message as any).text || '').trim().split(/\s+/).slice(1);
      const target = parseHumanPrice(priceRaw || '');
      if (!target) { stop(); return ctx.reply('Usage: /findpair <price>  (e.g. /findpair 0.02 or /findpair 65k)'); }

      const ex = makeExchange(cfg);
      const uni = await getTop100Symbols(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT);

      const CONC = 8;
      let i = 0;
      const rows: { symbol: string; last: number; diff: number; pct: number }[] = [];
      async function worker() {
        while (i < uni.length) {
          const s = uni[i++]; 
          try {
            const t = await ticker(ex, s);
            const last = Number(t.last);
            if (!Number.isFinite(last)) continue;
            const diff = Math.abs(last - target);
            const pct  = (diff / target) * 100;
            rows.push({ symbol: s, last, diff, pct });
          } catch {}
        }
      }
      await Promise.all(Array.from({length: CONC}, worker as any));
      rows.sort((a,b)=>a.diff-b.diff);

      const top = rows.slice(0, 8)
        .map(r => `- ${r.symbol}  last=${r.last}  Δ=${r.diff.toExponential(2)} (${r.pct.toFixed(3)}%)`);

      stop();
      return ctx.reply([`Closest to ${target}:`, ...top].join('\n'));
    } catch {
      stop();
      return ctx.reply('Usage: /findpair <price>');
    }
  });

  // plain: findpair 0.02
  bot.hears(/^findpair\s+([\d.,]+[kKmMbB]?)$/i, async (ctx) => {
    (ctx as any).message = { text: `/findpair ${(ctx.match as any)[1]}` };
    return bot.handleUpdate(ctx.update);
  });
}
