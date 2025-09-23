// src/commands/backtest.ts
import { Telegraf, Context } from "telegraf";
import type { Cfg } from "../config";
import { makeExchange } from "../exchange/client";
import { klines } from "../exchange/marketData";
import { ema } from "../indicators/ema";

function esc(s: unknown) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type Trade = { entry: number; exit: number; ret: number };

function dd(equity: number[]): number {
  let peak = equity[0], maxDD = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    const d = (peak - v) / (peak || 1);
    if (d > maxDD) maxDD = d;
  }
  return maxDD;
}

const TF_MINUTES: Record<string, number> = {
  "5m": 5,
  "15m": 15,
  "1h": 60,
  "2h": 120,
  "4h": 240,
  "1d": 1440,
};

function startTyping(ctx: Context) {
  const chatId = ctx.chat?.id!;
  let killed = false;
  const tick = async () => {
    if (killed) return;
    try { await ctx.telegram.sendChatAction(chatId, "typing"); } catch {}
  };
  tick();
  const iv = setInterval(tick, 4500);
  return () => { killed = true; clearInterval(iv); };
}

// NOTE: Escape angle brackets because we use parse_mode=HTML.
function usage(ctx: Context) {
  return ctx.reply(
    [
      "<b>Usage</b>",
      "  /backtest ema &lt;fast&gt;/&lt;slow&gt; &lt;tf&gt; &lt;symbol&gt; [lookback=&lt;N&gt;(h|d)] [fee=&lt;num&gt;]",
      "",
      "<b>Examples</b>",
      "  /backtest ema 50/200 1h BTC",
      "  /backtest ema 50/200 5m BTC lookback=72h fee=0.0012",
    ].join("\n"),
    { parse_mode: "HTML" }
  );
}

async function runEmaCross(
  cfg: Cfg,
  fast: number,
  slow: number,
  tf: string,
  symbolRaw: string,
  lookbackHours: number,
  fee: number
) {
  const symbol =
    symbolRaw.toUpperCase().replace("/", "") +
    (/[USDT|USDC|USD|BTC|ETH|EUR|BUSD|FDUSD|USDD]$/.test(symbolRaw.toUpperCase()) ? "" : "USDT");

  const tfMin = TF_MINUTES[tf];
  if (!tfMin) throw new Error("Unsupported timeframe.");

  const needCandles = Math.ceil((lookbackHours * 60) / tfMin) + slow + 50;
  const limit = Math.min(Math.max(needCandles, 500), 5000);

  const ex = makeExchange(cfg);
  const ks = await klines(ex, symbol, tf as any, limit);

  const startTs = Date.now() - lookbackHours * 3600_000;
  const slice = ks.filter((k) => k.t >= startTs);

  if (slice.length < slow + 10) {
    throw new Error(
      `Not enough candles for that lookback/periods. Got ${slice.length}, need at least ${slow + 10}.`
    );
  }

  const closes = slice.map((c) => c.c);
  const eFast = ema(closes, fast);
  const eSlow = ema(closes, slow);

  let inTrade = false;
  let entry = 0;
  const trades: Trade[] = [];
  const equity: number[] = [1];

  for (let i = 1; i < closes.length; i++) {
    const cf = eFast[i], cs = eSlow[i], pf = eFast[i - 1], ps = eSlow[i - 1];
    if (
      !Number.isFinite(cf) || !Number.isFinite(cs) ||
      !Number.isFinite(pf) || !Number.isFinite(ps)
    ) continue;

    if (!inTrade && pf <= ps && cf > cs) {
      inTrade = true;
      entry = closes[i];
    }

    if (inTrade && pf >= ps && cf < cs) {
      const exit = closes[i];
      const gross = (exit - entry) / entry;
      const net = gross - fee;
      trades.push({ entry, exit, ret: net });
      inTrade = false;
      equity.push(equity[equity.length - 1] * (1 + net));
    }
  }

  if (inTrade) {
    const exit = closes.at(-1)!;
    const gross = (exit - entry) / entry;
    const net = gross - fee;
    trades.push({ entry, exit, ret: net });
    equity.push(equity[equity.length - 1] * (1 + net));
  }

  const wins = trades.filter((t) => t.ret > 0);
  const losses = trades.filter((t) => t.ret <= 0);
  const winrate = trades.length ? (wins.length / trades.length) * 100 : 0;

  const winSum = wins.reduce((s, t) => s + t.ret, 0);
  const lossSum = losses.reduce((s, t) => s + t.ret, 0);
  const lossAbs = Math.abs(lossSum);
  const pfVal = lossAbs === 0 ? (winSum > 0 ? Infinity : 0) : winSum / lossAbs;

  const total = (equity.at(-1)! - 1) * 100;
  const maxdd = dd(equity) * 100;

  const msg = [
    `<b>Backtest, EMA ${fast}/${slow}, ${esc(tf)}, ${esc(symbol)}</b>`,
    `<code>trades</code> ${trades.length}`,
    `<code>winrate</code> ${winrate.toFixed(1)}%`,
    `<code>profit factor</code> ${pfVal === Infinity ? "∞" : pfVal.toFixed(2)}`,
    `<code>total return</code> ${total.toFixed(1)}%`,
    `<code>max DD</code> ${maxdd.toFixed(1)}%`,
    `<code>fee</code> ${fee}`,
    `<code>lookback</code> ${lookbackHours}h (${(lookbackHours / 24).toFixed(1)}d)`,
  ].join("\n");

  return msg;
}

