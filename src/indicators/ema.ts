export function ema(values: number[], period: number): number[] {
  if (!values.length || period <= 1) return values.slice();
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i++) {
    const val = values[i] * k + prev * (1 - k);
    out.push(val);
    prev = val;
  }
  return out;
}
