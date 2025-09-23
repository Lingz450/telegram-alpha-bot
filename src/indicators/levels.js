"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findKeyLevels = findKeyLevels;
function isPivotHigh(arr, i, left, right) {
    var _a, _b;
    for (var j = 1; j <= left; j++)
        if (arr[i].h <= ((_a = arr[i - j]) === null || _a === void 0 ? void 0 : _a.h))
            return false;
    for (var j = 1; j <= right; j++)
        if (arr[i].h <= ((_b = arr[i + j]) === null || _b === void 0 ? void 0 : _b.h))
            return false;
    return true;
}
function isPivotLow(arr, i, left, right) {
    var _a, _b;
    for (var j = 1; j <= left; j++)
        if (arr[i].l >= ((_a = arr[i - j]) === null || _a === void 0 ? void 0 : _a.l))
            return false;
    for (var j = 1; j <= right; j++)
        if (arr[i].l >= ((_b = arr[i + j]) === null || _b === void 0 ? void 0 : _b.l))
            return false;
    return true;
}
function findKeyLevels(candles, left, right) {
    if (left === void 0) { left = 3; }
    if (right === void 0) { right = 3; }
    var highs = [];
    var lows = [];
    for (var i = left; i < candles.length - right; i++) {
        if (isPivotHigh(candles, i, left, right))
            highs.push(candles[i].h);
        if (isPivotLow(candles, i, left, right))
            lows.push(candles[i].l);
    }
    var lastClose = candles.at(-1).c;
    // Sort by distance from last close (nearest first)
    var resistances = highs.filter(function (x) { return x > lastClose; }).sort(function (a, b) { return Math.abs(a - lastClose) - Math.abs(b - lastClose); });
    var supports = lows.filter(function (x) { return x < lastClose; }).sort(function (a, b) { return Math.abs(a - lastClose) - Math.abs(b - lastClose); });
    return { supports: supports, resistances: resistances };
}
