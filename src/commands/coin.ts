// src/commands/coin.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { normSymbol, prettySymbol } from '../core/symbols';
import { makeExchange } from '../exchange/client';
import { ticker } from '../exchange/marketData';

type LogLike = { info?: Function; warn?: Function; error?: Function };

const ALPHA_QUICK_RE = /^\$([A-Za-z0-9\-\/]{2,15})(?:\s+ltf=(5m|15m|1h|2h|4h|1d))?$/i;

function dpFromPrice(p: number) {
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

function nf(dec: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

async function getLastPrice(cfg: Cfg, symbol: string): Promise<number | null> {
  try {
    const ex = makeExchange(cfg);
    const t = await ticker(ex, symbol);
    const last = Number(t?.last ?? t?.close ?? t?.info?.last ?? t?.info?.c ?? NaN);
    return Number.isFinite(last) ? last : null;
  } catch {
    return null;
  }
}

export function registerCoin(bot: Telegraf<Context>, cfg: Cfg, _log: LogLike) {
  // --- IMPORTANT: never clash with alpha’s $symbol quick take ---
  bot.hears(ALPHA_QUICK_RE, async (_ctx, next) => next());

  // 1) "price btc" | "btc price" | "$btc price"
  bot.hears(
    /^(?:price\s+\$?([a-z0-9\-\/]{2,15})|\$?([a-z0-9\-\/]{2,15})\s+price)$/i,
    async (ctx) => {
      const text = ((ctx.message as any).text || '').trim();
      if (ALPHA_QUICK_RE.test(text)) return; // let alpha handle that

      const m = text.match(/^(?:price\s+\$?([a-z0-9\-\/]{2,15})|\$?([a-z0-9\-\/]{2,15})\s+price)$/i);
      const raw = (m?.[1] || m?.[2] || '').toUpperCase();
      if (!raw) return;

      const symbol = normSymbol(raw, cfg.UNIVERSE_BASE);
      const last = await getLastPrice(cfg, symbol);
      if (last == null) return ctx.reply(`Couldn't fetch price for ${symbol}.`);

      const dp = dpFromPrice(last);
      const n = nf(dp);
      return ctx.reply(`👁️ ${prettySymbol(symbol)} price: <b>$${n.format(last)}</b>`, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    }
  );

  // 2) “prices” → quick board for core majors (BTC/ETH/SOL/BNB)
  bot.hears(/^prices?$/i, async (ctx) => {
    const majors = ['BTC', 'ETH', 'SOL', 'BNB'].map(s => `${s}/${cfg.UNIVERSE_BASE}`);
    const outs: string[] = [];
    for (const s of majors) {
      const last = await getLastPrice(cfg, s);
      if (last == null) continue;
      const dp = dpFromPrice(last);
      const n = nf(dp);
      outs.push(`• <b>${prettySymbol(s)}</b>  $${n.format(last)}`);
    }
    if (!outs.length) return ctx.reply('No prices right now, try again.');
    return ctx.reply(outs.join('\n'), { parse_mode: 'HTML' });
  });

  // 3) Friendly “btc dump / pump?” chit-chat (does NOT collide with $btc)
  bot.hears(/^\s*(btc|eth|sol|bnb)\s+(dump|pump)\s*\??$/i, async (ctx) => {
    const [, coin, mood] = ctx.match as RegExpMatchArray;
    const symbol = normSymbol(coin, cfg.UNIVERSE_BASE);
    const last = await getLastPrice(cfg, symbol);
    if (last == null) return ctx.reply(`Couldn't fetch price for ${symbol}.`);
    const dp = dpFromPrice(last);
    const n = nf(dp);
    const bias = mood.toLowerCase() === 'dump' ? 'soft' : 'constructive';
    return ctx.reply(
      `👀 ${prettySymbol(symbol)} $${n.format(last)} — tape feels ${bias}. Use tight risk.`,
      { parse_mode: 'HTML' }
    );
  });

  // 4) Fallback: "price" with no coin
  bot.hears(/^price$/i, (ctx) =>
    ctx.reply('Usage: <code>price btc</code> or <code>$btc price</code>', { parse_mode: 'HTML' })
  );
}
