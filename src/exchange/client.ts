// src/exchange/client.ts
import ccxt from 'ccxt';
import type { Cfg } from '../config';

type Ex = ccxt.Exchange;

/* -------------------------------------------------------
 * Low-level builders & helpers
 * ----------------------------------------------------- */

/** Build an exchange client with safe spot defaults */
function build(id: string): Ex {
  const Cls = (ccxt as any)[id];
  if (!Cls) throw new Error(`Unknown exchange: ${id}`);
  const ex: Ex = new Cls({
    enableRateLimit: true,
    timeout: 20_000,
    options: {
      defaultType: 'spot',
      defaultMarket: 'spot',
      adjustForTimeDifference: true,
    },
    // Light UA sometimes helps with certain CDNs (not required)
    headers: id === 'okx' ? { 'User-Agent': 'Mozilla/5.0' } : undefined,
  });
  return ex;
}

/** Best-effort "ping" to check if an exchange is reachable */
async function pingExchange(ex: Ex): Promise<void> {
  // Prefer fetchTime when available; otherwise a very light call
  if ((ex.has as any)?.fetchTime) {
    await ex.fetchTime();
    return;
  }
  // Some exchanges expose status; OK if it throws (we’ll catch)
  if ((ex.has as any)?.fetchStatus) {
    await ex.fetchStatus();
    return;
  }
  // Fall back to loading markets (heavier, but still OK once)
  await ex.loadMarkets();
}

/** Build a prioritized list of exchanges to try */
function getPriorityList(cfg: Cfg): string[] {
  // Optional: comma-separated list in env (highest → lowest priority)
  const fromEnv = (process.env.EXCHANGES || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const primary = String(cfg.EXCHANGE || 'binance').toLowerCase();
  // Good, fast publics in general. You asked for binance, bybit, okx.
  const defaults = ['binance', 'bybit', 'okx'];

  // Start with EXCHANGES env list if provided; else with primary
  const start = fromEnv.length ? fromEnv : [primary];

  // Merge with defaults, keep order without dups
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...start, ...defaults]) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/* -------------------------------------------------------
 * Public API
 * ----------------------------------------------------- */

/**
 * Simple primary/fallback creator (sync).
 * - Primary = cfg.EXCHANGE (default 'binance')
 * - Fallback = the next preferred venue (bybit if primary is binance, okx otherwise)
 */
export function makeExchange(
  cfg: Cfg,
  prefer: 'primary' | 'fallback' = 'primary'
): Ex {
  const primaryId = String(cfg.EXCHANGE || 'binance').toLowerCase();
  // Choose a deterministic fallback from the trio you want to support
  const order = ['binance', 'bybit', 'okx'];
  const idx = Math.max(0, order.indexOf(primaryId));
  const fallbackId = order[(idx + 1) % order.length];
  return prefer === 'primary' ? build(primaryId) : build(fallbackId);
}

/**
 * Robust selector: try a priority list (EXCHANGES env or EXCHANGE + defaults)
 * and return the first reachable exchange.
 *
 * Usage:
 *   const { id, ex } = await getWorkingExchange(cfg);
 */
export async function getWorkingExchange(
  cfg: Cfg
): Promise<{ id: string; ex: Ex }> {
  const candidates = getPriorityList(cfg);
  let lastErr: any = null;

  for (const id of candidates) {
    try {
      const ex = build(id);
      await pingExchange(ex);
      return { id, ex };
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(
    `No reachable exchange from list: ${candidates.join(', ')}. Last error: ${
      (lastErr && (lastErr.message || String(lastErr))) || 'unknown'
    }`
  );
}

/* -------------------------------------------------------
 * Symbol normalizers & volume readers
 * ----------------------------------------------------- */

function normalizeUnifiedSymbol(sym: string): string {
  // ccxt sometimes returns BTC/USDT:USDT; keep BTC/USDT part
  const s = String(sym);
  if (s.includes(':')) return s.split(':')[0];
  return s;
}

/** BTC/USDT -> BTCUSDT (your codebase convention) */
const compact = (sym: string) => normalizeUnifiedSymbol(sym).replace('/', '');

function readTickerQuoteVol(t: any): number {
  const qv = Number(t?.quoteVolume);
  if (Number.isFinite(qv) && qv > 0) return qv;

  const bv = Number(t?.baseVolume);
  if (Number.isFinite(bv) && bv > 0) return bv;

  const iqv = Number(t?.info?.quoteVolume ?? t?.info?.volCcy24h ?? t?.info?.vol24h);
  return Number.isFinite(iqv) && iqv > 0 ? iqv : 0;
}

function readMarketQuote(m: any): string | undefined {
  return m?.quote; // ccxt unified market
}

function readMarketVolHint(m: any): number {
  const info = m?.info ?? {};
  const fields = [info.quoteVolume, info.volCcy24h, info.vol24h, info.volume];
  for (const f of fields) {
    const n = Number(f);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

/* -------------------------------------------------------
 * Top-N symbols cache
 * ----------------------------------------------------- */

type TopKey = string; // `${ex.id}:${base}:${limit}`
const topCache = new Map<TopKey, { at: number; symbols: string[] }>();
const TOP_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Compute Top-N symbols (compact e.g. BTCUSDT) quoted in `base`,
 * ranked by quote volume. Tries fetchTickers first, falls back to loadMarkets.
 */
export async function computeTop100(
  ex: Ex,
  base: string,
  limit: number
): Promise<string[]> {
  const key: TopKey = `${ex.id}:${base}:${limit}`;

  // Fast/accurate path: tickers
  try {
    if ((ex.has as any)?.fetchTickers) {
      const tickers = await ex.fetchTickers();
      const list = Object.entries(tickers)
        .filter(([sym, t]) => {
          const unified = normalizeUnifiedSymbol(sym as string);
          const [, q] = unified.split('/');
          return q === base && readTickerQuoteVol(t) > 0;
        })
        .map(([sym, t]) => ({ sym: compact(sym as string), vol: readTickerQuoteVol(t) }))
        .sort((a, b) => b.vol - a.vol)
        .slice(0, limit)
        .map(x => x.sym);

      if (list.length) {
        topCache.set(key, { at: Date.now(), symbols: list });
        return list;
      }
    }
  } catch {
    // ignore and try fallback
  }

  // Fallback: markets metadata (lighter than fetching many tickers on some venues)
  const markets = await ex.loadMarkets();
  const live = Object.values(markets).filter((m: any) => {
    const active = typeof m.active === 'boolean' ? m.active : true;
    return active && m.spot && readMarketQuote(m) === base;
  });

  const ranked = live
    .map((m: any) => ({ sym: compact(m.symbol), vol: readMarketVolHint(m) }))
    .sort((a, b) => b.vol - a.vol)
    .slice(0, limit)
    .map(x => x.sym);

  topCache.set(key, { at: Date.now(), symbols: ranked });
  return ranked;
}

/** Return cached Top list; recompute when TTL expires */
export async function getTop100Symbols(
  ex: Ex,
  base: string,
  limit: number
): Promise<string[]> {
  const key: TopKey = `${ex.id}:${base}:${limit}`;
  const hit = topCache.get(key);
  if (!hit || Date.now() - hit.at > TOP_TTL_MS) {
    return computeTop100(ex, base, limit);
  }
  return hit.symbols;
}
