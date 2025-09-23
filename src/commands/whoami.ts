import { Telegraf, Context } from 'telegraf';

export function registerWhoAmI(bot: Telegraf<Context>) {
  bot.command('whoami', async (ctx) => {
    const uid = String(ctx.from?.id ?? '');
    const uname = ctx.from?.username ? `@${ctx.from.username}` : '';
    const chatId = String(ctx.chat?.id ?? '');
    const title = (ctx.chat as any)?.title || '';

    const lines = [
      'Who am I',
      `user_id  ${uid} ${uname}`,
      `chat_id  ${chatId} ${title ? `(${title})` : ''}`,
      '',
      'Add these to .env:',
      `ADMIN_IDS=${uid}`
    ];
    return ctx.reply(lines.join('\n'));
  });
}
