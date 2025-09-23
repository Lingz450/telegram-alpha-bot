export function fmtNum(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return 'NaN';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(dp) + 'b';
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(dp) + 'm';
  if (abs >= 1_000) return (n / 1_000).toFixed(dp) + 'k';
  return n.toFixed(dp);
}
export function code(v: string | number): string { return '`' + String(v) + '`'; }
export const esc = (s: unknown) => String(s).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]!));