export function registerBacktest(bot: Telegraf<Context>, cfg: Cfg, _log: any) {
  bot.command("backtest", async (ctx) => {
    const stop = startTyping(ctx);
    try {
      const args = ((ctx.message as any).text || "").trim().split(/\s+/).slice(1);
      if (args.length === 0) { stop(); return usage(ctx); }

      if (args[0]?.toLowerCase() !== "ema" || !/^\d{1,3}\/\d{1,3}$/.test(args[1] || "")) {
        stop(); return usage(ctx);
      }

      const [fastStr, slowStr] = args[1].split("/");
      const fast = Number(fastStr), slow = Number(slowStr);
      const tf = (args[2] || "").toLowerCase();
      const symbol = args[3];
      if (!fast || !slow || !TF_MINUTES[tf] || !symbol) { stop(); return usage(ctx); }

      let lookbackHours = 180 * 24;
      let fee = 0.0008;
      for (const tok of args.slice(4)) {
        const mLB = tok.match(/^lookback=(\d+)([hd])$/i);
        if (mLB) {
          const v = Number(mLB[1]);
          const unit = mLB[2].toLowerCase();
          lookbackHours = unit === "h" ? v : v * 24;
          continue;
        }
        const mFee = tok.match(/^fee=(\d+(\.\d+)?)$/i);
        if (mFee) fee = Number(mFee[1]);
      }

      const msg = await runEmaCross(cfg, fast, slow, tf, symbol, lookbackHours, fee);
      stop();
      return ctx.reply(msg, { parse_mode: "HTML" });
    } catch (err: any) {
      stop();
      return ctx.reply(`Backtest failed, ${esc(err?.message || String(err))}`, { parse_mode: "HTML" });
    }
  });

  bot.hears(
    /^backtest\s+ema\s+(\d{1,3})\/(\d{1,3})\s+(5m|15m|1h|2h|4h|1d)\s+([A-Za-z0-9\-\/]+)(?:\s+lookback=(\d+)([dh]))?(?:\s+fee=(\d+(\.\d+)?))?$/i,
    async (ctx) => {
      const stop = startTyping(ctx);
      try {
        const [, fStr, sStr, tf, symRaw, amtStr, unit, feeStr] =
          ctx.match as RegExpMatchArray;

        const fast = Number(fStr);
        const slow = Number(sStr);
        const fee = feeStr ? Number(feeStr) : 0.0008;

        const lookVal = amtStr ? Number(amtStr) : 180;
        const lookUnit = unit === "h" ? "h" : "d";
        const lookbackHours = lookUnit === "h" ? lookVal : lookVal * 24;

        const msg = await runEmaCross(cfg, fast, slow, tf, symRaw, lookbackHours, fee);
        stop();
        return ctx.reply(msg, { parse_mode: "HTML" });
      } catch (err: any) {
        stop();
        return ctx.reply(`Backtest failed, ${esc(err?.message || String(err))}`, { parse_mode: "HTML" });
      }
    }
  );
}
