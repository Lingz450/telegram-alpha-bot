import { Telegraf, Context, Markup } from 'telegraf';
import type { Cfg } from '../config';
import { registerRSI } from './rsi'; // keep your existing scanner

export function registerRSIPicker(bot: Telegraf<Context>, cfg: Cfg, log: any) {
  // If user types only /rsi, show a picker
  bot.command('rsi', async (ctx, next) => {
    const args = ((ctx.message as any).text || '').split(/\s+/).slice(1);
    if (args.length >= 2) return next(); // existing /rsi handler will process

    const tfButtons = ['15m','1h','2h','4h','1d'].map(tf =>
      Markup.button.callback(tf, `rsi:tf:${tf}`)
    );
    const typeButtons = ['overbought','oversold'].map(t =>
      Markup.button.callback(t, `rsi:kind:${t}`)
    );

    await ctx.reply('Pick timeframe:', {
      reply_markup: Markup.inlineKeyboard(tfButtons, { columns: 5 }).reply_markup
    });
    await ctx.reply('Pick type:', {
      reply_markup: Markup.inlineKeyboard(typeButtons, { columns: 2 }).reply_markup
    });
  });

  // Memory per user for the two clicks
  const picks = new Map<string, Partial<{ tf: string; kind: string }>>();

  bot.action(/rsi:(tf|kind):(.+)/, async (ctx) => {
    const [, which, val] = (ctx.match as RegExpMatchArray);
    const key = String(ctx.from?.id);
    const cur = picks.get(key) || {};
    (cur as any)[which] = val;
    picks.set(key, cur);

    await ctx.answerCbQuery(`Selected ${which}: ${val}`);

    if (cur.tf && cur.kind) {
      // Replay command so your original /rsi handler runs
      await ctx.reply(`/rsi ${cur.tf} ${cur.kind}`);
      picks.delete(key);
    }
  });

  // keep the existing scanner
  registerRSI(bot, cfg, log);
  log?.info?.('rsi picker ready');
}
