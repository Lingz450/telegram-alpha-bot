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
exports.registerChart = registerChart;
var symbols_1 = require("../core/symbols");
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
var chartRenderer_1 = require("../charts/chartRenderer");
var TF = ['5m', '15m', '1h', '2h', '4h', '1d'];
var isTf = function (s) { return TF.includes(s); };
function usage(ctx) {
    return ctx.reply('Usage: `/chart BTC ltf=1h` or `chart BTC 1h`', {
        parse_mode: 'Markdown',
    });
}
function parseArgs(text, base) {
    // text is the whole message: "/chart BTC ltf=1h" or "chart BTC 1h"
    var parts = text.trim().split(/\s+/).slice(1); // drop "/chart" or "chart"
    if (parts.length < 1)
        return null;
    var raw = parts[0].replace(/^\$/, '');
    var symbol = (0, symbols_1.normSymbol)(raw, base);
    // Accept either "ltf=1h" or bare "1h"
    var tf = '1h';
    var next = parts[1];
    if (next) {
        var m = next.match(/^ltf=(.+)$/i);
        var candidate = (m ? m[1] : next).toLowerCase();
        if (isTf(candidate))
            tf = candidate;
    }
    return { symbol: symbol, tf: tf };
}
function registerChart(bot, cfg, _log) {
    var _this = this;
    // Slash command: /chart BTC ltf=1h
    bot.command('chart', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var parsed, symbol, tf, ex, k, png, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    parsed = parseArgs(ctx.message.text || '', cfg.UNIVERSE_BASE);
                    if (!parsed)
                        return [2 /*return*/, usage(ctx)];
                    symbol = parsed.symbol, tf = parsed.tf;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    ex = (0, client_1.makeExchange)(cfg);
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, symbol, tf, 300)];
                case 2:
                    k = _b.sent();
                    return [4 /*yield*/, (0, chartRenderer_1.renderChart)({
                            symbol: symbol,
                            timeframe: tf,
                            candles: k.map(function (x) { return ({ t: x.t, o: x.o, h: x.h, l: x.l, c: x.c }); }),
                        })];
                case 3:
                    png = _b.sent();
                    return [4 /*yield*/, ctx.replyWithPhoto({ source: png }, { caption: "**".concat(symbol, "** ").concat(tf, " \u2014 quick chart"), parse_mode: 'Markdown' })];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [2 /*return*/, ctx.reply('Could not render chart. Example: `/chart ETH ltf=1h`', {
                            parse_mode: 'Markdown',
                        })];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // Plain text style: chart BTC ltf=1h (keep compatibility with your earlier UX)
    bot.hears(/^chart\s+/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var text, parsed, symbol, tf, ex, k, png, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    text = ((_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) || '';
                    if (text.startsWith('/'))
                        return [2 /*return*/];
                    parsed = parseArgs(text, cfg.UNIVERSE_BASE);
                    if (!parsed)
                        return [2 /*return*/, usage(ctx)];
                    symbol = parsed.symbol, tf = parsed.tf;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, client_1.makeExchange)(cfg)];
                case 2:
                    ex = _c.sent();
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, symbol, tf, 300)];
                case 3:
                    k = _c.sent();
                    return [4 /*yield*/, (0, chartRenderer_1.renderChart)({
                            symbol: symbol,
                            timeframe: tf,
                            candles: k.map(function (x) { return ({ t: x.t, o: x.o, h: x.h, l: x.l, c: x.c }); }),
                        })];
                case 4:
                    png = _c.sent();
                    return [4 /*yield*/, ctx.replyWithPhoto({ source: png }, { caption: "**".concat(symbol, "** ").concat(tf, " \u2014 quick chart"), parse_mode: 'Markdown' })];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _a = _c.sent();
                    return [2 /*return*/, ctx.reply('Could not render chart. Example: `chart ETH ltf=1h`', {
                            parse_mode: 'Markdown',
                        })];
                case 7: return [2 /*return*/];
            }
        });
    }); });
}
