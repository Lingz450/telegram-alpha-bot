import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { isAdmin } from '../core/permissions';

export function registerDev(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  bot.command('div', (ctx) => {
    if (!isAdmin(ctx, cfg)) return ctx.reply('Admin only.');
    return ctx.reply('dev hook ok');
  });
}
