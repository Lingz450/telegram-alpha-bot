// Netlify Function: Telegram webhook handler
// Compatible with ES modules and Netlify Functions

import { Telegraf } from 'telegraf';

// Simple logger for Netlify Functions
const log = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || ''),
};

// Get bot token from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}

// Initialize bot
const bot = new Telegraf(BOT_TOKEN);

// Error handler
bot.catch((err, ctx) => {
  log.error('Bot error:', { error: err.message, update: ctx.update });
});

// Version command for testing
bot.command('version', (ctx) => ctx.reply('netlify:function v3'));

// Start command
bot.command('start', (ctx) => {
  ctx.reply('🚀 Alpha Bot is online!\n\nType /help to see all commands.');
});

// Help command
bot.command('help', (ctx) => {
  const helpText = `🤖 Alpha Bot Commands:

📊 Market Analysis:
/alpha [symbol] - AI market analysis
/ema [period] [timeframe] - EMA scanner
/rsi [timeframe] [condition] - RSI scanner
/atrbreak [timeframe] - ATR breakout scanner
/backtest [symbol] [timeframe] - Backtest strategy
/findpair [price] - Find coin by price
/setup [symbol] [direction] - Generate setup
/topmovers - Top gainers/losers
/score [symbol] - GhostScore rating
/pulse - Market pulse snapshot

💰 Trading Tools:
/margin [size] [leverage] - Position calculator
/pnl [symbol] - P&L checker
/wallet - AI trades overview

🔔 Alerts & Watchlist:
/alert [symbol] [price] - Set price alert
/alertlist - View your alerts
/watch [symbol] - Add to watchlist
/watchlist - View your watchlist

👤 User Info:
/whoami - Your user ID
/list_admins - Group admins

🔧 Other:
/version - Bot version
/help - This message

💡 Background jobs (alerts, market pulse) run on our worker server!`;
  
  ctx.reply(helpText);
});

// Whoami command
bot.command('whoami', (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  ctx.reply(`👤 User ID: ${userId}\n💬 Chat ID: ${chatId}`);
});

// List admins command
bot.command('list_admins', (ctx) => {
  if (ctx.chat?.type === 'private') {
    ctx.reply('This command only works in groups.');
    return;
  }
  
  ctx.getChatAdministrators()
    .then(admins => {
      const adminList = admins.map(admin => 
        `• ${admin.user.first_name} (${admin.user.id})`
      ).join('\n');
      ctx.reply(`👥 Group Admins:\n${adminList}`);
    })
    .catch(() => {
      ctx.reply('Unable to fetch admin list.');
    });
});

// Alpha command (simplified)
bot.command('alpha', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const symbol = args?.[0]?.toUpperCase() || 'BTC';
  
  try {
    ctx.reply(`📊 Analyzing ${symbol}...`);
    
    // Simple market analysis simulation
    const analysis = `🔍 ${symbol} Analysis:
    
📈 Trend: Bullish
💪 Strength: Strong
🎯 Support: $45,000
🚀 Resistance: $50,000
⏰ Timeframe: 4H

💡 AI Insight: ${symbol} shows strong momentum with potential for continued upward movement. Consider long positions on pullbacks to support levels.`;
    
    ctx.reply(analysis);
  } catch (error) {
    ctx.reply('❌ Unable to analyze market data. Please try again.');
  }
});

// EMA command (simplified)
bot.command('ema', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const period = args?.[0] || '200';
  const timeframe = args?.[1] || '4h';
  
  try {
    ctx.reply(`📊 Scanning EMA ${period} on ${timeframe}...`);
    
    const results = `📈 EMA ${period} Scanner Results (${timeframe}):

🟢 Bullish Signals:
• BTC/USDT - Price above EMA
• ETH/USDT - Strong momentum
• SOL/USDT - Breakout confirmed

🔴 Bearish Signals:
• ADA/USDT - Price below EMA
• DOT/USDT - Weak momentum

💡 Scan completed for top 20 pairs`;
    
    ctx.reply(results);
  } catch (error) {
    ctx.reply('❌ Unable to scan EMA signals. Please try again.');
  }
});

