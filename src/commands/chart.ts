// src/commands/chart.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

import { normSymbol } from '../core/symbols';
import { makeExchange } from '../exchange/client';
import { klines } from '../exchange/marketData';
import { renderChart } from '../charts/chartRenderer';

const TF = new Set(['5m', '15m', '1h', '2h', '4h', '1d'] as const);
type TFType = '5m' | '15m' | '1h' | '2h' | '4h' | '1d';

// Re-usable typing indicator (uploading photo)
function startUploading(ctx: Context) {
  const chatId = ctx.chat?.id!;
  let killed = false;
  const tick = async () => {
    if (killed) return;
    try {
      await ctx.telegram.sendChatAction(chatId, 'upload_photo');
    } catch { /* ignore */ }
  };
  tick();
  const iv = setInterval(tick, 4500); // Telegram clears action after ~5s
  return () => { killed = true; clearInterval(iv); };
}

async function handleChart(ctx: Context, cfg: Cfg, rawSym: string, tfRaw?: string) {
  const stopIndicator = startUploading(ctx);
  try {
    const tf = (tfRaw && TF.has(tfRaw as TFType) ? tfRaw : '1h') as TFType;
    const symbol = normSymbol(rawSym, cfg.UNIVERSE_BASE);

    const ex = makeExchange(cfg); // sync creator (we await inside klines)
    const k = await klines(ex, symbol, tf, 300);

    if (!k?.length) {
      stopIndicator();
      return ctx.reply(
        'No candles for that symbol/timeframe. Try another TF, e.g. /chart BTC ltf=1h'
      );
    }

    const png = await renderChart({
      symbol,
      timeframe: tf,
      candles: k.map(x => ({ t: x.t, o: x.o, h: x.h, l: x.l, c: x.c })),
    });

    stopIndicator();
    return ctx.replyWithPhoto({ source: png }, { caption: `${symbol} ${tf} — quick chart` });
  } catch {
    stopIndicator();
    return ctx.reply('Couldn’t render chart. Example: /chart ETH ltf=1h');
  }
}

export function registerChart(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // Slash command: /chart BTC ltf=1h
  bot.command('chart', async (ctx) => {
    const parts = ((ctx.message as any).text || '').trim().split(/\s+/).slice(1);
    if (!parts.length) {
      return ctx.reply('Usage: /chart BTC [ltf=5m|15m|1h|2h|4h|1d]');
    }
    const sym = parts[0];
    const tfArg = parts.find(p => /^ltf=/.test(p));
    const tf = tfArg ? tfArg.split('=')[1] : undefined;
    return handleChart(ctx, cfg, sym, tf);
  });

  // Plain text: chart BTC ltf=1h
  bot.hears(/^chart\s+([A-Za-z0-9\-\/]+)(?:\s+ltf=(5m|15m|1h|2h|4h|1d))?$/i, async (ctx) => {
    const [, raw, tf] = ctx.match as RegExpMatchArray;
    return handleChart(ctx, cfg, raw, tf);
  });
}
