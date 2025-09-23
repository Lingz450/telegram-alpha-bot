import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';

function norm(sym:string, base:string){ 
  const s = sym.toUpperCase().replace('/',''); 
  return s.endsWith(base) ? s : s + base;
}

export function registerWatch(bot: Telegraf<Context>, cfg: Cfg, _log:any){
  bot.hears(/^watch\s+add\s+(.+)$/i, async (ctx)=>{
    const list = (ctx.match as RegExpMatchArray)[1].split(/\s+/).slice(0,30);
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const base = cfg.UNIVERSE_BASE;

    let added=0;
    for (const raw of list){
      const symbol = norm(raw, base);
      try{
        await prisma.watchItem.create({ data:{ chatId, userId, symbol } });
        added++;
      }catch{ /* unique dup */ }
    }
    return ctx.reply(`Watchlist: added ${added}/${list.length}`);
  });

  bot.hears(/^watch\s+rm\s+(.+)$/i, async (ctx)=>{
    const list = (ctx.match as RegExpMatchArray)[1].split(/\s+/);
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const base = cfg.UNIVERSE_BASE;

    let removed=0;
    for (const raw of list){
      const symbol = norm(raw, base);
      const r = await prisma.watchItem.deleteMany({ where:{ chatId, userId, symbol } });
      removed += r.count;
    }
    return ctx.reply(`Watchlist: removed ${removed}`);
  });

  bot.hears(/^watch\s+clear$/i, async (ctx)=>{
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const r = await prisma.watchItem.deleteMany({ where:{ chatId, userId } });
    return ctx.reply(`Watchlist cleared (${r.count})`);
  });

  bot.hears(/^watch\s+show$/i, async (ctx)=>{
    const chatId = String(ctx.chat?.id);
    const userId = String(ctx.from?.id);
    const items = await prisma.watchItem.findMany({ where:{ chatId, userId }, orderBy:{ createdAt:'asc' } });
    if (!items.length) return ctx.reply('Watchlist empty. Use: watch add BTC ETH SOL');
    const lines = items.map((w,i)=> `${i+1}. ${w.symbol}`);
    return ctx.reply(['*Your watchlist*', ...lines].join('\n'), { parse_mode:'Markdown' });
  });
}
