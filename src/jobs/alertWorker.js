"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAlertLoop = startAlertLoop;
var prisma_1 = require("../db/prisma");
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
var ema_1 = require("../indicators/ema");
var rsi_1 = require("../indicators/rsi");
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/**
 * Alert loop that supports:
 *  - kind: "price" (triggerPrice + direction)
 *  - kind: "ema_cross" (period, timeframe, direction: above|below|either)
 *  - kind: "rsi_threshold" (period=14, timeframe, direction: overbought|oversold, threshold)
 *
 * Backward compatibility:
 *  - If kind is missing (null/undefined), it’s treated as "price".
 */
function startAlertLoop(bot, cfg, log) {
    var ex = yield (0, client_1.makeExchange)(cfg);
    // Small, per-tick cache so we don’t refetch the same klines repeatedly
    var klineCache = new Map();
    var priceCache = new Map();
    function getTickerLast(symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var t, last, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (priceCache.has(symbol))
                            return [2 /*return*/, priceCache.get(symbol)];
                        return [4 /*yield*/, (0, marketData_1.ticker)(ex, symbol)];
                    case 1:
                        t = _b.sent();
                        last = Number(t.last);
                        if (!Number.isFinite(last))
                            return [2 /*return*/, null];
                        priceCache.set(symbol, last);
                        return [2 /*return*/, last];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function getKlines(symbol, tf, need) {
        return __awaiter(this, void 0, void 0, function () {
            var key, rows, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        key = "".concat(symbol, ":").concat(tf);
                        if (klineCache.has(key))
                            return [2 /*return*/, klineCache.get(key)];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, marketData_1.klines)(ex, symbol, tf, Math.max(need, 300))];
                    case 2:
                        rows = _b.sent();
                        klineCache.set(key, rows);
                        return [2 /*return*/, rows];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function checkPriceAlerts(alerts) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, alerts_1, a, trg, last, hit, msg, err_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, alerts_1 = alerts;
                        _b.label = 1;
                    case 1:
                        if (!(_i < alerts_1.length)) return [3 /*break*/, 9];
                        a = alerts_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, , 8]);
                        trg = Number(a.triggerPrice);
                        if (!Number.isFinite(trg))
                            return [3 /*break*/, 8];
                        return [4 /*yield*/, getTickerLast(a.symbol)];
                    case 3:
                        last = _b.sent();
                        if (last == null)
                            return [3 /*break*/, 8];
                        hit = a.direction === 'above' ? last >= trg :
                            a.direction === 'below' ? last <= trg :
                                (last >= trg || last <= trg);
                        if (!hit) return [3 /*break*/, 6];
                        return [4 /*yield*/, prisma_1.prisma.alert.update({ where: { id: a.id }, data: { active: false } })];
                    case 4:
                        _b.sent();
                        msg = "\uD83D\uDD14 <b>".concat(esc(a.symbol), "</b> touched <code>").concat(trg, "</code> (last <code>").concat(last, "</code>)");
                        return [4 /*yield*/, bot.telegram.sendMessage(a.chatId, msg, { parse_mode: 'HTML' }).catch(function () { })];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_1 = _b.sent();
                        (_a = log === null || log === void 0 ? void 0 : log.warn) === null || _a === void 0 ? void 0 : _a.call(log, { err: err_1 }, 'price-alert-check-failed');
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 1];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    function checkEmaCrossAlerts(alerts) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, _i, alerts_2, a, key, list, _a, groups_1, _b, key, list, sample, period, tf, rows, closes, e, currClose, prevClose, currEMA, prevEMA, crossUp, crossDn, _c, list_1, a, dir, hit, arrow, msg, err_2;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        groups = new Map();
                        for (_i = 0, alerts_2 = alerts; _i < alerts_2.length; _i++) {
                            a = alerts_2[_i];
                            key = "".concat(a.symbol, "|").concat(a.timeframe, "|").concat(a.period);
                            list = groups.get(key) || [];
                            list.push(a);
                            groups.set(key, list);
                        }
                        _a = 0, groups_1 = groups;
                        _e.label = 1;
                    case 1:
                        if (!(_a < groups_1.length)) return [3 /*break*/, 11];
                        _b = groups_1[_a], key = _b[0], list = _b[1];
                        sample = list[0];
                        period = Number(sample.period) || 200;
                        tf = String(sample.timeframe);
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 9, , 10]);
                        return [4 /*yield*/, getKlines(sample.symbol, tf, Math.max(300, period + 5))];
                    case 3:
                        rows = _e.sent();
                        if (!rows || rows.length < period + 2)
                            return [3 /*break*/, 10];
                        closes = rows.map(function (r) { return r.c; });
                        e = (0, ema_1.ema)(closes, period);
                        currClose = closes.at(-1);
                        prevClose = closes.at(-2);
                        currEMA = e.at(-1);
                        prevEMA = e.at(-2);
                        if (!Number.isFinite(currClose) || !Number.isFinite(prevClose) ||
                            !Number.isFinite(currEMA) || !Number.isFinite(prevEMA))
                            return [3 /*break*/, 10];
                        crossUp = prevClose < prevEMA && currClose > currEMA;
                        crossDn = prevClose > prevEMA && currClose < currEMA;
                        _c = 0, list_1 = list;
                        _e.label = 4;
                    case 4:
                        if (!(_c < list_1.length)) return [3 /*break*/, 8];
                        a = list_1[_c];
                        dir = a.direction || 'either';
                        hit = dir === 'above' ? crossUp : dir === 'below' ? crossDn : (crossUp || crossDn);
                        if (!hit)
                            return [3 /*break*/, 7];
                        return [4 /*yield*/, prisma_1.prisma.alert.update({ where: { id: a.id }, data: { active: false } })];
                    case 5:
                        _e.sent();
                        arrow = crossUp ? '↑ above' : '↓ below';
                        msg = "\uD83D\uDD14 <b>".concat(esc(a.symbol), "</b> ").concat(arrow, " EMA<code>").concat(period, "</code> on <code>").concat(esc(tf), "</code>") +
                            " (close <code>".concat(currClose, "</code> vs EMA <code>").concat(currEMA.toFixed(6), "</code>)");
                        return [4 /*yield*/, bot.telegram.sendMessage(a.chatId, msg, { parse_mode: 'HTML' }).catch(function () { })];
                    case 6:
                        _e.sent();
                        _e.label = 7;
                    case 7:
                        _c++;
                        return [3 /*break*/, 4];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        err_2 = _e.sent();
                        (_d = log === null || log === void 0 ? void 0 : log.warn) === null || _d === void 0 ? void 0 : _d.call(log, { err: err_2, key: key }, 'ema-cross-check-failed');
                        return [3 /*break*/, 10];
                    case 10:
                        _a++;
                        return [3 /*break*/, 1];
                    case 11: return [2 /*return*/];
                }
            });
        });
    }
    function checkRsiThresholdAlerts(alerts) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, _i, alerts_3, a, key, list, _a, groups_2, _b, key, list, sample, period, tf, rows, closes, series, val, _c, list_2, a, th, dir, hit, msg, err_3;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        groups = new Map();
                        for (_i = 0, alerts_3 = alerts; _i < alerts_3.length; _i++) {
                            a = alerts_3[_i];
                            key = "".concat(a.symbol, "|").concat(a.timeframe, "|").concat(a.period || 14);
                            list = groups.get(key) || [];
                            list.push(a);
                            groups.set(key, list);
                        }
                        _a = 0, groups_2 = groups;
                        _f.label = 1;
                    case 1:
                        if (!(_a < groups_2.length)) return [3 /*break*/, 11];
                        _b = groups_2[_a], key = _b[0], list = _b[1];
                        sample = list[0];
                        period = Number(sample.period) || 14;
                        tf = String(sample.timeframe);
                        _f.label = 2;
                    case 2:
                        _f.trys.push([2, 9, , 10]);
                        return [4 /*yield*/, getKlines(sample.symbol, tf, Math.max(200, period + 50))];
                    case 3:
                        rows = _f.sent();
                        if (!rows || rows.length < period + 2)
                            return [3 /*break*/, 10];
                        closes = rows.map(function (r) { return r.c; });
                        series = (0, rsi_1.rsi)(closes, period);
                        val = series.at(-1);
                        if (!val || !Number.isFinite(val))
                            return [3 /*break*/, 10];
                        _c = 0, list_2 = list;
                        _f.label = 4;
                    case 4:
                        if (!(_c < list_2.length)) return [3 /*break*/, 8];
                        a = list_2[_c];
                        th = Number((_d = a.threshold) !== null && _d !== void 0 ? _d : (a.direction === 'overbought' ? 70 : 30));
                        dir = String(a.direction || 'overbought');
                        hit = dir === 'overbought' ? val >= th : val <= th;
                        if (!hit)
                            return [3 /*break*/, 7];
                        return [4 /*yield*/, prisma_1.prisma.alert.update({ where: { id: a.id }, data: { active: false } })];
                    case 5:
                        _f.sent();
                        msg = "\uD83D\uDD14 <b>".concat(esc(a.symbol), "</b> RSI<code>").concat(period, "</code> <code>").concat(esc(tf), "</code> = <code>").concat(val.toFixed(2), "</code>") +
                            " (".concat(esc(dir), " @ <code>").concat(th, "</code>)");
                        return [4 /*yield*/, bot.telegram.sendMessage(a.chatId, msg, { parse_mode: 'HTML' }).catch(function () { })];
                    case 6:
                        _f.sent();
                        _f.label = 7;
                    case 7:
                        _c++;
                        return [3 /*break*/, 4];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        err_3 = _f.sent();
                        (_e = log === null || log === void 0 ? void 0 : log.warn) === null || _e === void 0 ? void 0 : _e.call(log, { err: err_3, key: key }, 'rsi-threshold-check-failed');
                        return [3 /*break*/, 10];
                    case 10:
                        _a++;
                        return [3 /*break*/, 1];
                    case 11: return [2 /*return*/];
                }
            });
        });
    }
    function checkOnce() {
        return __awaiter(this, void 0, void 0, function () {
            var alerts, priceAlerts, emaAlerts, rsiAlerts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Clear per-tick caches
                        klineCache.clear();
                        priceCache.clear();
                        return [4 /*yield*/, prisma_1.prisma.alert.findMany({ where: { active: true } })];
                    case 1:
                        alerts = _a.sent();
                        if (!alerts.length)
                            return [2 /*return*/];
                        priceAlerts = alerts.filter(function (a) { var _a; return ((_a = a.kind) !== null && _a !== void 0 ? _a : 'price') === 'price'; });
                        emaAlerts = alerts.filter(function (a) { return a.kind === 'ema_cross' && a.timeframe && a.period; });
                        rsiAlerts = alerts.filter(function (a) { return a.kind === 'rsi_threshold' && a.timeframe; });
                        if (!priceAlerts.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, checkPriceAlerts(priceAlerts)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!emaAlerts.length) return [3 /*break*/, 5];
                        return [4 /*yield*/, checkEmaCrossAlerts(emaAlerts)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!rsiAlerts.length) return [3 /*break*/, 7];
                        return [4 /*yield*/, checkRsiThresholdAlerts(rsiAlerts)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    var tickMs = Math.max(2000, cfg.ALERT_TICK_MS || 5000);
    function loop() {
        return __awaiter(this, void 0, void 0, function () {
            var err_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, 3, 4]);
                        return [4 /*yield*/, checkOnce()];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        err_4 = _b.sent();
                        (_a = log === null || log === void 0 ? void 0 : log.error) === null || _a === void 0 ? void 0 : _a.call(log, { err: err_4 }, 'alertLoop error');
                        return [3 /*break*/, 4];
                    case 3:
                        setTimeout(loop, tickMs);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    loop();
}
