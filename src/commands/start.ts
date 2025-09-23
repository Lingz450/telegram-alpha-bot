// src/commands/start.ts
import { Telegraf, Context, Markup } from 'telegraf';
import type { Cfg } from '../config';

export function registerStart(bot: Telegraf<Context>, _cfg: Cfg, _log?: any) {
  // /start — beginner-friendly onboarding
  bot.start(async (ctx) => {
    const isPrivate = ctx.chat?.type === 'private';

    const introPrivate = [
      '👋 Welcome! I’m your crypto assistant.',
      '',
      'I can give quick market takes, draw charts, scan EMA/RSI, show order-book heatmaps, and alert you when price hits your level.',
      '',
      'Tap a button below to try something right away:',
    ].join('\n');

    const introGroup = [
      '👋 Hi! I’m a crypto helper bot.',
      'Tap a button below to try me, or type /help for all commands.',
    ].join('\n');

    const text = isPrivate ? introPrivate : introGroup;

    // Inline “try it” buttons. Each button triggers a small callback
    // that sends an example command into the chat so your existing handlers run.
    const kb = Markup.inlineKeyboard([
      [
        Markup.button.callback('⚡ AI Take (BTC 1h)', 'ex:alpha_btc'),
        Markup.button.callback('📈 Chart (BTC 1h)', 'ex:chart_btc_1h'),
      ],
      [
        Markup.button.callback('🎯 Set Alert (BTC 65k)', 'ex:alert_btc_65000'),
        Markup.button.callback('📊 EMA 200 • 4h', 'ex:ema200_4h'),
      ],
      [
        Markup.button.callback('📉 RSI 1h • Overbought', 'ex:rsi1h_overbought'),
        Markup.button.callback('🔥 Heatmap (BTCUSDT)', 'ex:heatmap_btc'),
      ],
      [Markup.button.callback('🧰 Full Help', 'ex:help')],
    ]);

    await ctx.reply(text, kb);

    if (isPrivate) {
      const cheat = [
        '',
        '🔎 Quick cheat-sheet:',
        '• AI take: /alpha BTC  (or type $btc)',
        '• Chart: chart BTC ltf=1h',
        '• EMA scan: /ema 200 4h',
        '• RSI scan: /rsi 1h overbought',
        '• Heatmap: heatmap BTCUSDT',
        '• Alert: /alert BTC 65000  (then /alertlist, /alertreset)',
        '',
        'Not financial advice — manage risk.',
      ].join('\n');
      await ctx.reply(cheat);
    }
  });

  // Callback handlers for the “Try it” buttons.
  bot.action('ex:alpha_btc', async (ctx) => {
    await ctx.answerCbQuery();
    // Send a command message so your existing alpha handler picks it up
    await ctx.telegram.sendMessage(ctx.chat!.id, '/alpha BTC ltf=1h');
  });

  bot.action('ex:chart_btc_1h', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.telegram.sendMessage(ctx.chat!.id, 'chart BTC ltf=1h');
  });

  bot.action('ex:alert_btc_65000', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.telegram.sendMessage(ctx.chat!.id, '/alert BTC 65000');
  });

  bot.action('ex:ema200_4h', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.telegram.sendMessage(ctx.chat!.id, '/ema 200 4h');
  });

  bot.action('ex:rsi1h_overbought', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.telegram.sendMessage(ctx.chat!.id, '/rsi 1h overbought');
  });

  bot.action('ex:heatmap_btc', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.telegram.sendMessage(ctx.chat!.id, 'heatmap BTCUSDT');
  });

  bot.action('ex:help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.telegram.sendMessage(ctx.chat!.id, '/help');
  });
}