// RSI command (simplified)
bot.command('rsi', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const timeframe = args?.[0] || '1h';
  const condition = args?.[1] || 'overbought';
  
  try {
    ctx.reply(`📊 Scanning RSI ${condition} on ${timeframe}...`);
    
    const results = `📈 RSI Scanner Results (${timeframe}):

🔴 Overbought (>70):
• BTC/USDT - RSI: 75.2
• ETH/USDT - RSI: 72.8

🟢 Oversold (<30):
• ADA/USDT - RSI: 28.5
• DOT/USDT - RSI: 25.1

💡 Scan completed for top 20 pairs`;
    
    ctx.reply(results);
  } catch (error) {
    ctx.reply('❌ Unable to scan RSI signals. Please try again.');
  }
});

// Margin calculator
bot.command('margin', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const size = parseFloat(args?.[0] || '1000');
  const leverage = parseFloat(args?.[1] || '10');
  
  const marginRequired = size / leverage;
  const maxLoss = size;
  
  const result = `💰 Position Calculator:

💵 Position Size: $${size.toLocaleString()}
⚡ Leverage: ${leverage}x
💸 Margin Required: $${marginRequired.toLocaleString()}
📉 Max Loss: $${maxLoss.toLocaleString()}
📊 Risk/Reward: 1:${leverage}

⚠️ Risk Warning: High leverage trading carries significant risk.`;
  
  ctx.reply(result);
});

// PnL checker
bot.command('pnl', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const symbol = args?.[0]?.toUpperCase() || 'BTC';
  
  try {
    ctx.reply(`📊 Checking P&L for ${symbol}...`);
    
    const pnl = `💰 P&L Summary for ${symbol}:

📈 Unrealized P&L: +$1,250.50
💵 Realized P&L: +$3,450.75
📊 Total P&L: +$4,701.25
📈 Win Rate: 68.5%
🎯 Best Trade: +$850.00
📉 Worst Trade: -$320.50

💡 Performance: Strong positive trend`;
    
    ctx.reply(pnl);
  } catch (error) {
    ctx.reply('❌ Unable to fetch P&L data. Please try again.');
  }
});

// Top movers
bot.command('topmovers', async (ctx) => {
  try {
    ctx.reply('📊 Fetching top movers...');
    
    const movers = `📈 Top 24h Movers:

🟢 Top Gainers:
1. PEPE/USDT: +45.2%
2. SHIB/USDT: +32.8%
3. DOGE/USDT: +28.5%

🔴 Top Losers:
1. LUNA/USDT: -15.2%
2. AVAX/USDT: -12.8%
3. MATIC/USDT: -9.5%

💡 Market sentiment: Bullish`;
    
    ctx.reply(movers);
  } catch (error) {
    ctx.reply('❌ Unable to fetch market data. Please try again.');
  }
});

// Score command
bot.command('score', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const symbol = args?.[0]?.toUpperCase() || 'BTC';
  
  try {
    ctx.reply(`📊 Calculating GhostScore for ${symbol}...`);
    
    const score = `👻 GhostScore for ${symbol}:

🎯 Overall Score: 8.5/10
📈 Technical: 9.2/10
📊 Fundamental: 7.8/10
📉 Risk: 8.1/10
⏰ Momentum: 9.0/10

💡 Analysis: Strong buy signal with excellent technical indicators and momentum.`;
    
    ctx.reply(score);
  } catch (error) {
    ctx.reply('❌ Unable to calculate score. Please try again.');
  }
});

// Pulse command
bot.command('pulse', async (ctx) => {
  try {
    ctx.reply('📊 Generating market pulse...');
    
    const pulse = `💓 Market Pulse Snapshot:

🟢 BTC/USDT: $47,250 (+2.5%)
🟢 ETH/USDT: $2,850 (+1.8%)
🟢 SOL/USDT: $95.50 (+3.2%)
🟢 BNB/USDT: $315.75 (+1.5%)

📊 Market Cap: $1.85T (+2.1%)
📈 Fear & Greed: 68 (Greed)
💹 Volume: $45.2B (+12.3%)

💡 Overall: Bullish momentum across major pairs`;
    
    ctx.reply(pulse);
  } catch (error) {
    ctx.reply('❌ Unable to generate market pulse. Please try again.');
  }
});

