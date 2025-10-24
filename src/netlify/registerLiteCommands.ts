// Register a subset of commands that are safe for Netlify Functions
// (no long-running loops, no Puppeteer, no Prisma).

import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

import { registerStart } from '../commands/start';
import { registerHelp } from '../commands/help';
import { registerWhoAmI } from '../commands/whoami';
import { registerListAdmins } from '../commands/list_admins';

import { registerAlpha } from '../commands/alpha';
import { registerEMA } from '../commands/ema';
import { registerRSI } from '../commands/rsi';
import { registerATRBreak } from '../commands/atrbreak';
import { registerBacktest } from '../commands/backtest';
import { registerFindPair } from '../commands/findpair';
import { registerMargin } from '../commands/margin';
import { registerPnL } from '../commands/pnl';
import { registerSetup } from '../commands/setup';
import { registerTopMovers } from '../commands/topmovers';
import { registerScore } from '../commands/score';
import { registerWallet } from '../commands/wallet';

export function registerLiteCommands(
  bot: Telegraf<Context>,
  cfg: Cfg,
  log: any
) {
  // Core/help
  registerStart(bot, cfg, log);
  registerHelp(bot);
  registerWhoAmI(bot);
  registerListAdmins(bot, cfg);

  // Analysis/scanners using ccxt + indicators
  registerAlpha(bot, cfg, log);
  registerEMA(bot, cfg, log);
  registerRSI(bot, cfg, log);
  registerATRBreak(bot, cfg, log);
  registerBacktest(bot, cfg, log);
  registerFindPair(bot, cfg, log);

  // Utilities
  registerMargin(bot, cfg, log);
  registerPnL(bot, cfg, log);
  registerSetup(bot, cfg, log);
  registerTopMovers(bot, cfg, log);
  registerScore(bot, cfg, log);
  registerWallet(bot, cfg, log);

  // Netlify limitations: provide gentle fallbacks for heavy features
  bot.hears(/^chart\b/i, (ctx) =>
    ctx.reply('Chart rendering is unavailable in the demo environment.')
  );
  bot.hears(/^heatmap\b/i, (ctx) =>
    ctx.reply('Order book heatmap is unavailable in the demo environment.')
  );
  bot.command(['alert', 'alertlist', 'alertreset'], (ctx) =>
    ctx.reply('Alerts require a persistent worker. Coming soon!')
  );
  bot.command(['watch', 'watchlist', 'unwatch', 'call', 'giveaway'], (ctx) =>
    ctx.reply('This feature requires a persistent worker. Coming soon!')
  );
}

