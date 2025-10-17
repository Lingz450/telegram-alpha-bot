import type { Telegraf } from 'telegraf';
import type { Cfg } from '../config';
import { makeExchange } from '../exchange/client';
import { ticker } from '../exchange/marketData';
import { normSymbol, prettySymbol } from '../core/symbols';

const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function fmtUSD(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '-';
  const abs = Math.abs(n);
  return abs >= 1000 ? `$${nf0.format(n)}` : `$${nf2.format(n)}`;
}
function fmtPct(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '-';
  const s = n >= 0 ? '+' : '';
  return `${s}${nf2.format(n)}%`;
}
function buildPulseCard(symbol: string, data: {
  last?: number | null; changePct?: number | null; high?: number | null; low?: number | null;
}) {
  return [
    `🧭 **${prettySymbol(symbol)}**`,
    `• Price: ${fmtUSD(data.last)}  (${fmtPct(data.changePct)})`,
    `• Day Range: ${fmtUSD(data.low)} → ${fmtUSD(data.high)}`,
    '',
    '_⚠️ Educational only. Not financial advice._',
  ].join('\n');
}

async function fetchOne(ex: Awaited<ReturnType<typeof makeExchange>>, pair: string) {
  try {
    const t = await ticker(ex, pair);
    const last  = Number(t?.last ?? t?.close ?? t?.info?.last ?? t?.info?.c ?? NaN);
    const high  = Number(t?.high ?? t?.info?.high ?? t?.info?.h ?? NaN);
    const low   = Number(t?.low  ?? t?.info?.low  ?? t?.info?.l ?? NaN);
    const pct   = Number(t?.percentage ?? t?.info?.priceChangePercent ?? NaN);
    return {
      last: Number.isFinite(last) ? last : null,
      high: Number.isFinite(high) ? high : null,
      low:  Number.isFinite(low)  ? low  : null,
      changePct: Number.isFinite(pct) ? pct : null,
    };
  } catch {
    return { last: null, changePct: null, high: null, low: null };
  }
}

export function startMarketPulseLoop(bot: Telegraf, cfg: Cfg, log: any) {
  const chatIds = (process.env.PULSE_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!chatIds.length) {
    log?.info?.('marketPulse: no PULSE_CHAT_IDS set — loop disabled');
    return;
  }
  const symbols = (process.env.PULSE_SYMBOLS || 'BTC,ETH,SOL,BNB')
    .split(',').map(s => s.trim()).filter(Boolean);
  const intervalSec = Math.max(30, Number(process.env.PULSE_INTERVAL_SEC || 900));
  const ex = makeExchange(cfg);

  const sendOnce = async () => {
    for (const raw of symbols) {
      const pair = normSymbol(raw, cfg.UNIVERSE_BASE);
      const data = await fetchOne(ex, pair);
      const text = buildPulseCard(pair, data);
      await Promise.allSettled(chatIds.map(id =>
        bot.telegram.sendMessage(id, text, { parse_mode: 'Markdown' })
      ));
    }
  };

  // first shot + interval
  sendOnce().catch((e) => log?.warn?.({ e }, 'marketPulse initial failed'));
  setInterval(() => sendOnce().catch((e) => log?.warn?.({ e }, 'marketPulse tick failed')),
              intervalSec * 1000);
}
