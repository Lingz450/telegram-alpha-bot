// src/telegram/withNfa.ts
import { Telegraf } from 'telegraf';
import { NFA_TEXT } from '../utils/nfa';

export function wireNfaAction(bot: Telegraf) {
  bot.action('nfa', async (ctx) => {
    try { await ctx.answerCbQuery(NFA_TEXT, { show_alert: true }); } catch {}
  });
}