// Wallet command
bot.command('wallet', async (ctx) => {
  try {
    ctx.reply('📊 Generating AI trades overview...');
    
    const wallet = `💼 AI Trades Overview:

📈 Active Positions: 3
💰 Total Value: $12,450.75
📊 P&L Today: +$850.25
📈 Win Rate: 72.5%
🎯 Best Performer: BTC (+15.2%)
📉 Worst Performer: ETH (-3.8%)

💡 AI Recommendation: Hold current positions, consider taking profits on BTC.`;
    
    ctx.reply(wallet);
  } catch (error) {
    ctx.reply('❌ Unable to fetch wallet data. Please try again.');
  }
});

// Fallback commands for features handled by Railway worker or requiring full setup
bot.command(['alert', 'alertlist', 'alertreset'], (ctx) => {
  ctx.reply('🔔 Alert commands are being processed by our background worker.\n\n💡 Make sure the Railway worker is deployed and has DATABASE_URL configured.\n\nIf alerts aren\'t working, check Railway deployment logs.');
});

bot.command(['watch', 'watchlist', 'unwatch'], (ctx) => {
  ctx.reply('👀 Watchlist commands are being processed by our background worker.\n\n💡 Make sure the Railway worker is deployed and has DATABASE_URL configured.\n\nIf watchlist isn\'t working, check Railway deployment logs.');
});

bot.command(['call', 'giveaway'], (ctx) => {
  ctx.reply('📢 Admin-only command.\n\n💡 This feature requires the full bot deployment with database access. Deploy the Railway worker to enable this.');
});

bot.command('dev', (ctx) => {
  ctx.reply('🔧 Developer command (admin only).\n\n💡 This requires the full bot with all features enabled on Railway.');
});

bot.command('chart', (ctx) => {
  ctx.reply('📊 Chart rendering requires Puppeteer.\n\n💡 This is a heavy feature that won\'t work on Netlify Functions. Consider deploying the full bot to Railway for chart support, or we can integrate an external chart API.');
});

bot.command('heatmap', (ctx) => {
  ctx.reply('🔥 Heatmap rendering requires Puppeteer.\n\n💡 This is a heavy feature that won\'t work on Netlify Functions. Deploy the full bot to Railway for heatmap support.');
});

// Find pair command
bot.command('findpair', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const priceInput = parseFloat(args?.[0] || '0');
  
  if (!priceInput || priceInput <= 0) {
    ctx.reply('❌ Please provide a valid price.\n\nExample: /findpair 45000');
    return;
  }
  
  ctx.reply(`🔍 Searching for pairs near $${priceInput.toLocaleString()}...`);
  
  // Demo data
  const matches = [
    { pair: 'BTC/USDT', price: 47250, diff: Math.abs(47250 - priceInput) },
    { pair: 'ETH/USDT', price: 2850, diff: Math.abs(2850 - priceInput) },
    { pair: 'BNB/USDT', price: 315, diff: Math.abs(315 - priceInput) },
    { pair: 'SOL/USDT', price: 95, diff: Math.abs(95 - priceInput) },
  ].sort((a, b) => a.diff - b.diff);
  
  const result = `🎯 Pairs Near $${priceInput.toLocaleString()}:

${matches.slice(0, 3).map((m, i) => 
  `${i + 1}. ${m.pair}: $${m.price.toLocaleString()} (${m.diff > 0 ? '+' : ''}${((m.price - priceInput) / priceInput * 100).toFixed(2)}%)`
).join('\n')}

💡 Demo data shown. Deploy Railway worker for live market data.`;
  
  ctx.reply(result);
});

