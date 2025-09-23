// src/telegram/withTyping.ts
import type { Context } from 'telegraf';

/**
 * Shows Telegram "typing…" while a long task runs.
 * Telegram hides the indicator after ~5s, so we refresh every 4.5s.
 */
export async function withTyping<T>(ctx: Context, task: () => Promise<T>): Promise<T> {
  const chatId = ctx.chat?.id;
  if (!chatId) return task();

  const pulse = setInterval(() => {
    ctx.telegram.sendChatAction(chatId, 'typing').catch(() => {});
  }, 4500);

  // kick off immediately
  ctx.telegram.sendChatAction(chatId, 'typing').catch(() => {});

  try {
    return await task();
  } finally {
    clearInterval(pulse);
  }
}
