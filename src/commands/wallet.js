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
exports.registerWallet = registerWallet;
var prisma_1 = require("../db/prisma");
var symbols_1 = require("../core/symbols");
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
function usage(ctx) {
    return ctx.reply('Usage: `/wallet [PAIR] [channelId]`\n' +
        'Examples:\n' +
        '- `/wallet` (this chat, all pairs)\n' +
        '- `/wallet BTCUSDT` (this chat, only BTCUSDT)\n' +
        '- `/wallet ETHUSDT -1001234567890` (another channelId)', { parse_mode: 'Markdown' });
}
function toNum(x, fallback) {
    if (fallback === void 0) { fallback = 0; }
    var n = Number(x);
    return Number.isFinite(n) ? n : fallback;
}
function fmt(n, d) {
    if (d === void 0) { d = 2; }
    return '`' + (Number.isFinite(n) ? n.toFixed(d) : String(n)) + '`';
}
function inferUnrealized(entry, mark, qty, side) {
    var pnl = side === 'long' ? (mark - entry) * qty : (entry - mark) * qty;
    var notional = entry * qty;
    var roe = notional > 0 ? (pnl / notional) * 100 : 0;
    return { pnl: pnl, roe: roe, notional: notional };
}
function getMarks(cfg, symbols) {
    return __awaiter(this, void 0, void 0, function () {
        var ex, out, _i, symbols_2, sym, t, last, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ex = (0, client_1.makeExchange)(cfg);
                    out = new Map();
                    _i = 0, symbols_2 = symbols;
                    _b.label = 1;
                case 1:
                    if (!(_i < symbols_2.length)) return [3 /*break*/, 6];
                    sym = symbols_2[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, marketData_1.ticker)(ex, sym)];
                case 3:
                    t = _b.sent();
                    last = Number(t.last);
                    if (Number.isFinite(last) && last > 0)
                        out.set(sym, last);
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, out];
            }
        });
    });
}
function handleWallet(ctx, cfg) {
    return __awaiter(this, void 0, void 0, function () {
        var parts, maybeSym, maybeChat, chatId, symbol, positions, needMarkSymbols, fetchedMarks, _a, unrealized, notionalSum, lines, _i, positions_1, p, side, qty, entry, mark, _b, pnl, roe, notional, totalROE, head, body, tail;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    parts = (ctx.message.text || '').trim().split(/\s+/).slice(1);
                    maybeSym = parts[0] && !/^-?\d+$/.test(parts[0]) ? parts[0] : undefined;
                    maybeChat = parts.find(function (p) { return /^-?\d+$/.test(p); });
                    chatId = String(maybeChat !== null && maybeChat !== void 0 ? maybeChat : (_c = ctx.chat) === null || _c === void 0 ? void 0 : _c.id);
                    symbol = maybeSym ? (0, symbols_1.normSymbol)(maybeSym.replace(/^\$/, ''), cfg.UNIVERSE_BASE) : undefined;
                    return [4 /*yield*/, prisma_1.prisma.walletPosition.findMany({
                            where: __assign({ chatId: chatId }, (symbol ? { symbol: symbol } : {})),
                            orderBy: { updatedAt: 'desc' },
                            take: 200,
                        })];
                case 1:
                    positions = _e.sent();
                    if (!positions.length) {
                        return [2 /*return*/, ctx.reply('No active bot positions tracked for this chat.')];
                    }
                    needMarkSymbols = Array.from(new Set(positions
                        .filter(function (p) { return !Number.isFinite(toNum(p.mark)); })
                        .map(function (p) { return p.symbol; })));
                    if (!needMarkSymbols.length) return [3 /*break*/, 3];
                    return [4 /*yield*/, getMarks(cfg, needMarkSymbols)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = new Map();
                    _e.label = 4;
                case 4:
                    fetchedMarks = _a;
                    unrealized = 0;
                    notionalSum = 0;
                    lines = [];
                    for (_i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
                        p = positions_1[_i];
                        side = String(p.side || 'long').toLowerCase();
                        qty = toNum(p.qty);
                        entry = toNum(p.entry);
                        mark = Number.isFinite(toNum(p.mark)) && toNum(p.mark) > 0
                            ? toNum(p.mark)
                            : (_d = fetchedMarks.get(p.symbol)) !== null && _d !== void 0 ? _d : entry;
                        _b = inferUnrealized(entry, mark, qty, side), pnl = _b.pnl, roe = _b.roe, notional = _b.notional;
                        unrealized += pnl;
                        notionalSum += notional;
                        if (lines.length < 20) {
                            lines.push("- ".concat(p.symbol, " ").concat(side.toUpperCase(), " qty=").concat(fmt(qty, 6), " entry=").concat(fmt(entry), " mark=").concat(fmt(mark), " uPnL=").concat(fmt(pnl), " ROE=").concat(fmt(roe, 1), "%"));
                        }
                        // Optionally persist latest mark (best-effort; ignore errors)
                        if (!Number.isFinite(toNum(p.mark)) && Number.isFinite(mark)) {
                            prisma_1.prisma.walletPosition
                                .update({ where: { id: p.id }, data: { mark: String(mark) } })
                                .catch(function () { });
                        }
                    }
                    totalROE = notionalSum > 0 ? (unrealized / notionalSum) * 100 : 0;
                    head = "*Wallet \u2014 ".concat(symbol !== null && symbol !== void 0 ? symbol : 'ALL', " \u2014 chat ").concat(chatId, "*");
                    body = lines.join('\n');
                    tail = "\n*Totals*  Notional\u2248 ".concat(fmt(notionalSum), "  uPnL\u2248 ").concat(fmt(unrealized), "  ROE\u2248 `").concat(totalROE.toFixed(1), "%`");
                    return [2 /*return*/, ctx.reply([head, body, tail].join('\n\n'), { parse_mode: 'Markdown' })];
            }
        });
    });
}
function registerWallet(bot, cfg, _log) {
    var _this = this;
    // Slash: /wallet [PAIR] [channelId]
    bot.command('wallet', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var text, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    text = ((_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) || '';
                    if (!text)
                        return [2 /*return*/, usage(ctx)];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, handleWallet(ctx, cfg)];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _c.sent();
                    return [2 /*return*/, ctx.reply('Wallet query failed.')];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Plain text: wallet [PAIR] [channelId]
    bot.hears(/^wallet(?:\s+.+)?$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var text, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    text = ((_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) || '';
                    if (text.startsWith('/'))
                        return [2 /*return*/]; // handled above
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, handleWallet(ctx, cfg)];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _c.sent();
                    return [2 /*return*/, ctx.reply('Wallet query failed.')];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}
