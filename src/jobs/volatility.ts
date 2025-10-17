import { makeExchange } from '../exchange/client';
let lastPrices: Record<string, number> = {};

export function startVolatility(bot, cfg, log) {
  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
  const ex = makeExchange(cfg);
  const chatIds = (process.env.ADMIN_CHAT_IDS || '').split(',').filter(Boolean);

  async function check() {
    for (const p of pairs) {
      try {
        const t = await ex.fetchTicker(p);
        const price = Number(t.last);
        if (lastPrices[p]) {
          const diff = ((price - lastPrices[p]) / lastPrices[p]) * 100;
          if (Math.abs(diff) >= 2) {
            const alert = `🚨 <b>${p}</b> volatility spike: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}% (${price.toFixed(2)})`;
            for (const c of chatIds)
              bot.telegram.sendMessage(c, alert, { parse_mode: 'HTML' });
          }
        }
        lastPrices[p] = price;
      } catch {}
    }
  }

  setInterval(check, 1000 * 60 * 10); // every 10 minutes
}
