// src/chat/freeTalk.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange } from '../exchange/client';
import { ticker } from '../exchange/marketData';
import { toneReply } from '../core/tone';

export function enableFreeChat(bot: Telegraf<Context>, cfg: Cfg, log: any) {
  if (!cfg.CHAT_MODE_ENABLED) return;

  const ex = makeExchange(cfg);

  bot.on('text', async (ctx) => {
    try {
      const text = ctx.message?.text || '';
      const match = text.match(/\$([A-Za-z0-9]{2,10})/);
      if (!match) return;

      const symbol = match[1].toUpperCase();
      const pair = `${symbol}/USDT`;

      const t = await ticker(ex, pair);
      const price = Number(t?.last || t?.close || 0);

      if (!price) return;

      const reply = toneReply(symbol, price);
      await ctx.reply(reply);
    } catch (err) {
      log?.warn?.({ err }, 'free-chat');
    }
  });
}
