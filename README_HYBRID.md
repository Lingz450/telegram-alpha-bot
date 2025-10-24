# 🤖 Telegram Alpha Bot - Hybrid Deployment

A powerful Telegram trading bot with AI-powered market analysis, alerts, and automation.

## 🏗️ **Architecture**

This bot uses a **hybrid deployment** approach for optimal performance and cost:

```
┌─────────────────────────────────────────────────────┐
│                   TELEGRAM API                       │
│              (sends all updates to)                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Webhook
                       ▼
┌─────────────────────────────────────────────────────┐
│            NETLIFY (Webhook Handler)                │
│  ⚡ Serverless, Fast, Always-On                     │
│  📱 Handles all user messages                        │
│  ✅ Commands: /help, /alpha, /ema, /margin, etc.   │
└─────────────────────────────────────────────────────┘

                       +

┌─────────────────────────────────────────────────────┐
│           RAILWAY (Background Worker)               │
│  🔄 24/7 Persistent Process                         │
│  🔔 Alert monitoring (every 5 seconds)              │
│  📊 Market pulse (every 15 minutes)                 │
│  📈 Volatility alerts                                │
│  💾 Database operations (alerts, watchlist)         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│         POSTGRESQL DATABASE (Railway)               │
│  User alerts, watchlists, trade calls               │
└─────────────────────────────────────────────────────┘
```

### **Why Hybrid?**

✅ **Netlify**: Perfect for handling user commands (fast, free, reliable)  
✅ **Railway**: Handles persistent jobs (alerts, monitoring, database)  
✅ **Best of both worlds**: Fast responses + always-on features  
✅ **Cost-effective**: Both have generous free tiers  

---

## 🚀 **Quick Start**

### **Prerequisites**
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- GitHub account
- Netlify account (free)
- Railway account (free)

### **1. Deploy to Netlify (5 min)**

1. Push this repo to your GitHub
2. Connect to Netlify
3. Set environment variable: `TELEGRAM_BOT_TOKEN`
4. Deploy
5. Set webhook:
   ```powershell
   Invoke-RestMethod -Uri "https://api.telegram.org/bot<TOKEN>/setWebhook" -Method Post -Body @{ url = "https://your-site.netlify.app/webhook" }
   ```

### **2. Deploy Worker to Railway (5 min)**

1. Go to [railway.app/new](https://railway.app/new)
2. Deploy from GitHub repo
3. Add PostgreSQL database
4. Set environment variables (see [QUICK_START.md](./QUICK_START.md))
5. Run migrations: `npx prisma migrate deploy`

**📖 Full Instructions**: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)  
**⚡ Quick Checklist**: [QUICK_START.md](./QUICK_START.md)

---

## 📋 **Features**

### **Market Analysis** (Netlify)
- `/alpha [symbol]` - AI-powered market analysis
- `/ema [period] [timeframe]` - EMA scanner
- `/rsi [timeframe] [condition]` - RSI scanner
- `/topmovers` - Top 24h gainers/losers
- `/score [symbol]` - GhostScore strength rating
- `/pulse` - Market snapshot (BTC/ETH/SOL/BNB)
- `$BTC` or `BTC` - Quick symbol lookup

### **Trading Tools** (Netlify)
- `/margin [size] [leverage]` - Position calculator
- `/pnl [symbol]` - P&L tracker
- `/wallet` - AI trades overview

### **Alerts & Watchlist** (Railway + DB)
- `/alert [symbol] [price]` - Set price alert
- `/alertlist` - View your alerts
- `/watch [symbol]` - Add to watchlist
- `/watchlist` - View your watchlist
- `/unwatch [symbol]` - Remove from watchlist

### **Background Jobs** (Railway)
- 🔔 Alert monitoring (checks every 5 seconds)
- 📊 Market pulse (auto-sends every 15 minutes)
- 📈 Volatility monitoring (alerts on big moves)
- 🤖 Auto Alpha (periodic market analysis)

### **Admin Commands** (Railway + DB)
- `/call [signal]` - Publish trade signal
- `/giveaway` - Start timed giveaway
- `/dev` - Developer utilities

---

## 🛠️ **Environment Variables**

### **Required (Both Netlify & Railway)**
```env
TELEGRAM_BOT_TOKEN=your_bot_token
```

### **Required (Railway Only)**
```env
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### **Optional (Railway - Feature Configuration)**
```env
# Market Pulse
PULSE_CHAT_IDS=123456789,-987654321
PULSE_SYMBOLS=BTC,ETH,SOL,BNB
PULSE_INTERVAL_SEC=900

