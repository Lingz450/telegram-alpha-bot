// src/commands/giveaway.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';
import { isAdmin } from '../core/permissions';

function usage(ctx: Context) {
  return ctx.reply([
    'Usage:',
    '/giveaway <durationSec> <prize> winners=N',
    'Example:',
    '/giveaway 3600 $100 winners=3',
    '',
    'Participants use: /enter',
    'Admins draw manually: /draw',
  ].join('\n'));
}

function parseKv(parts: string[]) {
  const out: Record<string,string> = {};
  for (const p of parts) {
    const m = p.match(/^([a-z]+)=(.+)$/i);
    if (m) out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

export function registerGiveaway(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  // create
  bot.command('giveaway', async (ctx) => {
    if (!isAdmin(ctx, cfg)) return ctx.reply('Admin only.');
    const args = ((ctx.message as any).text || '').trim().split(/\s+/).slice(1);
    if (args.length < 2) return usage(ctx);

    const durationSec = Number(args[0]);
    if (!Number.isFinite(durationSec) || durationSec <= 0) return usage(ctx);

    const kv = parseKv(args.slice(2));
    const winners = Math.max(1, Number(kv.winners || 1));
    const prize = args[1];

    const endsAt = new Date(Date.now() + durationSec * 1000);
    const row = await prisma.giveaway.create({
      data: {
        chatId: String(ctx.chat?.id),
        prize,
        winners,
        endsAt,
      }
    });

    return ctx.reply(
      `🎉 Giveaway created!\nPrize: ${prize}\nWinners: ${winners}\nEnds: ${endsAt.toLocaleString()}\n\nParticipants: use /enter`
    );
  });

  // enter
  bot.command('enter', async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const now = new Date();
    const g = await prisma.giveaway.findFirst({ where: { chatId, resolved: false, endsAt: { gt: now } }, orderBy: { createdAt: 'desc' } });
    if (!g) return ctx.reply('No active giveaway.');
    const uid = String(ctx.from?.id);
    const userTag = ctx.from?.username ? `@${ctx.from.username}` : uid;

    const current = g.entrants ? g.entrants.split(',').filter(Boolean) : [];
    if (current.includes(uid)) return ctx.reply('You are already in!');

    current.push(uid);
    await prisma.giveaway.update({ where: { id: g.id }, data: { entrants: current.join(',') } });
    return ctx.reply(`✅ Entered! (${userTag})`);
  });

  // draw (admin)
  bot.command('draw', async (ctx) => {
    if (!isAdmin(ctx, cfg)) return ctx.reply('Admin only.');
    const chatId = String(ctx.chat?.id);
    const g = await prisma.giveaway.findFirst({ where: { chatId, resolved: false }, orderBy: { createdAt: 'desc' } });
    if (!g) return ctx.reply('No active giveaway.');

    const ids = (g.entrants || '').split(',').filter(Boolean);
    if (!ids.length) return ctx.reply('No entrants.');

    // pick winners without replacement
    const winners: string[] = [];
    const pool = [...ids];
    for (let i = 0; i < Math.min(g.winners, pool.length); i++) {
      const j = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(j,1)[0]);
    }

    await prisma.giveaway.update({ where: { id: g.id }, data: { resolved: true } });

    const pretty = winners.map((id) => `<a href="tg://user?id=${id}">${id}</a>`).join(', ');
    return ctx.replyWithHTML(`🎉 Winners for <b>${g.prize}</b>: ${pretty}`);
  });
}
