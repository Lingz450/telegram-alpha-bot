export function parseHumanNumber(input: string): number | null {
  const raw = String(input).trim().toLowerCase().replace(/[, ]/g, '');
  const m = raw.match(/^(-?\d+(?:\.\d+)?)([kmb])?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const mul = m[2]?.toLowerCase() === 'k' ? 1e3 : m[2]?.toLowerCase() === 'm' ? 1e6 : m[2]?.toLowerCase() === 'b' ? 1e9 : 1;
  return n * mul;
}
export function parseKvArgs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_][a-zA-Z0-9_]*)=("[^"]+"|[^\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out[m[1].toLowerCase()] = m[2].replace(/^"|"$/g, '');
  return out;
}
export const parseNumberList = (csv: string) =>
  String(csv).split(',').map(x => parseFloat(x.trim())).filter(n => Number.isFinite(n));
