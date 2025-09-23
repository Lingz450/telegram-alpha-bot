// src/exchange/marketData.ts
import type ccxt from 'ccxt';

/** ---------- small in-file TTL caches (no extra imports) ---------- */
type CacheEntry<V> = { exp: number; val: V };
class MapTTL<K, V> {
  private m = new Map<K, CacheEntry<V>>();
  constructor(private ttlMs: number) {}
  get(key: K): V | undefined {
    const e = this.m.get(key);
    if (!e) return;
    if (Date.now() > e.exp) {
      this.m.delete(key);
      return;
    }
    return e.val;
  }
  set(key: K, val: V) {
    this.m.set(key, { exp: Date.now() + this.ttlMs, val });
  }
  clear() {
    this.m.clear();
  }
}

// Cache horizons (tune if you like)
const klineCache   = new MapTTL<string, { t:number,o:number,h:number,l:number,c:number,v:number }[]>(30_000); // 30s
const tickerCache  = new MapTTL<string, any>(10_000); // 10s
const obCache      = new MapTTL<string, any>(3_000);  // 3s

/** ---------- ensure we load markets once per Exchange instance ---------- */
const loaded = new WeakSet<ccxt.Exchange>();
async function ensureLoaded(ex: ccxt.Exchange) {
  if (loaded.has(ex)) return;
  try { await ex.loadMarkets(); } catch { /* non-fatal */ }
  loaded.add(ex);
}

/** Strip CCXT suffix like BTC/USDT:USDT -> BTC/USDT */
function normalizeUnified(sym: string): string {
  const s = String(sym);
  if (s.includes(':')) return s.split(':')[0];
  return s;
}

/**
 * Resolve a compact symbol like BTCUSDT into a unified symbol BTC/USDT
 * using exchange metadata when possible, else a regex heuristic.
 */
function toUnified(ex: ccxt.Exchange, symbol: string): string {
  // 1) already unified?
  if (symbol.includes('/')) return normalizeUnified(symbol);

  // 2) markets_by_id (some exchanges map compact ids to unified)
  // @ts-ignore - ccxt typing doesn't expose this index strongly
  const byId = (ex as any).markets_by_id?.[symbol];
  if (byId?.symbol) return normalizeUnified(byId.symbol);

  // 3) markets_by_symbol (rare case: user passed BTC/USDT w/o '/')
  // @ts-ignore
  const bySym = (ex as any).markets_by_symbol?.[symbol];
  if (bySym?.symbol) return normalizeUnified(bySym.symbol);

  // 4) heuristic: split trailing quote (USDT/USDC/USD/BTC/ETH/EUR/BUSD/FDUSD/USDD)
  const m = symbol.match(/^(.+?)(USDT|USDC|USD|BTC|ETH|EUR|BUSD|FDUSD|USDD)$/i);
  if (m) return `${m[1].toUpperCase()}/${m[2].toUpperCase()}`;

  // 5) last resort: return as-is (ccxt may still accept)
  return symbol.toUpperCase();
}

/** ---------- public helpers ---------- */
export async function klines(
  ex: ccxt.Exchange,
  symbol: string,
  timeframe: '5m'|'15m'|'1h'|'2h'|'4h'|'1d',
  limit = 300
) {
  await ensureLoaded(ex);
  const unified = toUnified(ex, symbol);
  const key = `${ex.id}|k|${unified}|${timeframe}|${limit}`;
  const hit = klineCache.get(key);
  if (hit) return hit;

  const raw = await ex.fetchOHLCV(unified, timeframe, undefined, limit);
  const out = raw.map(([t, o, h, l, c, v]) => ({ t, o, h, l, c, v }));
  klineCache.set(key, out);
  return out;
}

export async function orderbook(ex: ccxt.Exchange, symbol: string, depth = 50) {
  await ensureLoaded(ex);
  const unified = toUnified(ex, symbol);
  const key = `${ex.id}|ob|${unified}|${depth}`;
  const hit = obCache.get(key);
  if (hit) return hit;

  const ob = await ex.fetchOrderBook(unified, depth);
  obCache.set(key, ob);
  return ob;
}

export async function ticker(ex: ccxt.Exchange, symbol: string) {
  await ensureLoaded(ex);
  const unified = toUnified(ex, symbol);
  const key = `${ex.id}|t|${unified}`;
  const hit = tickerCache.get(key);
  if (hit) return hit;

  const t = await ex.fetchTicker(unified);
  tickerCache.set(key, t);
  return t;
}