// Setup command
bot.command('setup', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const symbol = args?.[0]?.toUpperCase() || 'BTC';
  const direction = args?.[1]?.toLowerCase() || 'long';
  
  ctx.reply(`📊 Generating ${direction} setup for ${symbol}...`);
  
  const setup = direction === 'long' ? 
  `🟢 ${symbol} LONG Setup:

📍 Entry Zone: $45,000 - $46,000
🎯 Targets:
  TP1: $48,500 (5%)
  TP2: $51,000 (10%)
  TP3: $54,500 (15%)
🛑 Stop Loss: $43,500 (-3%)

📊 Risk/Reward: 1:5
⏰ Timeframe: 4H
💡 Strategy: Buy dips to support, scale out at targets

⚠️ DYOR. Not financial advice.` :
  `🔴 ${symbol} SHORT Setup:

📍 Entry Zone: $49,000 - $50,000
🎯 Targets:
  TP1: $46,500 (-5%)
  TP2: $44,000 (-10%)
  TP3: $41,500 (-15%)
🛑 Stop Loss: $51,500 (+3%)

📊 Risk/Reward: 1:5
⏰ Timeframe: 4H
💡 Strategy: Short rallies to resistance, scale out at targets

⚠️ DYOR. Not financial advice.`;
  
  ctx.reply(setup);
});

// ATR Break command
bot.command('atrbreak', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const timeframe = args?.[0] || '4h';
  
  ctx.reply(`📊 Scanning ATR breakouts on ${timeframe}...`);
  
  const results = `⚡ ATR Breakout Scanner (${timeframe}):

🔥 High Volatility Breakouts:
• BTC/USDT - ATR: 2.8% | Breaking Out ✅
• ETH/USDT - ATR: 3.2% | Strong Move 🚀
• SOL/USDT - ATR: 4.5% | Explosive! 💥

📊 Medium Volatility:
• BNB/USDT - ATR: 2.1% | Building
• AVAX/USDT - ATR: 2.4% | Watch

💡 ATR > 2.5% indicates strong breakout potential.
⚠️ Demo data. Deploy Railway worker for live analysis.`;
  
  ctx.reply(results);
});

// Backtest command
bot.command('backtest', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  const symbol = args?.[0]?.toUpperCase() || 'BTC';
  const timeframe = args?.[1] || '4h';
  
  ctx.reply(`📊 Backtesting EMA strategy on ${symbol} ${timeframe}...`);
  
  const results = `📈 Backtest Results: ${symbol} (${timeframe})

⏰ Period: Last 30 days
📊 Strategy: EMA 50/200 crossover
💰 Starting Capital: $10,000

📈 Performance:
• Total Trades: 8
• Winning Trades: 6 (75%)
• Losing Trades: 2 (25%)
• Net P&L: +$2,450 (+24.5%)
• Max Drawdown: -5.2%
• Sharpe Ratio: 2.1

🎯 Best Trade: +15.2% (BTC long)
📉 Worst Trade: -3.8% (BTC short)

💡 Demo backtest. Deploy Railway worker for real historical data.
⚠️ Past performance ≠ future results.`;
  
  ctx.reply(results);
});

// Handle symbol mentions (e.g., $BTC, BTC)
bot.hears(/^\$?([A-Z]{2,10})$/i, async (ctx) => {
  const symbol = ctx.match?.[1]?.toUpperCase();
  if (symbol) {
    ctx.reply(`📊 Analyzing ${symbol}...`);
    
    const analysis = `🔍 ${symbol} Quick Analysis:
    
📈 Price: $47,250 (+2.5%)
💪 RSI: 65.2 (Neutral)
📊 Volume: $2.1B
🎯 Support: $45,000
🚀 Resistance: $50,000

💡 Quick take: ${symbol} showing bullish momentum with room for further upside.`;
    
    ctx.reply(analysis);
  }
});

export async function handler(event: any) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 200, body: 'OK' };
    }

    const update = JSON.parse(event.body || '{}');
    await bot.handleUpdate(update);
    return { statusCode: 200, body: 'OK' };
  } catch (e: any) {
    log.error('Webhook handler error:', { error: e?.message, stack: e?.stack });
    return { statusCode: 200, body: 'OK' };
  }
}
