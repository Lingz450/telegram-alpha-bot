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
exports.registerATRBreak = registerATRBreak;
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
var atr_1 = require("../indicators/atr");
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function registerATRBreak(bot, cfg, _log) {
    var _this = this;
    // atrbreak 1h top [k=1.5]
    bot.hears(/^atrbreak\s+(5m|15m|1h|2h|4h|1d)\s+(top|bottom)(?:\s+k=(\d+(\.\d+)?))?$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a, tf, side, kStr, k, ex, universe, rows, _i, universe_1, sym, ks, highs, lows, closes, a, lastAtr, last, rng, ratio, _b, sorted, filt, top, lines, msg;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = ctx.match, tf = _a[1], side = _a[2], kStr = _a[3];
                    k = kStr ? Number(kStr) : 1.5;
                    ex = (0, client_1.makeExchange)(cfg);
                    return [4 /*yield*/, (0, client_1.getTop100Symbols)(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT)];
                case 1:
                    universe = _c.sent();
                    rows = [];
                    _i = 0, universe_1 = universe;
                    _c.label = 2;
                case 2:
                    if (!(_i < universe_1.length)) return [3 /*break*/, 7];
                    sym = universe_1[_i];
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, sym, tf, 220)];
                case 4:
                    ks = _c.sent();
                    if (ks.length < 50)
                        return [3 /*break*/, 6];
                    highs = ks.map(function (c) { return c.h; }), lows = ks.map(function (c) { return c.l; }), closes = ks.map(function (c) { return c.c; });
                    a = (0, atr_1.atr)(highs, lows, closes, 14);
                    lastAtr = a.at(-1);
                    last = ks.at(-1);
                    rng = last.h - last.l;
                    if (!Number.isFinite(lastAtr) || lastAtr <= 0)
                        return [3 /*break*/, 6];
                    ratio = rng / lastAtr;
                    rows.push({ symbol: sym, ratio: ratio, range: rng });
                    return [3 /*break*/, 6];
                case 5:
                    _b = _c.sent();
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    sorted = side === 'top'
                        ? rows.sort(function (a, b) { return b.ratio - a.ratio; })
                        : rows.sort(function (a, b) { return a.ratio - b.ratio; });
                    filt = side === 'top' ? sorted.filter(function (r) { return r.ratio >= k; }) : sorted;
                    top = (filt.length ? filt : sorted).slice(0, 10);
                    if (!top.length)
                        return [2 /*return*/, ctx.reply('No ATR signals right now.')];
                    lines = top.map(function (r) { return "- ".concat(r.symbol, "  ratio=<code>").concat(r.ratio.toFixed(2), "</code>  range=<code>").concat(r.range.toFixed(6), "</code>"); });
                    msg = "<b>ATR breakout \u2014 ".concat(esc(tf), "</b> (").concat(esc(side), "; k=").concat(k, ")\n") + lines.join('\n');
                    return [2 /*return*/, ctx.reply(msg, { parse_mode: 'HTML' })];
            }
        });
    }); });
}
