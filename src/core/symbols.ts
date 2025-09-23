function clean(raw: string): string {
  return String(raw).trim().toUpperCase().replace(/[^A-Z0-9/]/g, '');
}
export function normSymbol(input: string, defaultQuote = 'USDT'): string {
  let s = clean(input);
  if (s.includes(':')) s = s.split(':')[0];
  if (s.includes('/')) { const [b, q] = s.split('/'); return (b + q); }
  const m = s.match(/^([A-Z0-9]+)(USDT|USDC|USD|BTC|ETH|EUR|USDD|FDUSD|BUSD)$/);
  if (m) return s;
  return s + defaultQuote;
}
export function prettySymbol(compact: string): string {
  const s = clean(compact);
  const m = s.match(/^(.+?)(USDT|USDC|USD|BTC|ETH|EUR|USDD|FDUSD|BUSD)$/);
  return m ? `${m[1]}/${m[2]}` : s;
}