# Alerts
ADMIN_CHAT_IDS=123456789
ALERT_TICK_MS=5000

# Logging
LOG_LEVEL=info
```

---

## 📁 **Project Structure**

```
telegram-alpha-bot/
├── src/
│   ├── index.ts              # Full bot (polling - for local dev)
│   ├── worker.ts             # Railway worker (background jobs only)
│   ├── commands/             # Command handlers
│   ├── jobs/                 # Background workers
│   │   ├── alertWorker.ts    # Alert monitoring
│   │   ├── marketPulse.ts    # Market pulse
│   │   ├── volatility.ts     # Volatility alerts
│   │   └── autoAlpha.ts      # Auto analysis
│   ├── db/                   # Database & Prisma
│   ├── exchange/             # CCXT client
│   └── indicators/           # Technical indicators
├── netlify/
│   └── functions/
│       └── telegram.ts       # Netlify webhook handler
├── prisma/
│   └── schema.prisma         # Database schema
├── Procfile                  # Railway process definition
├── railway.json              # Railway config
├── netlify.toml              # Netlify config
├── RAILWAY_DEPLOY.md         # Detailed Railway guide
└── QUICK_START.md            # Quick setup checklist
```

---

## 🧪 **Local Development**

### **Run Full Bot (Polling)**
```bash
npm run dev
```
This runs the full bot with all features (commands + background jobs).

### **Test Worker Only**
```bash
npx tsx src/worker.ts
```
This runs only background jobs (no command handlers).

### **Test Netlify Function Locally**
```bash
netlify dev
```
Then use ngrok to expose and set webhook to your local tunnel.

---

## 🔄 **Deployment Flow**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update bot"
   git push origin main
   ```

2. **Netlify auto-deploys** (webhook handler)
3. **Railway auto-deploys** (background worker)
4. Both pull latest code automatically!

---

## 📊 **Monitoring**

### **Netlify**
- Function logs: Netlify Dashboard → Functions → telegram
- Real-time logs for each request

### **Railway**
- Deployment logs: Railway Dashboard → Deployments
- Live logs show background job activity

---

## 💰 **Costs**

### **Free Tier**
- **Netlify**: 125k function calls/month (plenty!)
- **Railway**: $5 free credits/month (~20 days runtime)
- **Total**: $0/month for small-scale bots

### **Paid (if needed)**
- **Netlify**: Usually stays free
- **Railway**: ~$5-10/month for 24/7 operation
- **Database**: Included in Railway

---

## 🆘 **Troubleshooting**

### **Commands not responding**
1. Check Netlify function logs
2. Verify webhook: `getWebhookInfo` API call
3. Ensure `TELEGRAM_BOT_TOKEN` is set

### **Alerts not working**
1. Check Railway worker is running
2. Verify `DATABASE_URL` is set
3. Ensure migrations ran: `npx prisma migrate deploy`

### **Market pulse not sending**
1. Set `PULSE_CHAT_IDS` environment variable
2. Check Railway logs for errors
3. Verify chat ID with `/whoami`

**Full troubleshooting**: See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md#troubleshooting)

---

## 📚 **Documentation**

- [🚂 Railway Deployment Guide](./RAILWAY_DEPLOY.md) - Detailed setup
- [⚡ Quick Start](./QUICK_START.md) - Fast setup checklist
- [📖 Telegraf Docs](https://telegraf.js.org) - Bot framework
- [🗄️ Prisma Docs](https://www.prisma.io/docs) - Database ORM

---

## 🔐 **Security**

- ✅ Bot token stored in environment variables (never in code)
- ✅ Webhook uses HTTPS (Telegram requirement)
- ✅ Admin commands check user permissions
- ✅ Database credentials secured in Railway

---

## 🎯 **Roadmap**

- [ ] Add real-time chart rendering (external API)
- [ ] Integrate more exchanges (currently Binance-focused)
- [ ] Add backtesting strategies
- [ ] Multi-language support
- [ ] Advanced portfolio tracking

---

## 🤝 **Contributing**

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Test locally with `npm run dev`
4. Submit a PR

---

## 📄 **License**

MIT License - See LICENSE file

---

## 🎉 **Success!**

Once deployed:
- ✅ Your bot is online 24/7
- ✅ No need to run `npm run dev` manually
- ✅ Alerts work automatically
- ✅ Market pulse sends on schedule
- ✅ Everything just works!

**Need help?** Check the troubleshooting guides or open an issue.

**Happy Trading! 🚀**

