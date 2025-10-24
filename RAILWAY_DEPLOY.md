# 🚂 Railway Deployment Guide

This guide will help you deploy the **background worker** to Railway to enable persistent features (alerts, watchlist, background jobs) while keeping Netlify handling the webhook.

## 📋 **Architecture Overview**

### **Netlify (Webhook Handler)**
- Receives all Telegram messages via webhook
- Handles lightweight commands: `/help`, `/whoami`, `/alpha`, `/ema`, `/rsi`, `/margin`, `/pnl`, etc.
- Fast, serverless, always-on

### **Railway (Background Worker)**
- Runs 24/7 background jobs
- Handles database operations (alerts, watchlist)
- Sends proactive messages (market pulse, volatility alerts)
- Does NOT handle user messages (Netlify does that)

---

## 🚀 **Step 1: Prerequisites**

- ✅ GitHub account with this repo
- ✅ Railway account (sign up at [railway.app](https://railway.app) - free tier available)
- ✅ Bot token from BotFather
- ✅ Database URL (PostgreSQL recommended - Railway provides free PostgreSQL)

---

## 🔧 **Step 2: Set Up Database on Railway**

### **Option A: Use Railway PostgreSQL (Recommended)**

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Click **"Provision PostgreSQL"**
4. Railway will create a PostgreSQL database
5. Click on the database service
6. Go to **"Variables"** tab
7. Copy the **`DATABASE_URL`** value (looks like `postgresql://...`)
8. Keep this for later

### **Option B: Use Your Own Database**

If you already have a PostgreSQL/MySQL database, just have the connection URL ready in this format:
```
postgresql://user:password@host:5432/database
```

---

## 🚂 **Step 3: Deploy Worker to Railway**

### **3.1: Create New Project from GitHub**

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select your `telegram-alpha-bot` repository
5. Railway will detect it as a Node.js project

### **3.2: Configure Environment Variables**

1. In your Railway project, click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add these:

#### **Required Variables:**

| Variable | Value | Example |
|----------|-------|---------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather | `8352011818:AAG...` |
| `DATABASE_URL` | Your PostgreSQL connection URL | `postgresql://...` |
| `NODE_ENV` | `production` | `production` |

#### **Optional Variables (for specific features):**

| Variable | Description | Example |
|----------|-------------|---------|
| `PULSE_CHAT_IDS` | Chat IDs for market pulse messages (comma-separated) | `123456789,-987654321` |
| `PULSE_SYMBOLS` | Symbols for pulse (comma-separated) | `BTC,ETH,SOL,BNB` |
| `PULSE_INTERVAL_SEC` | Pulse interval in seconds | `900` (15 min) |
| `ADMIN_CHAT_IDS` | Admin chat IDs for alerts (comma-separated) | `123456789` |
| `ALERT_TICK_MS` | Alert check interval in milliseconds | `5000` (5 sec) |
| `LOG_LEVEL` | Logging level | `info` |

💡 **To get your Chat ID**: Send `/whoami` to your bot on Telegram (via Netlify webhook)

### **3.3: Configure Build & Start Command**

Railway should auto-detect, but verify:

1. Go to **"Settings"** tab
2. Under **"Build Command"**, ensure it's: `npm install` (or leave blank)
3. Under **"Start Command"**, ensure it's: `npx tsx src/worker.ts`

If you need to set it manually:
- Click **"Variables"** → **"+ New Variable"**
- Add: `RAILWAY_START_COMMAND` = `npx tsx src/worker.ts`

### **3.4: Deploy**

1. Railway will automatically deploy after you set variables
2. If not, click **"Deploy"** at the top right
3. Watch the **"Deployments"** tab for build logs

---

## 📊 **Step 4: Run Database Migrations**

After the worker is deployed, you need to initialize the database schema.

### **Option A: From Railway Dashboard (Easiest)**

1. In Railway, click on your worker service
2. Click **"..."** (three dots) → **"Terminal"**
3. Wait for terminal to connect
4. Run:
```bash
npx prisma migrate deploy
```
5. Wait for migrations to complete

### **Option B: From Local Machine**

1. On your local machine, set the database URL:
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://..." # paste your Railway DB URL
npx prisma migrate deploy
```

```bash
# Mac/Linux
export DATABASE_URL="postgresql://..." # paste your Railway DB URL
npx prisma migrate deploy
```

---

## ✅ **Step 5: Verify Worker is Running**

### **Check Logs**

1. In Railway, go to your worker service
2. Click **"Deployments"** → Click the latest deployment
3. You should see logs like:
```
🔧 Starting Railway Worker (background jobs only)
bot identity: { id: ..., username: '...', name: '...' }
🚀 Starting background jobs...
✅ Auto Alpha job started
✅ Volatility job started
✅ All background jobs running
💡 Worker does NOT handle user messages (Netlify webhook does that)
```

### **Test Commands in Telegram**

1. **Test Netlify webhook**: Send `/help` to your bot → should get immediate response
2. **Test alerts** (Railway worker + DB):
   - Send `/alert BTC 50000` → should save alert
   - Send `/alertlist` → should show your alerts
3. **Test market pulse** (Railway worker):
   - Wait for the pulse interval (default 15 min)
   - You should receive market pulse messages in the chat IDs you configured

---

## 🔄 **Step 6: Keep Netlify Webhook Running**

1. Make sure your Netlify site is still deployed (it should be)
2. Verify webhook is still set:
```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```
3. Should show: `url: "https://telegram-alpha-bot.netlify.app/webhook"`

---

## 🎯 **Architecture Summary**

```
┌─────────────────────────────────────────────────────┐
│                   TELEGRAM SERVER                    │
│                  (sends updates to)                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Webhook POST
                       ▼
┌─────────────────────────────────────────────────────┐
│              NETLIFY FUNCTION (Webhook)             │
│  • Receives ALL user messages                       │
│  • Handles: /help, /alpha, /ema, /margin, etc.     │
│  • Fast, serverless                                 │
└─────────────────────────────────────────────────────┘

                       +

┌─────────────────────────────────────────────────────┐
│            RAILWAY WORKER (Background Jobs)         │
│  • Runs 24/7 persistent tasks                       │
│  • Alert worker (checks every 5s)                   │
│  • Market pulse (sends every 15 min)                │
│  • Volatility monitor (checks every 10 min)         │
│  • Database operations (alerts, watchlist)          │
│  • Does NOT receive user messages                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Both connect to
                       ▼
┌─────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                     │
│  • User alerts                                       │
│  • Watchlists                                        │
│  • Trade calls                                       │
│  • Bot state                                         │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ **Troubleshooting**

### **Worker not starting**

1. Check Railway logs for errors
2. Verify `TELEGRAM_BOT_TOKEN` is set correctly
3. Ensure `DATABASE_URL` is valid
4. Check start command is: `npx tsx src/worker.ts`

### **Alerts not working**

1. Verify Railway worker is running (check logs)
2. Ensure database migrations ran successfully
3. Check `ALERT_TICK_MS` is set (default: 5000)
4. Test by setting an alert and checking Railway logs

### **Market pulse not sending**

1. Verify `PULSE_CHAT_IDS` is set
2. Check `PULSE_INTERVAL_SEC` (default: 900 = 15 min)
3. Look for errors in Railway logs
4. Ensure the chat IDs are correct (use `/whoami` to get yours)

### **Database connection errors**

1. Verify `DATABASE_URL` format is correct
2. Ensure Railway PostgreSQL service is running
3. Check network connectivity (Railway should handle this)
4. Try re-running migrations: `npx prisma migrate deploy`

### **Bot responding twice**

1. **Do NOT run** `npm run dev` locally while Railway + Netlify are active
2. Railway worker should ONLY run background jobs, not handle messages
3. If you accidentally deployed with polling, redeploy Railway with `src/worker.ts`

---

## 💰 **Cost Breakdown**

### **Free Tier Limits:**

- **Netlify**: 
  - 125k function invocations/month (plenty for most bots)
  - 100GB bandwidth
  - ✅ Perfect for webhook handling

- **Railway**:
  - $5 free credits/month (usually enough for one small worker)
  - ~500 hours of runtime (~20 days)
  - Free PostgreSQL included
  - ✅ Enough for testing and small-scale production

### **If you exceed free tier:**

- Railway: ~$5-10/month for 24/7 worker
- Netlify: Usually stays free unless massive traffic

---

## 🎉 **You're Done!**

Your bot now runs in hybrid mode:
- ✅ Netlify handles all user messages (fast, serverless)
- ✅ Railway runs background jobs (persistent, always-on)
- ✅ Database stores alerts, watchlists, etc.
- ✅ No need to type `npm run dev` ever again!

### **Next Steps:**

1. **Test all commands** in Telegram
2. **Monitor Railway logs** for first few hours
3. **Set up alerts** for yourself
4. **Customize pulse settings** via environment variables
5. **Scale up** if needed (Railway makes it easy)

---

## 📚 **Additional Resources**

- [Railway Documentation](https://docs.railway.app)
- [Telegraf Documentation](https://telegraf.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)

---

## 🆘 **Need Help?**

If you encounter issues:
1. Check Railway deployment logs
2. Check Netlify function logs
3. Verify all environment variables are set correctly
4. Ensure database migrations completed successfully
5. Test each component independently (webhook, worker, database)

**Happy Trading! 🚀**

