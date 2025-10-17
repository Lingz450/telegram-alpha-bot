// src/core/regime.ts
export type Regime =
  | 'uptrend-strong'
  | 'uptrend-cooling'
  | 'downtrend-weak'
  | 'downtrend-strong'
  | 'transition';

export function classifyRegime(params: {
  price: number; ema50: number; ema200: number; atrPct: number; rsi: number;
}): Regime {
  const { price, ema50, ema200, atrPct, rsi } = params;
  const up = price >= ema200;
  const momUp = ema50 >= ema200 && price >= ema50;
  if (up && momUp && rsi < 70) return 'uptrend-strong';
  if (up && !momUp) return 'uptrend-cooling';
  if (!up && !momUp) return rsi < 35 ? 'downtrend-strong' : 'downtrend-weak';
  return 'transition';
}

export function suggestRiskBPS(regime: Regime, atrPct: number): number {
  // basis points of account (default small; widen when strong)
  if (regime === 'uptrend-strong' && atrPct < 0.8) return 50;   // 0.50%
  if (regime === 'downtrend-strong' && atrPct > 1.2) return 20; // 0.20%
  if (regime === 'transition') return 30;
  return 40;
}
