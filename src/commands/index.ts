// src/commands/index.ts
import { Telegraf, Context } from 'telegraf';
import type { Cfg } from '../config';

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

export default function registerCommands(
  bot: Telegraf<Context>,
  cfg: Cfg,
  log: { info?: (...args: any[]) => void } | any
) {
  // Publish slash menu (best-effort; ignore failures)
  bot.telegram
    .setMyCommands([
      { command: 'start', description: 'Getting started (beginner friendly)' },
      { command: 'help', description: 'Show commands' },
      { command: 'whoami', description: 'Show your user_id and chat_id' },
      { command: 'list_admins', description: 'List group admin IDs (owner only)' },
      { command: 'alert', description: 'Set price alert: /alert BTC 65000' },
      { command: 'alertlist', description: 'List active alerts' },
      { command: 'alertreset', description: 'Clear alerts (admin)' },
      { command: 'chart', description: 'Quick chart image' },
      { command: 'ema', description: 'EMA scanner' },
      { command: 'rsi', description: 'RSI scanner' },
      { command: 'heatmap', description: 'Order book heatmap' },
      { command: 'findpair', description: 'Find pair closest to a price' },
      { command: 'call', description: 'Publish trade call (admin)' },
      { command: 'margin', description: 'Position sizing helper' },
      { command: 'pnl', description: 'PnL checker' },
      { command: 'wallet', description: 'AI bot trades (stub)' },
      { command: 'giveaway', description: 'Timed giveaway (admin)' },
      { command: 'div', description: 'Dev hook (admin)' },
      { command: 'backtest', description: 'Quick EMA cross backtest' },
      // /alpha registered dynamically below if present
    ])
    .catch(() => { /* ignore */ });

  // Core handlers
  registerStart(bot, cfg, log);
  registerHelp(bot);
  registerWhoAmI(bot);
  registerListAdmins(bot, cfg);

  registerAlerts(bot, cfg, log);
  registerChart(bot, cfg, log);
  registerEMA(bot, cfg, log);
  registerRSI(bot, cfg, log);
  registerHeatmap(bot, cfg, log);
  registerFindPair(bot, cfg, log);
  registerCall(bot, cfg, log);
  registerMargin(bot, cfg, log);
  registerPnL(bot, cfg, log);
  registerWallet(bot, cfg, log);
  registerGiveaway(bot, cfg, log);
  registerDev(bot, cfg, log);
  registerBacktest(bot, cfg, log);

  // Optional: registerAlpha (if file exists). Works in dev (TS) and prod (dist JS).
  (async () => {
    try {
      let mod: any;
      try {
        // dev / ts
        mod = await import('./alpha');
      } catch {
        // prod / compiled js in dist
        mod = await import('./alpha.js');
      }
      if (mod?.registerAlpha) {
        mod.registerAlpha(bot, cfg, log);
        log?.info?.('alpha command registered');
      }
    } catch {
      // silently ignore if alpha module not available
    }
  })();
}
