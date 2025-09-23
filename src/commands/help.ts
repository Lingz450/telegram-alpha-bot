// src/commands/help.ts
import { Telegraf, Context } from 'telegraf';

export function registerHelp(bot: Telegraf<Context>) {
  bot.command('help', async (ctx) => {
    const text = [
      '<b>Core commands</b>',
      '• /start  – Getting started (quick intro)',
      '• /alpha &lt;symbol&gt; → AI market take (or type <i>$symbol</i>)',
      '• /alert &lt;symbol&gt; &lt;price&gt;',
      '• /alertlist',
      '• /alertreset &lt;symbol&gt; &lt;price&gt; (admin)',
      '• /chart &lt;symbol&gt; ltf=5m|15m|1h|2h|4h|1d',
      '• /ema &lt;50|100|200&gt; &lt;5m|15m|1h|2h|4h|1d&gt;',
      '• /rsi &lt;5m|15m|1h|2h|4h|1d&gt; &lt;overbought|oversold&gt;',
      '• /heatmap &lt;pair&gt; normal|extended',
      '• /findpair &lt;price&gt;',
      '',
      '<b>Trading utils</b>',
      '• /margin cmp=&lt;p&gt; sl=&lt;p&gt; risk=&lt;amt&gt; lev=&lt;x&gt;',
      '• /pnl &lt;pair&gt;',
      '• /backtest – Quick EMA cross backtest',
      '',
      '<b>Admin / misc</b>',
      '• /call &lt;pair&gt; entry=&lt;p&gt; sl=&lt;p&gt; lev=&lt;x&gt; tp=&lt;p1,p2,…&gt; (admin)',
      '• /giveaway &lt;durationSec&gt; &lt;prize&gt; winners=N (admin)',
      '• /whoami – Show your user_id & chat_id',
      '• /list_admins – List group admin IDs (owner only)',
      '• /div (admin)',
      '',
      '<b>Shortcuts</b>',
      '• <i>$btc</i>  → AI market take (same as /alpha btc)',
      '• <i>$btc 65000</i>  → set alert quickly (same as /alert BTC 65000)',
      '',
      '— Trade responsibly. <i>This is not financial advice.</i>',
    ].join('\n');

    return ctx.reply(text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  });
}
