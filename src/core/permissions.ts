import type { Context } from 'telegraf';
import type { Cfg } from '../config';

export function isAdmin(ctx: Context, cfg: Cfg | (Cfg & { ADMIN_SET: Set<string> })) {
  const uid = String(ctx.from?.id ?? '');
  const cid = String(ctx.chat?.id ?? '');
  const set: Set<string> = (cfg as any).ADMIN_SET ?? new Set<string>();
  return set.has(uid) || set.has(cid);
}
export function requireAdmin(ctx: Context, cfg: Cfg | (Cfg & { ADMIN_SET: Set<string> })) {
  if (isAdmin(ctx, cfg)) return true;
  ctx.reply('Admin only.');
  return false;
}
