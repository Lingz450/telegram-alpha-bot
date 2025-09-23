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
exports.registerBacktest = registerBacktest;
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
var ema_1 = require("../indicators/ema");
function esc(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
function dd(equity) {
    var peak = equity[0], maxDD = 0;
    for (var _i = 0, equity_1 = equity; _i < equity_1.length; _i++) {
        var v = equity_1[_i];
        if (v > peak)
            peak = v;
        var d = (peak - v) / (peak || 1);
        if (d > maxDD)
            maxDD = d;
    }
    return maxDD;
}
var TF_MINUTES = {
    "5m": 5,
    "15m": 15,
    "1h": 60,
    "2h": 120,
    "4h": 240,
    "1d": 1440,
};
function registerBacktest(bot, cfg, _log) {
    var _this = this;
    // Usage:
    // backtest ema 50/200 1h BTC            -> default lookback 180d, fee 0.0008
    // backtest ema 50/200 5m BTC lookback=72h fee=0.0012
    bot.hears(/^backtest\s+ema\s+(\d{1,3})\/(\d{1,3})\s+(5m|15m|1h|2h|4h|1d)\s+([A-Za-z0-9\-\/]+)(?:\s+lookback=(\d+)([dh]))?(?:\s+fee=(\d+(\.\d+)?))?$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a, fStr, sStr, tf, symRaw, amtStr, unit, feeStr, fast, slow, symbol, fee, lookVal, lookUnit, lookbackHours, lookbackMs, tfMin, needCandles, limit, ex, ks, startTs_1, slice, closes, eFast, eSlow, inTrade, entry, trades, equity, i, cf, cs, pf, ps, exit, gross, net, exit, gross, net, wins, losses, winrate, winSum, lossSum, lossAbs, pfVal, total, maxdd, msg, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _a = ctx.match, fStr = _a[1], sStr = _a[2], tf = _a[3], symRaw = _a[4], amtStr = _a[5], unit = _a[6], feeStr = _a[7];
                    fast = Number(fStr);
                    slow = Number(sStr);
                    symbol = symRaw.toUpperCase().replace("/", "") +
                        (symRaw.toUpperCase().endsWith("USDT") ? "" : "USDT");
                    fee = feeStr ? Number(feeStr) : 0.0008;
                    lookVal = amtStr ? Number(amtStr) : 180;
                    lookUnit = unit === "h" ? "h" : "d";
                    lookbackHours = lookUnit === "h" ? lookVal : lookVal * 24;
                    lookbackMs = lookbackHours * 60 * 60 * 1000;
                    tfMin = TF_MINUTES[tf];
                    if (!tfMin)
                        return [2 /*return*/, ctx.reply("Unsupported timeframe.")];
                    needCandles = Math.ceil(lookbackMs / (tfMin * 60 * 1000)) + slow + 50;
                    limit = Math.min(Math.max(needCandles, 500), 5000);
                    ex = (0, client_1.makeExchange)(cfg);
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, symbol, tf, limit)];
                case 1:
                    ks = _b.sent();
                    startTs_1 = Date.now() - lookbackMs;
                    slice = ks.filter(function (k) { return k.t >= startTs_1; });
                    if (slice.length < slow + 10) {
                        return [2 /*return*/, ctx.reply("Not enough candles for that lookback or periods. Got ".concat(slice.length, ", need at least ").concat(slow + 10, "."))];
                    }
                    closes = slice.map(function (c) { return c.c; });
                    eFast = (0, ema_1.ema)(closes, fast);
                    eSlow = (0, ema_1.ema)(closes, slow);
                    inTrade = false;
                    entry = 0;
                    trades = [];
                    equity = [1];
                    for (i = 1; i < closes.length; i++) {
                        cf = eFast[i], cs = eSlow[i], pf = eFast[i - 1], ps = eSlow[i - 1];
                        if (!Number.isFinite(cf) ||
                            !Number.isFinite(cs) ||
                            !Number.isFinite(pf) ||
                            !Number.isFinite(ps))
                            continue;
                        // golden cross
                        if (!inTrade && pf <= ps && cf > cs) {
                            inTrade = true;
                            entry = closes[i];
                        }
                        // death cross
                        if (inTrade && pf >= ps && cf < cs) {
                            exit = closes[i];
                            gross = (exit - entry) / entry;
                            net = gross - fee;
                            trades.push({ entry: entry, exit: exit, ret: net });
                            inTrade = false;
                            equity.push(equity[equity.length - 1] * (1 + net));
                        }
                    }
                    // Close any open trade at the last price
                    if (inTrade) {
                        exit = closes.at(-1);
                        gross = (exit - entry) / entry;
                        net = gross - fee;
                        trades.push({ entry: entry, exit: exit, ret: net });
                        equity.push(equity[equity.length - 1] * (1 + net));
                    }
                    wins = trades.filter(function (t) { return t.ret > 0; });
                    losses = trades.filter(function (t) { return t.ret <= 0; });
                    winrate = trades.length ? (wins.length / trades.length) * 100 : 0;
                    winSum = wins.reduce(function (s, t) { return s + t.ret; }, 0);
                    lossSum = losses.reduce(function (s, t) { return s + t.ret; }, 0);
                    lossAbs = Math.abs(lossSum);
                    pfVal = lossAbs === 0
                        ? winSum > 0
                            ? Infinity
                            : 0
                        : winSum / lossAbs;
                    total = (equity.at(-1) - 1) * 100;
                    maxdd = dd(equity) * 100;
                    msg = [
                        "<b>Backtest, EMA ".concat(fast, "/").concat(slow, ", ").concat(esc(tf), ", ").concat(esc(symbol), "</b>"),
                        "<code>trades</code> ".concat(trades.length),
                        "<code>winrate</code> ".concat(winrate.toFixed(1), "%"),
                        "<code>profit factor</code> ".concat(pfVal === Infinity ? "∞" : pfVal.toFixed(2)),
                        "<code>total return</code> ".concat(total.toFixed(1), "%"),
                        "<code>max DD</code> ".concat(maxdd.toFixed(1), "%"),
                        "<code>fee</code> ".concat(fee),
                        "<code>lookback</code> ".concat(lookbackHours).concat(lookUnit === "h" ? "h" : "h", " (").concat((lookbackHours / 24).toFixed(1), "d)"),
                    ].join("\n");
                    return [2 /*return*/, ctx.reply(msg, { parse_mode: "HTML" })];
                case 2:
                    err_1 = _b.sent();
                    return [2 /*return*/, ctx.reply("Backtest failed, ".concat(esc((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || String(err_1))), { parse_mode: "HTML" })];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
