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
exports.registerRSI = registerRSI;
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
var rsi_1 = require("../indicators/rsi");
var TF = new Set(['5m', '15m', '1h', '2h', '4h', '1d']);
var KIND = new Set(['overbought', 'oversold']);
function usage(ctx) {
    return ctx.reply('Usage: `/rsi 1h overbought`', { parse_mode: 'Markdown' });
}
function scanOne(ex, sym, tf) {
    return __awaiter(this, void 0, void 0, function () {
        var k, closes, series, val;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, marketData_1.klines)(ex, sym, tf, 210)];
                case 1:
                    k = _a.sent();
                    closes = k.map(function (x) { return x.c; });
                    if (closes.length < 20)
                        return [2 /*return*/, null]; // needs enough candles for RSI(14)
                    series = (0, rsi_1.rsi)(closes, 14);
                    val = series.at(-1);
                    if (!val || !Number.isFinite(val))
                        return [2 /*return*/, null];
                    return [2 /*return*/, { symbol: sym, rsi: val }];
            }
        });
    });
}
function runScan(cfg, tf, kind) {
    return __awaiter(this, void 0, void 0, function () {
        var ex, universe, jobs, settled, rows, sorted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, client_1.makeExchange)(cfg)];
                case 1:
                    ex = _a.sent();
                    return [4 /*yield*/, (0, client_1.getTop100Symbols)(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT)];
                case 2:
                    universe = _a.sent();
                    jobs = universe.map(function (sym) { return scanOne(ex, sym, tf); });
                    return [4 /*yield*/, Promise.allSettled(jobs)];
                case 3:
                    settled = _a.sent();
                    rows = settled
                        .map(function (s) { return (s.status === 'fulfilled' ? s.value : null); })
                        .filter(Boolean);
                    sorted = kind === 'overbought'
                        ? rows.sort(function (a, b) { return b.rsi - a.rsi; })
                        : rows.sort(function (a, b) { return a.rsi - b.rsi; });
                    return [2 /*return*/, sorted.slice(0, 10)];
            }
        });
    });
}
function render(tf, kind, rows) {
    var lines = rows.map(function (r) { return "- ".concat(r.symbol, "  RSI=`").concat(r.rsi.toFixed(2), "`"); });
    return "*RSI ".concat(tf, " ").concat(kind, "*\n").concat(lines.join('\n'));
}
function registerRSI(bot, cfg, _log) {
    var _this = this;
    // Slash style: /rsi 1h overbought
    bot.command('rsi', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a, tfRaw, kindRaw, tf, kind, top_1, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _a = (ctx.message.text || '').split(/\s+/).slice(1), tfRaw = _a[0], kindRaw = _a[1];
                    tf = (tfRaw || '').toLowerCase();
                    kind = (kindRaw || '').toLowerCase();
                    if (!TF.has(tf) || !KIND.has(kind))
                        return [2 /*return*/, usage(ctx)];
                    return [4 /*yield*/, runScan(cfg, tf, kind)];
                case 1:
                    top_1 = _c.sent();
                    if (!top_1.length)
                        return [2 /*return*/, ctx.reply('No results. Try a different timeframe.')];
                    return [2 /*return*/, ctx.reply(render(tf, kind, top_1), { parse_mode: 'Markdown' })];
                case 2:
                    _b = _c.sent();
                    return [2 /*return*/, ctx.reply('RSI scan failed. Try again shortly.')];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Plain text style: rsi 1h overbought
    bot.hears(/^rsi\s+(5m|15m|1h|2h|4h|1d)\s+(overbought|oversold)$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a, tf, kind, top_2, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _a = ctx.match, tf = _a[1], kind = _a[2];
                    return [4 /*yield*/, runScan(cfg, tf.toLowerCase(), kind.toLowerCase())];
                case 1:
                    top_2 = _c.sent();
                    if (!top_2.length)
                        return [2 /*return*/, ctx.reply('No results. Try a different timeframe.')];
                    return [2 /*return*/, ctx.reply(render(tf, kind.toLowerCase(), top_2), { parse_mode: 'Markdown' })];
                case 2:
                    _b = _c.sent();
                    return [2 /*return*/, ctx.reply('RSI scan failed. Try again shortly.')];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
