"use strict";
// src/lib/voice.ts
// A tiny “free & friendly” copy engine so your bot talks like a smart friend,
// not a corporate brochure. Zero deps, safe to use everywhere.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Voice = exports.Snip = void 0;
exports.say = say;
exports.lines = lines;
exports.toneFor = toneFor;
exports.lvl = lvl;
exports.up = up;
exports.heat = heat;
exports.warn = warn;
exports.ok = ok;
exports.nope = nope;
exports.hint = hint;
exports.disclaimer = disclaimer;
var EMOJI = {
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
var DEFAULTS = {
    mood: "friendly",
    channel: "group",
    prefix: true,
    maxLen: 1800, // keep well under Telegram’s 4096
};
var TRIMS = {
    // group messages should be concise
    group: 0.9,
    // DMs can be a bit longer
    dm: 1.0,
};
/* ---------------- utilities ---------------- */
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function cleanSpaces(s) {
    return s.replace(/\s+/g, " ").replace(/\s([,.;:!?])/g, "$1").trim();
}
function clampLen(s, max) {
    if (s.length <= max)
        return s;
    // try to cut at sentence boundary
    var cut = s.lastIndexOf(". ", max - 1);
    var idx = cut > 0 ? cut + 1 : max;
    return s.slice(0, idx).trim() + "…";
}
function joinParts(parts) {
    return cleanSpaces(parts.filter(Boolean).join(" "));
}
/* ---------------- public API ---------------- */
/**
 * say — compose a single friendly line.
 * Example:
 *   say({ mood:"spicy" }, "btc hovering", lvl("res", 45600), hint("tight stops"))
 */
function say(opts) {
    var segments = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        segments[_i - 1] = arguments[_i];
    }
    var o = __assign(__assign({}, DEFAULTS), (opts || {}));
    var body = joinParts(segments);
    var tag = o.prefix ? EMOJI[o.mood] + " " : "";
    var trimmed = clampLen(body, Math.floor(o.maxLen * TRIMS[o.channel]));
    return tag + trimmed;
}
/**
 * lines — compose multiple lines with consistent mood.
 * Automatically joins with newlines and clamps safely.
 */
function lines(opts, paragraphs) {
    var o = __assign(__assign({}, DEFAULTS), (opts || {}));
    var text = paragraphs.filter(Boolean).map(cleanSpaces).join("\n");
    var tag = o.prefix ? EMOJI[o.mood] + " " : "";
    return tag + clampLen(text, Math.floor(o.maxLen * TRIMS[o.channel]));
}
/**
 * toneFor — choose mood heuristically from quick context.
 */
function toneFor(input) {
    var _a;
    var channel = (_a = input.channel) !== null && _a !== void 0 ? _a : "group";
    if (input.urgency === "high")
        return { mood: "spicy", channel: channel };
    if (input.market === "bear")
        return { mood: "dry", channel: channel };
    if (input.market === "bull")
        return { mood: "friendly", channel: channel };
    return { mood: "neutral", channel: channel };
}
/* ---------------- micro-helpers for common phrases ---------------- */
function lvl(kind, v) {
    var tag = kind === "res" ? "res" : kind === "sup" ? "sup" : "mid";
    return "(".concat(tag, " ").concat(v, ")");
}
function up(v) {
    return "".concat(EMOJI.chart, " ").concat(v !== undefined ? v : "pushes possible");
}
function heat() {
    return "".concat(EMOJI.heatmap, " watch the book");
}
function warn(s) {
    return "".concat(EMOJI.warn, " ").concat(cleanSpaces(s));
}
function ok(s) {
    return "".concat(EMOJI.success, " ").concat(cleanSpaces(s));
}
function nope(s) {
    return "".concat(EMOJI.fail, " ").concat(cleanSpaces(s));
}
/**
 * hint — tiny CTA style helper for UI cues, e.g. inline button tooltips.
 */
function hint(s) {
    return "(".concat(cleanSpaces(s), ")");
}
/**
 * disclaimer — short, consistent disclaimer for popups or footers.
 */
function disclaimer() {
    var variants = [
        "Educational commentary, not financial advice. Manage risk and size positions.",
        "This is info, not advice. Use stops, size small, do your own research.",
        "Heads up, not financial advice. Protect capital and use risk controls.",
    ];
    return pick(variants);
}
/* ---------------- canned snippets used across commands ---------------- */
exports.Snip = {
    rsiSummary: function (r15, r1, r4, rd) {
        return "RSI \u2014 15m ".concat(Math.round(r15), ", 1h ").concat(Math.round(r1), ", 4h ").concat(Math.round(r4), ", 1d ").concat(Math.round(rd));
    },
    emaTrend: function (ema50, ema200, tf) {
        if (tf === void 0) { tf = "4h"; }
        return "EMA ".concat(tf, " 50=").concat(ema50.toFixed(2), " 200=").concat(ema200.toFixed(2), " ").concat(ema50 > ema200 ? "↑ trend" : "↓ trend");
    },
    atrNote: function (atrVal, pct) {
        return "ATR ~ ".concat(atrVal.toFixed(4)).concat(Number.isFinite(pct) ? " (".concat((pct * 100).toFixed(2), "%)") : "");
    },
    levels: function (res, sup, extra) {
        return joinParts([
            res ? "res ".concat(res) : undefined,
            sup ? "sup ".concat(sup) : undefined,
            extra,
        ]);
    },
};
/* ---------------- convenience: quick presets ---------------- */
exports.Voice = {
    friendly: function () {
        var parts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parts[_i] = arguments[_i];
        }
        return say.apply(void 0, __spreadArray([{ mood: "friendly", channel: "group", prefix: true }], parts, false));
    },
    spicy: function () {
        var parts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parts[_i] = arguments[_i];
        }
        return say.apply(void 0, __spreadArray([{ mood: "spicy", channel: "group", prefix: true }], parts, false));
    },
    neutral: function () {
        var parts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parts[_i] = arguments[_i];
        }
        return say.apply(void 0, __spreadArray([{ mood: "neutral", channel: "group", prefix: true }], parts, false));
    },
    dm: function () {
        var parts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parts[_i] = arguments[_i];
        }
        return say.apply(void 0, __spreadArray([{ mood: "friendly", channel: "dm", prefix: true }], parts, false));
    },
};
exports.default = {
    say: say,
    lines: lines,
    toneFor: toneFor,
    lvl: lvl,
    up: up,
    heat: heat,
    warn: warn,
    ok: ok,
    nope: nope,
    hint: hint,
    disclaimer: disclaimer,
    Snip: exports.Snip,
    Voice: exports.Voice,
    EMOJI: EMOJI,
};
