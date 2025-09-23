// src/core/ui.ts
import type { Context } from 'telegraf';

export const NFA_POPUP =
  '⚠️ Trading involves risk. This bot provides educational info only — not financial advice. Do your own research and manage risk.';

export function nfaKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: 'Disclaimer', callback_data: 'nfa' }]],
    },
  } as const;
}

/** Best-effort typing indicator (don’t await, just fire & forget). */
export function showTyping(ctx: Context) {
  try { void ctx.sendChatAction('typing'); } catch {}
}
