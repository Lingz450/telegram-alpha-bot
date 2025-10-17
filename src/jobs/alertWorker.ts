// src/jobs/alertWorker.ts
import { Telegraf } from 'telegraf';
import type { Cfg } from '../config';
import { prisma } from '../db/prisma';
import { makeExchange } from '../exchange/client';
import { klines, ticker } from '../exchange/marketData';
import { ema } from '../indicators/ema';
import { rsi } from '../indicators/rsi';

type LogLike = { info?: Function; warn?: Function; error?: Function };

const esc = (s: unknown) =>
  String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]!));

// ---- Cross helpers ----
function crossedAbove(lastSeen: number, now: number, level: number) {
  return lastSeen < level && now >= level;
}
function crossedBelow(lastSeen: number, now: number, level: number) {
  return lastSeen > level && now <= level;
}
function crossedEither(lastSeen: number, now: number, level: number) {
  return crossedAbove(lastSeen, now, level) || crossedBelow(lastSeen, now, level);
}

export function startAlertLoop(bot: Telegraf, cfg: Cfg, log: LogLike) {
  // Keep one exchange instance around
  const exPromise = Promise.resolve(makeExchange(cfg));

  // Caches (cleared each tick)
  const klineCache = new Map<string, any[]>();
  const priceCache = new Map<string, number>();

  // Local memory for last seen prices (since schema has no lastSeen column)
  const lastSeenMap = new Map<string, number>();

  async function getTickerLast(symbol: string): Promise<number | null> {
    try {
      if (priceCache.has(symbol)) return priceCache.get(symbol)!;
      const ex = await exPromise;
      const t = await ticker(ex, symbol);
      const last = Number(
        t?.last ?? t?.close ?? t?.info?.last ?? t?.info?.c ?? t?.info?.price ?? NaN
      );
      if (!Number.isFinite(last)) return null;
      priceCache.set(symbol, last);
      return last;
    } catch {
      return null;
    }
  }

  async function getKlines(symbol: string, tf: string, need: number): Promise<any[] | null> {
    const key = `${symbol}:${tf}`;
    if (klineCache.has(key)) return klineCache.get(key)!;
    try {
      const ex = await exPromise;
      const rows = await klines(ex, symbol, tf as any, Math.max(need, 300));
      klineCache.set(key, rows);
      return rows;
    } catch {
      return null;
    }
  }

  async function handlePriceAlerts(alerts: Awaited<ReturnType<typeof prisma.alert.findMany>>) {
    for (const a of alerts) {
      try {
        const trg = Number(a.triggerPrice);
        if (!Number.isFinite(trg)) continue;

        const now = await getTickerLast(a.symbol);
        if (now == null) continue;

        const key = a.id;
        const lastSeenNum = lastSeenMap.get(key);

        // First observation → just arm it
        if (lastSeenNum == null || !Number.isFinite(lastSeenNum)) {
          lastSeenMap.set(key, now);
          continue;
        }

        const dir = (a.direction || 'either') as 'above' | 'below' | 'either';
        const hit =
          dir === 'above'
            ? crossedAbove(lastSeenNum, now, trg)
            : dir === 'below'
            ? crossedBelow(lastSeenNum, now, trg)
            : crossedEither(lastSeenNum, now, trg);

        lastSeenMap.set(key, now);

        if (hit) {
          await prisma.alert.update({
            where: { id: a.id },
            data: { active: false },
          });
          const arrow = dir === 'above' ? '↑' : dir === 'below' ? '↓' : '↕';
          const msg = `🔔 <b>${esc(a.symbol)}</b> ${arrow} <code>${trg}</code> (last <code>${now}</code>)`;
          await bot.telegram
            .sendMessage(a.chatId, msg, { parse_mode: 'HTML' })
            .catch(() => {});
        }
      } catch (err) {
        log?.warn?.({ err }, 'price-alert');
      }
    }
  }

  async function handleEMAAlerts(alerts: any[]) {
    const groups = new Map<string, any[]>();
    for (const a of alerts) {
      const key = `${a.symbol}|${a.timeframe}|${a.period}`;
      (groups.get(key) || groups.set(key, []).get(key)!).push(a);
    }

    for (const [key, list] of groups) {
      const sample = list[0];
      const period = Number(sample.period) || 200;
      const tf = String(sample.timeframe);

      try {
        const rows = await getKlines(sample.symbol, tf, Math.max(300, period + 5));
        if (!rows || rows.length < period + 2) continue;

        const closes = rows.map((r) => r.c);
        const e = ema(closes, period);

        const c0 = closes.at(-2)!,
          c1 = closes.at(-1)!;
        const e0 = e.at(-2)!,
          e1 = e.at(-1)!;

        const crossUp = c0 <= e0 && c1 > e1;
        const crossDn = c0 >= e0 && c1 < e1;

        for (const a of list) {
          const dir = (a.direction || 'either') as 'above' | 'below' | 'either';
          const hit =
            dir === 'above' ? crossUp : dir === 'below' ? crossDn : crossUp || crossDn;
          if (!hit) continue;

          await prisma.alert.update({ where: { id: a.id }, data: { active: false } });
          const arrow = crossUp ? '↑ above' : '↓ below';
          const msg = `🔔 <b>${esc(a.symbol)}</b> ${arrow} EMA<code>${period}</code> on <code>${esc(
            tf
          )}</code> (close <code>${c1}</code> vs EMA <code>${e1}</code>)`;
          await bot.telegram
            .sendMessage(a.chatId, msg, { parse_mode: 'HTML' })
            .catch(() => {});
        }
      } catch (err) {
        log?.warn?.({ err, key }, 'ema-alert');
      }
    }
  }

  async function handleRSIAlerts(alerts: any[]) {
    const groups = new Map<string, any[]>();
    for (const a of alerts) {
      const key = `${a.symbol}|${a.timeframe}|${a.period || 14}`;
      (groups.get(key) || groups.set(key, []).get(key)!).push(a);
    }

    for (const [key, list] of groups) {
      const sample = list[0];
      const period = Number(sample.period) || 14;
      const tf = String(sample.timeframe);

      try {
        const rows = await getKlines(sample.symbol, tf, Math.max(200, period + 50));
        if (!rows || rows.length < period + 2) continue;

        const closes = rows.map((r) => r.c);
        const series = rsi(closes, period);
        const val = series.at(-1);
        if (!val || !Number.isFinite(val)) continue;

        for (const a of list) {
          const dir = (a.direction || 'overbought') as 'overbought' | 'oversold';
          const th = Number(a.threshold ?? (dir === 'overbought' ? 70 : 30));
          const hit = dir === 'overbought' ? val >= th : val <= th;
          if (!hit) continue;

          await prisma.alert.update({ where: { id: a.id }, data: { active: false } });
          const msg = `🔔 <b>${esc(a.symbol)}</b> RSI<code>${period}</code> <code>${esc(
            tf
          )}</code> = <code>${val.toFixed(2)}</code> (${esc(dir)} @ <code>${th}</code>)`;
          await bot.telegram
            .sendMessage(a.chatId, msg, { parse_mode: 'HTML' })
            .catch(() => {});
        }
      } catch (err) {
        log?.warn?.({ err, key }, 'rsi-alert');
      }
    }
  }

  async function checkOnce() {
    klineCache.clear();
    priceCache.clear();

    const alerts = await prisma.alert.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!alerts.length) return;

    const priceAlerts = alerts.filter((a) => (a.kind ?? 'price') === 'price');
    const emaAlerts = alerts.filter((a) => a.kind === 'ema_cross' && a.timeframe && a.period);
    const rsiAlerts = alerts.filter((a) => a.kind === 'rsi_threshold' && a.timeframe);

    await handlePriceAlerts(priceAlerts);
    await handleEMAAlerts(emaAlerts as any[]);
    await handleRSIAlerts(rsiAlerts as any[]);
  }

  const tickMs = Number(cfg.ALERT_TICK_MS || 5000);

  (function loop() {
    checkOnce()
      .catch((e) => log?.error?.({ e }, 'alertLoop'))
      .finally(() => setTimeout(loop, tickMs));
  })();
}
