// src/lib/voice.ts
// A tiny “free & friendly” copy engine so your bot talks like a smart friend,
// not a corporate brochure. Zero deps, safe to use everywhere.

export type Mood = "neutral" | "friendly" | "spicy" | "dry";
export type Channel = "dm" | "group";

type SayOpts = {
  mood?: Mood;
  channel?: Channel;       // shorter in groups, extra detail in DMs
  prefix?: boolean;        // show emoji prefix
  maxLen?: number;         // hard cap for safety (characters)
};

const EMOJI = {
  neutral: "ℹ️",
  friendly: "✨",
  spicy: "🧪",
  dry: "·",
  success: "✅",
  warn: "⚠️",
  fail: "❌",
  chart: "📈",
  heatmap: "🔥",
  alert: "🔔",
};

const DEFAULTS: Required<Omit<SayOpts, "mood" | "channel">> & {
  mood: Mood;
  channel: Channel;
} = {
  mood: "friendly",
  channel: "group",
  prefix: true,
  maxLen: 1800, // keep well under Telegram’s 4096
};

const TRIMS = {
  // group messages should be concise
  group: 0.9,
  // DMs can be a bit longer
  dm: 1.0,
} as const;

/* ---------------- utilities ---------------- */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cleanSpaces(s: string) {
  return s.replace(/\s+/g, " ").replace(/\s([,.;:!?])/g, "$1").trim();
}

function clampLen(s: string, max: number) {
  if (s.length <= max) return s;
  // try to cut at sentence boundary
  const cut = s.lastIndexOf(". ", max - 1);
  const idx = cut > 0 ? cut + 1 : max;
  return s.slice(0, idx).trim() + "…";
}

function joinParts(parts: Array<string | undefined | false | null>) {
  return cleanSpaces(parts.filter(Boolean).join(" "));
}

/* ---------------- public API ---------------- */

/**
 * say — compose a single friendly line.
 * Example:
 *   say({ mood:"spicy" }, "btc hovering", lvl("res", 45600), hint("tight stops"))
 */
export function say(
  opts: SayOpts | undefined,
  ...segments: Array<string | undefined | false | null>
): string {
  const o = { ...DEFAULTS, ...(opts || {}) };
  const body = joinParts(segments);
  const tag = o.prefix ? EMOJI[o.mood!] + " " : "";
  const trimmed = clampLen(body, Math.floor(o.maxLen! * TRIMS[o.channel!]));
  return tag + trimmed;
}

/**
 * lines — compose multiple lines with consistent mood.
 * Automatically joins with newlines and clamps safely.
 */
export function lines(
  opts: SayOpts | undefined,
  paragraphs: Array<string | undefined | false | null>
): string {
  const o = { ...DEFAULTS, ...(opts || {}) };
  const text = paragraphs.filter(Boolean).map(cleanSpaces).join("\n");
  const tag = o.prefix ? EMOJI[o.mood!] + " " : "";
  return tag + clampLen(text, Math.floor(o.maxLen! * TRIMS[o.channel!]));
}

/**
 * toneFor — choose mood heuristically from quick context.
 */
export function toneFor(input: {
  isAdmin?: boolean;
  urgency?: "low" | "normal" | "high";
  market?: "bull" | "bear" | "chop";
  channel?: Channel;
}): Required<Pick<SayOpts, "mood" | "channel">> {
  const channel = input.channel ?? "group";
  if (input.urgency === "high") return { mood: "spicy", channel };
  if (input.market === "bear") return { mood: "dry", channel };
  if (input.market === "bull") return { mood: "friendly", channel };
  return { mood: "neutral", channel };
}

/* ---------------- micro-helpers for common phrases ---------------- */

export function lvl(kind: "res" | "sup" | "mid", v: number | string) {
  const tag = kind === "res" ? "res" : kind === "sup" ? "sup" : "mid";
  return `(${tag} ${v})`;
}

export function up(v?: string | number) {
  return `${EMOJI.chart} ${v !== undefined ? v : "pushes possible"}`;
}

export function heat() {
  return `${EMOJI.heatmap} watch the book`;
}

export function warn(s: string) {
  return `${EMOJI.warn} ${cleanSpaces(s)}`;
}

export function ok(s: string) {
  return `${EMOJI.success} ${cleanSpaces(s)}`;
}

export function nope(s: string) {
  return `${EMOJI.fail} ${cleanSpaces(s)}`;
}

/**
 * hint — tiny CTA style helper for UI cues, e.g. inline button tooltips.
 */
export function hint(s: string) {
  return `(${cleanSpaces(s)})`;
}

/**
 * disclaimer — short, consistent disclaimer for popups or footers.
 */
export function disclaimer(): string {
  const variants = [
    "Educational commentary, not financial advice. Manage risk and size positions.",
    "This is info, not advice. Use stops, size small, do your own research.",
    "Heads up, not financial advice. Protect capital and use risk controls.",
  ] as const;
  return pick(variants);
}

/* ---------------- canned snippets used across commands ---------------- */

export const Snip = {
  rsiSummary: (r15: number, r1: number, r4: number, rd: number) =>
    `RSI — 15m ${Math.round(r15)}, 1h ${Math.round(r1)}, 4h ${Math.round(r4)}, 1d ${Math.round(rd)}`,

  emaTrend: (ema50: number, ema200: number, tf = "4h") =>
    `EMA ${tf} 50=${ema50.toFixed(2)} 200=${ema200.toFixed(2)} ${ema50 > ema200 ? "↑ trend" : "↓ trend"}`,

  atrNote: (atrVal: number, pct?: number) =>
    `ATR ~ ${atrVal.toFixed(4)}${Number.isFinite(pct!) ? ` (${(pct! * 100).toFixed(2)}%)` : ""}`,

  levels: (res?: number, sup?: number, extra?: string) =>
    joinParts([
      res ? `res ${res}` : undefined,
      sup ? `sup ${sup}` : undefined,
      extra,
    ]),
};

/* ---------------- convenience: quick presets ---------------- */

export const Voice = {
  friendly: (...parts: Array<string | undefined | false | null>) =>
    say({ mood: "friendly", channel: "group", prefix: true }, ...parts),
  spicy: (...parts: Array<string | undefined | false | null>) =>
    say({ mood: "spicy", channel: "group", prefix: true }, ...parts),
  neutral: (...parts: Array<string | undefined | false | null>) =>
    say({ mood: "neutral", channel: "group", prefix: true }, ...parts),
  dm: (...parts: Array<string | undefined | false | null>) =>
    say({ mood: "friendly", channel: "dm", prefix: true }, ...parts),
};

export default {
  say,
  lines,
  toneFor,
  lvl,
  up,
  heat,
  warn,
  ok,
  nope,
  hint,
  disclaimer,
  Snip,
  Voice,
  EMOJI,
};
