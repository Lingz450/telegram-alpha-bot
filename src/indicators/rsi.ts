export function rsi(closes: number[], period = 14): number[] {
  const out: number[] = [];
  if (closes.length <= period) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch >= 0) gains += ch; else losses -= ch;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  out.push(100 - 100 / (1 + (avgG / (avgL || 1e-9))));
  for (let i = period + 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const gain = Math.max(0, ch);
    const loss = Math.max(0, -ch);
    avgG = (avgG * (period - 1) + gain) / period;
    avgL = (avgL * (period - 1) + loss) / period;
    out.push(100 - 100 / (1 + (avgG / (avgL || 1e-9))));
  }
  return out;
}
