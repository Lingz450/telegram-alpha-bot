// src/commands/index.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

// Core / existing
import { registerStart } from './start';
import { registerHelp } from './help';
import { registerAlerts } from './alerts';
import { registerChart } from './chart';
import { registerEMA } from './ema';
import { registerRSI } from './rsi';
import { registerHeatmap } from './heatmap';
import { registerFindPair } from './findpair';
import { registerCall } from './call';
import { registerMargin } from './margin';
import { registerPnL } from './pnl';
import { registerWallet } from './wallet';
import { registerGiveaway } from './giveaway';
import { registerDev } from './dev';
import { registerWhoAmI } from './whoami';
import { registerListAdmins } from './list_admins';
import { registerBacktest } from './backtest';
import { registerATRBreak } from './atrbreak';

// New (today)
import { registerCoin } from './coin';               // $symbol / quick coin takes
import { registerWatchlist } from './watchlist';     // /watch, /watchlist, /unwatch
import { registerSetup } from './setup';             // /setup SOL long
import { registerTopMovers } from './topmovers';     // /topmovers
import { registerScore } from './score';             // /score SOL
import { registerAlpha } from './alpha';             // /alpha richer analysis

export default function registerCommands(
  bot: Telegraf<Context>,
  cfg: Cfg,
  log: { info?: (...args: any[]) => void } | any
) {
  // --- Publish slash menu (best-effort) ---
  bot.telegram
    .setMyCommands([
      // Onboarding
      { command: 'start', description: 'Getting started' },
      { command: 'help', description: 'Show all commands' },
      { command: 'whoami', description: 'Show your user_id & chat_id' },
      { command: 'list_admins', description: 'List group admin IDs (owner only)' },

      // Alpha / scans
      { command: 'alpha', description: 'AI market take (or type $symbol)' },
      { command: 'chart', description: 'Quick chart image' },
      { command: 'ema', description: 'EMA scanner' },
      { command: 'rsi', description: 'RSI scanner' },
      { command: 'atrbreak', description: 'ATR breakout scanner' },
      { command: 'backtest', description: 'Backtest EMA cross' },
      { command: 'heatmap', description: 'Order book heatmap' },
      { command: 'findpair', description: 'Guess pair by price' },

      // Alerts
      { command: 'alert', description: 'Set price alert: /alert BTC 65000' },
      { command: 'alertlist', description: 'List active alerts' },
      { command: 'alertreset', description: 'Clear alerts (admin)' },

      // Trading helpers
      { command: 'margin', description: 'Position sizing' },
      { command: 'pnl', description: 'PnL checker' },
      { command: 'call', description: 'Publish trade call (admin)' },

      // New UX helpers
      { command: 'setup', description: 'Generate quick setup (e.g. /setup SOL long)' },
      { command: 'watch', description: 'Add coin(s) to your watchlist' },
      { command: 'watchlist', description: 'Show your watchlist' },
      { command: 'unwatch', description: 'Remove coin(s) from watchlist' },
      { command: 'topmovers', description: 'Top 5 gainers & losers (24h)' },
      { command: 'score', description: 'GhostScore (AI strength rating)' },

      // Misc / Admin
      { command: 'wallet', description: 'AI trades overview (stub)' },
      { command: 'giveaway', description: 'Timed giveaway (admin)' },
      { command: 'dev', description: 'Developer hook (admin)' },
    ])
    .catch(() => { /* ignore menu publish errors */ });

  // --- Core handlers ---
  registerStart(bot, cfg, log);
  registerHelp(bot);
  registerWhoAmI(bot);
  registerListAdmins(bot, cfg);

  // --- Alerts & analysis ---
  registerAlerts(bot, cfg, log);
  registerChart(bot, cfg, log);
  registerEMA(bot, cfg, log);
  registerRSI(bot, cfg, log);
  registerATRBreak(bot, cfg, log);
  registerBacktest(bot, cfg, log);
  registerHeatmap(bot, cfg, log);
  registerFindPair(bot, cfg, log);

  // --- Trading / utility ---
  registerMargin(bot, cfg, log);
  registerPnL(bot, cfg, log);
  registerCall(bot, cfg, log);
  registerWallet(bot, cfg, log);
  registerGiveaway(bot, cfg, log);
  registerDev(bot, cfg, log);

  // --- New experiences ---
  registerCoin(bot, cfg, log);           // handles $symbol & conversational coin asks
  registerWatchlist(bot, cfg, log);      // /watch, /unwatch, /watchlist
  registerSetup(bot, cfg, log);          // /setup
  registerTopMovers(bot, cfg, log);      // /topmovers
  registerScore(bot, cfg, log);          // /score
  registerAlpha(bot, cfg, log);          // richer analysis command

  // ⚠️ Do NOT re-register inside hears. All keyword/regex listeners for coins
  // (like `$btc`, “btc price?”, etc.) should be implemented inside registerCoin().
}
