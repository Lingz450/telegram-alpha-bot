// src/ui.ts
// One tiny UI system for Telegram (HTML) so every message looks like a neat card.

export type Tone = "neutral" | "bull" | "bear" | "info" | "warn" | "ok";

export const glyph = {
  dot: "•",
  sep: "—",
  bull: "🟢",
  bear: "🔴",
  info: "ℹ️",
  warn: "⚠️",
  ok: "✅",
  chart: "📈",
  book: "📚",
  bell: "🔔",
  coin: "💰",
  bolt: "⚡",
};

export function nf(dp = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function dpForPrice(p: number) {
  if (!Number.isFinite(p) || p === 0) return 2;
  const a = Math.abs(p);
  if (a >= 1000) return 0;
  if (a >= 100) return 1;
  if (a >= 1) return 2;
  if (a >= 0.1) return 3;
  if (a >= 0.01) return 4;
  if (a >= 0.001) return 5;
  return 6;
}

export function esc(s: unknown) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ─────────────  Card primitives  ───────────── */

export function head(title: string, subtitle?: string, icon = glyph.chart) {
  return `<b>${icon} ${esc(title)}</b>${subtitle ? ` <i>(${esc(subtitle)})</i>` : ""}`;
}

export function kv(key: string, val: string) {
  return `${glyph.dot} <b>${esc(key)}:</b> ${val}`;
}

export function line() {
  return `<i>${glyph.sep.repeat(20)}</i>`;
}

export function section(title: string) {
  return `\n<b>${esc(title)}:</b>`;
}

export function code(v: string | number) {
  return `<code>${esc(v)}</code>`;
}

export function tonePrefix(t: Tone) {
  if (t === "bull") return glyph.bull;
  if (t === "bear") return glyph.bear;
  if (t === "info" || t === "neutral") return glyph.info;
  if (t === "warn") return glyph.warn;
  return glyph.ok;
}

export function note(text: string, t: Tone = "info") {
  return `${tonePrefix(t)} ${esc(text)}`;
}

/** A composed card message */
export function card(blocks: (string | false | null | undefined)[]) {
  return blocks.filter(Boolean).join("\n");
}

/* ─────────────  Fancy helpers  ───────────── */

export function priceLine(label: string, p: number) {
  const n = nf(dpForPrice(p));
  return kv(label, code(n.format(p)));
}

export function pct(v: number, dp = 2) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(dp)}%`;
}

/** Common footer */
export const disclaimer = note("Educational only. Manage risk. DYOR.", "warn");

/** Standard send options */
export const sendOpts = { parse_mode: "HTML" as const, disable_web_page_preview: true };
