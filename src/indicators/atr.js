"use strict";
// src/indicators/atr.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.atr = atr;
/** Internal: compute ATR from a TR (true range) series aligned to candles length */
function atrFromTR(tr, period) {
    var n = tr.length;
    var out = new Array(n).fill(Number.NaN);
    if (n === 0)
        return out;
    // Seed at index = period with the simple average of the previous `period` TR values.
    // We start TR at i=0 using H-L, so the first "real" average lands at index `period`.
    if (n >= period + 1) {
        var sum = 0;
        for (var i = 1; i <= period; i++)
            sum += tr[i];
        out[period] = sum / period;
        // Wilder smoothing from there
        for (var i = period + 1; i < n; i++) {
            out[i] = ((out[i - 1] * (period - 1)) + tr[i]) / period;
        }
    }
    return out;
}
/** Build TR series aligned to candles: TR[0] = H-L (no prev close), then Wilder TR */
function buildTRFromCandles(candles) {
    var n = candles.length;
    var tr = new Array(n).fill(Number.NaN);
    if (n === 0)
        return tr;
    // First bar: simple range
    tr[0] = Math.max(0, candles[0].h - candles[0].l);
    for (var i = 1; i < n; i++) {
        var cur = candles[i], prev = candles[i - 1];
        var r1 = cur.h - cur.l;
        var r2 = Math.abs(cur.h - prev.c);
        var r3 = Math.abs(cur.l - prev.c);
        tr[i] = Math.max(r1, r2, r3);
    }
    return tr;
}
/** Build TR series from separate H/L/C arrays */
function buildTRFromArrays(high, low, close) {
    var n = Math.min(high.length, low.length, close.length);
    var tr = new Array(n).fill(Number.NaN);
    if (n === 0)
        return tr;
    tr[0] = Math.max(0, high[0] - low[0]);
    for (var i = 1; i < n; i++) {
        var r1 = high[i] - low[i];
        var r2 = Math.abs(high[i] - close[i - 1]);
        var r3 = Math.abs(low[i] - close[i - 1]);
        tr[i] = Math.max(r1, r2, r3);
    }
    return tr;
}
function atr(a, b, c, d) {
    var _a, _b, _c;
    // Signature 1: atr(candles, period?)
    if (Array.isArray(a) && typeof a[0] === 'object') {
        var candles = a;
        var period_1 = typeof b === 'number' ? b : 14;
        if (!candles.length || period_1 <= 1)
            return new Array(candles.length).fill(Number.NaN);
        var tr_1 = buildTRFromCandles(candles);
        return atrFromTR(tr_1, period_1);
    }
    // Signature 2: atr(high[], low[], close[], period?)
    var highs = a;
    var lows = b;
    var closes = c;
    var period = typeof d === 'number' ? d : 14;
    var n = Math.min((_a = highs === null || highs === void 0 ? void 0 : highs.length) !== null && _a !== void 0 ? _a : 0, (_b = lows === null || lows === void 0 ? void 0 : lows.length) !== null && _b !== void 0 ? _b : 0, (_c = closes === null || closes === void 0 ? void 0 : closes.length) !== null && _c !== void 0 ? _c : 0);
    if (!n || period <= 1)
        return new Array(n).fill(Number.NaN);
    var tr = buildTRFromArrays(highs, lows, closes);
    return atrFromTR(tr, period);
}
