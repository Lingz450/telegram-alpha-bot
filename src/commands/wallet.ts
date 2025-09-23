import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

export function registerWallet(bot: Telegraf<Context>, _cfg: Cfg, _log: any) {
  bot.hears(/^wallet$/i, (ctx) => {
    ctx.reply('Wallet view (AI trades) not implemented yet in V1.');
  });
}
