// src/commands/list_admins.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

function nameOf(user: any) {
  const handle = user?.username ? `@${user.username}` : '';
  const full = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  return handle || full || '(no name)';
}

function statusOf(s?: string) {
  // creator | administrator | member | restricted | left | kicked
  return (s || 'unknown').replace(/_/g, ' ');
}

/**
 * /list_admins (run inside a group/supergroup)
 * - Only the OWNER_ID can run it (if OWNER_ID is set). If OWNER_ID is unset, anyone can run (bootstrap).
 * - Prints each admin's user_id + name, and an .env-ready ADMIN_USER_IDS line.
 */
export function registerListAdmins(bot: Telegraf<Context>, cfg: Cfg) {
  bot.command('list_admins', async (ctx) => {
    try {
      const uid = String(ctx.from?.id ?? '');
      const chatId = String(ctx.chat?.id ?? '');
      const chatType = (ctx.chat as any)?.type || '';
      const title = (ctx.chat as any)?.title || '';

      // Permission: if OWNER_ID is configured, only owner can run
      if (cfg.OWNER_ID && uid !== cfg.OWNER_ID) {
        return ctx.reply('Owner only.');
      }

      // Must be run in a group/supergroup to enumerate admins
      if (!chatType || chatType === 'private') {
        return ctx.reply('Use `/list_admins` inside the group you want to configure.', {
          parse_mode: 'Markdown',
        });
      }

      // Fetch admins
      let admins: any[];
      try {
        admins = await ctx.getChatAdministrators();
      } catch (e) {
        return ctx.reply(
          'I need permission to view the member list. Make sure the bot is in the group and can read members.'
        );
      }

      if (!admins?.length) {
        return ctx.reply('No admins found (weird, but okay).');
      }

      // Build lines and env snippet
      const lines = admins.map((a) => {
        const user = a.user;
        const label = nameOf(user);
        const st = statusOf(a.status);
        const anon = user?.is_bot ? ' (bot)' : '';
        // FYI: Anonymous admins show up as "is_anonymous" in some contexts; user.id still not your real id.
        const maybeAnon = (a as any)?.is_anonymous ? ' (anonymous admin)' : '';
        return `- ${label}${anon}${maybeAnon}  \`${user.id}\`  ${st}`;
      });

      const ids = admins.map((a) => String(a.user.id)).join(',');

      const msg = [
        `*Admins for this chat*`,
        `\`chat_id\`  ${chatId} ${title ? `(${title})` : ''}`,
        '',
        lines.join('\n'),
        '',
        'Add to `.env` (example):',
        `\`ADMIN_USER_IDS=${ids}\``,
        `\`ADMIN_CHAT_IDS=${chatId}\`   # optional: allow admin-only commands in this chat`,
        '',
        '_Note: If your account is set to **Remain Anonymous** in this group, Telegram hides your real user_id. Turn that off temporarily or DM the bot `/whoami` to get your id._',
      ].join('\n');

      return ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch {
      return ctx.reply('Could not list admins (permissions or Telegram API issue).');
    }
  });

  // Optional plain-text alias
  bot.hears(/^list[_ ]admins$/i, async (ctx) => {
    (ctx as any).message.text = '/list_admins';
    return (bot as any).handleUpdate(ctx.update);
  });
}
