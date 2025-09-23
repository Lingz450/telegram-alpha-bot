"use strict";
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
exports.registerAlerts = registerAlerts;
var prisma_1 = require("../db/prisma");
var symbols_1 = require("../core/symbols");
var permissions_1 = require("../core/permissions");
/* ───────────────── helpers ───────────────── */
function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/** Parse prices like: 65k, 1.25m, 0.0000321, 64,200 */
function parseHumanPrice(input) {
    var raw = input.trim().toLowerCase().replace(/[, ]/g, '');
    var m = raw.match(/^(\d+(\.\d+)?)([kmb])?$/i);
    if (!m)
        return null;
    var n = parseFloat(m[1]);
    if (!isFinite(n) || n <= 0)
        return null;
    var mul = (m[3] || '').toLowerCase() === 'k' ? 1e3
        : (m[3] || '').toLowerCase() === 'm' ? 1e6
            : (m[3] || '').toLowerCase() === 'b' ? 1e9
                : 1;
    return n * mul;
}
function replyUsage(ctx) {
    return ctx.reply([
        '<b>Alerts</b>',
        '• <code>alert BTC 65000</code>  — price hits',
        '• <code>$btc 65k</code>        — quick style',
        '• <code>alert cross ema 200 BTC 1h</code>  — candle close crosses EMA',
        '• <code>alert rsi 1h overbought BTC th=72</code>  — RSI threshold',
        '',
        '<i>Extras:</i> <code>alertlist</code>, <code>alertreset</code> (admin)',
    ].join('\n'), { parse_mode: 'HTML' });
}
/* ───────────────── handlers ───────────────── */
function registerAlerts(bot, cfg, _log) {
    var _this = this;
    // ── PRICE ALERTS ────────────────────────────────────────────────────────────
    // /alert <symbol> <price>
    bot.command('alert', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var args, symRaw, priceRaw, symbol, priceNum;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    args = (ctx.message.text || '').split(/\s+/).slice(1);
                    if (args.length < 2)
                        return [2 /*return*/, replyUsage(ctx)];
                    symRaw = args[0], priceRaw = args[1];
                    symbol = (0, symbols_1.normSymbol)(symRaw.replace(/^\$/, ''), cfg.UNIVERSE_BASE);
                    priceNum = parseHumanPrice(priceRaw);
                    if (!priceNum) {
                        return [2 /*return*/, ctx.reply('Invalid price. Example: <code>alert BTC 65000</code>', { parse_mode: 'HTML' })];
                    }
                    return [4 /*yield*/, prisma_1.prisma.alert.create({
                            data: {
                                chatId: String((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id),
                                userId: String((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id),
                                symbol: symbol,
                                kind: 'price',
                                triggerPrice: String(priceNum),
                                direction: 'either',
                            },
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, ctx.reply("\u2705 Price alert set on <b>".concat(esc(symbol), "</b> at <code>").concat(priceNum, "</code>"), { parse_mode: 'HTML' })];
            }
        });
    }); });
    // Quick message style: "$btc 100000" or "btc 65k"
    bot.hears(/^\$?([A-Za-z0-9\-\/]{2,15})\s+([\d\.,]+[kKmMbB]?)$/i, function (ctx, next) { return __awaiter(_this, void 0, void 0, function () {
        var text, m, symRaw, priceRaw, symbol, priceNum;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    text = ((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) || '';
                    if (text.startsWith('/'))
                        return [2 /*return*/, next()]; // let /commands pass
                    m = text.match(/^\$?([A-Za-z0-9\-\/]{2,15})\s+([\d\.,]+[kKmMbB]?)$/i);
                    if (!m)
                        return [2 /*return*/, next()];
                    symRaw = m[1], priceRaw = m[2];
                    symbol = (0, symbols_1.normSymbol)(symRaw.replace(/^\$/, ''), cfg.UNIVERSE_BASE);
                    priceNum = parseHumanPrice(priceRaw);
                    if (!priceNum)
                        return [2 /*return*/, next()];
                    return [4 /*yield*/, prisma_1.prisma.alert.create({
                            data: {
                                chatId: String((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id),
                                userId: String((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.id),
                                symbol: symbol,
                                kind: 'price',
                                triggerPrice: String(priceNum),
                                direction: 'either',
                            },
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/, ctx.reply("\u2705 Price alert set on <b>".concat(esc(symbol), "</b> at <code>").concat(priceNum, "</code>"), { parse_mode: 'HTML' })];
            }
        });
    }); });
    // ── EMA CROSS ALERTS ────────────────────────────────────────────────────────
    // alert cross ema <period> <symbol> <tf>
    bot.hears(/^alert\s+cross\s+ema\s+(\d{1,3})\s+([A-Za-z0-9\-\/]+)\s+(5m|15m|1h|2h|4h|1d)$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a, periodStr, symRaw, tf, period, symbol;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = ctx.match, periodStr = _a[1], symRaw = _a[2], tf = _a[3];
                    period = Number(periodStr);
                    symbol = (0, symbols_1.normSymbol)(symRaw, cfg.UNIVERSE_BASE);
                    return [4 /*yield*/, prisma_1.prisma.alert.create({
                            data: {
                                chatId: String((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id),
                                userId: String((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.id),
                                symbol: symbol,
                                kind: 'ema_cross',
                                period: period,
                                timeframe: tf,
                                direction: 'either',
                            },
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/, ctx.reply("\u2705 EMA cross alert set: <b>".concat(esc(symbol), "</b> EMA<code>").concat(period, "</code> on <code>").concat(tf, "</code>"), { parse_mode: 'HTML' })];
            }
        });
    }); });
    // ── RSI THRESHOLD ALERTS ────────────────────────────────────────────────────
    // alert rsi <tf> <overbought|oversold> <symbol> [th=NN]
    bot.hears(/^alert\s+rsi\s+(5m|15m|1h|2h|4h|1d)\s+(overbought|oversold)\s+([A-Za-z0-9\-\/]+)(?:\s+th=(\d{2}))?$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a, tf, kind, symRaw, thRaw, symbol, th;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = ctx.match, tf = _a[1], kind = _a[2], symRaw = _a[3], thRaw = _a[4];
                    symbol = (0, symbols_1.normSymbol)(symRaw, cfg.UNIVERSE_BASE);
                    th = thRaw ? Number(thRaw) : (kind === 'overbought' ? 70 : 30);
                    return [4 /*yield*/, prisma_1.prisma.alert.create({
                            data: {
                                chatId: String((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id),
                                userId: String((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.id),
                                symbol: symbol,
                                kind: 'rsi_threshold',
                                period: 14,
                                timeframe: tf,
                                direction: kind, // 'overbought' | 'oversold'
                                threshold: th,
                            },
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/, ctx.reply("\u2705 RSI alert set: <b>".concat(esc(symbol), "</b> <code>").concat(tf, "</code> ").concat(kind, " @ <code>").concat(th, "</code>"), { parse_mode: 'HTML' })];
            }
        });
    }); });
    // ── LIST ────────────────────────────────────────────────────────────────────
    var listHandler = function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var chatId, alerts, lines;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    chatId = String((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id);
                    return [4 /*yield*/, prisma_1.prisma.alert.findMany({
                            where: { chatId: chatId, active: true },
                            orderBy: { createdAt: 'desc' },
                        })];
                case 1:
                    alerts = _b.sent();
                    if (!alerts.length)
                        return [2 /*return*/, ctx.reply('No active alerts.')];
                    lines = alerts.map(function (a) {
                        var _a;
                        if (a.kind === 'price') {
                            return "\u2022 ".concat(esc(a.symbol), " @ <code>").concat(esc((_a = a.triggerPrice) !== null && _a !== void 0 ? _a : ''), "</code>");
                        }
                        if (a.kind === 'ema_cross') {
                            return "\u2022 ".concat(esc(a.symbol), " \u2014 EMA<code>").concat(a.period, "</code> <code>").concat(a.timeframe, "</code>");
                        }
                        if (a.kind === 'rsi_threshold') {
                            return "\u2022 ".concat(esc(a.symbol), " \u2014 RSI<code>").concat(a.period, "</code> <code>").concat(a.timeframe, "</code> ").concat(esc(a.direction), " <code>").concat(a.threshold, "</code>");
                        }
                        return "\u2022 ".concat(esc(a.symbol), " (").concat(esc(a.kind), ")");
                    });
                    return [2 /*return*/, ctx.reply("<b>Active alerts</b>\n".concat(lines.join('\n')), { parse_mode: 'HTML' })];
            }
        });
    }); };
    bot.command('alertlist', listHandler);
    bot.hears(/^alertlist$/i, listHandler);
    // ── RESET (admin) ──────────────────────────────────────────────────────────
    // /alertreset
    // /alertreset BTC
    // /alertreset BTC 65000
    var resetHandler = function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var parts, chatId, symbol, price;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(0, permissions_1.isAdmin)(ctx, cfg))
                        return [2 /*return*/, ctx.reply('Admin only.')];
                    parts = (ctx.message.text || '').split(/\s+/).slice(1);
                    chatId = String((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id);
                    if (!(parts.length === 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, prisma_1.prisma.alert.updateMany({ where: { chatId: chatId, active: true }, data: { active: false } })];
                case 1:
                    _b.sent();
                    return [2 /*return*/, ctx.reply('🔁 Cleared all alerts.')];
                case 2:
                    symbol = (0, symbols_1.normSymbol)(parts[0], cfg.UNIVERSE_BASE);
                    price = parts[1] ? parseHumanPrice(parts[1]) : null;
                    return [4 /*yield*/, prisma_1.prisma.alert.updateMany({
                            where: __assign({ chatId: chatId, symbol: symbol, active: true }, (price ? { triggerPrice: String(price) } : {})),
                            data: { active: false },
                        })];
                case 3:
                    _b.sent();
                    return [2 /*return*/, ctx.reply(price
                            ? "Cleared alert ".concat(symbol, " @ ").concat(price)
                            : "Cleared alerts for ".concat(symbol))];
            }
        });
    }); };
    bot.command('alertreset', resetHandler);
    bot.hears(/^alertreset(?:\s+.+)?$/i, resetHandler);
    // Fallback help if someone types just "alert"
    bot.hears(/^alert$/i, replyUsage);
}
