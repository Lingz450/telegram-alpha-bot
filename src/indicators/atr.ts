type Candle = { h:number,l:number,c:number,o:number,t:number };
export function atr(candles: Candle[], period = 14): number[] {
  if (candles.length < 2) return [];
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i], prev = candles[i-1];
    const tr = Math.max(cur.h - cur.l, Math.abs(cur.h - prev.c), Math.abs(cur.l - prev.c));
    trs.push(tr);
  }
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < trs.length; i++) {
    sum += trs[i];
    if (i === period - 1) out.push(sum / period);
    else if (i >= period) out.push((out[out.length-1] * (period - 1) + trs[i]) / period);
  }
  return out;
}
