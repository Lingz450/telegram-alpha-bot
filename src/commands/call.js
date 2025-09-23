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
exports.registerCall = registerCall;
var prisma_1 = require("../db/prisma");
var permissions_1 = require("../core/permissions");
function usage(ctx) {
    return ctx.reply('Usage: `/call BTCUSDT entry=64200 sl=63450 lev=5x tp=64800,65500`\n' +
        'Notes: params can be in any order, `lev=5` or `lev=5x` both work.', { parse_mode: 'Markdown' });
}
function toNum(s) {
    if (!s)
        return null;
    var cleaned = s.replace(/[, ]/g, '');
    var n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}
function parseCallText(text) {
    var _a, _b;
    // Accept either:
    // /call BTCUSDT entry=... sl=... lev=... tp=...
    // call BTCUSDT sl=... entry=... tp=... lev=...
    var parts = text.trim().split(/\s+/).slice(1);
    if (!parts.length)
        return null;
    // First non k=v token is the symbol
    var symbol = '';
    var kv = {};
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var p = parts_1[_i];
        if (/^[a-z0-9\-\/]+$/i.test(p) && !p.includes('=')) {
            if (!symbol)
                symbol = p.toUpperCase().replace('/', '');
            continue;
        }
        var _c = p.split('='), k = _c[0], v = _c[1];
        if (k && v)
            kv[k.toLowerCase()] = v;
    }
    if (!symbol)
        return null;
    var entry = toNum(kv['entry']);
    var sl = toNum(kv['sl']);
    var levStr = (kv['lev'] || '').toLowerCase().replace(/x$/, '');
    var lev = Number(levStr || '1');
    var tpRaw = (_b = (_a = kv['tp']) !== null && _a !== void 0 ? _a : kv['tps']) !== null && _b !== void 0 ? _b : '';
    var tps = tpRaw
        .split(',')
        .map(function (x) { return toNum((x === null || x === void 0 ? void 0 : x.trim()) || ''); })
        .filter(function (x) { return typeof x === 'number' && Number.isFinite(x); });
    if (!entry || !sl || !tps.length || !Number.isFinite(lev) || lev <= 0)
        return null;
    return { symbol: symbol, entry: entry, sl: sl, lev: Math.floor(lev), tps: tps };
}
function inferSide(entry, tp1) {
    return tp1 >= entry ? 'long' : 'short';
}
function calcMetrics(entry, sl, tp, side, lev) {
    var riskPct = side === 'long' ? (entry - sl) / entry : (sl - entry) / entry;
    var movePct = side === 'long' ? (tp - entry) / entry : (entry - tp) / entry;
    var rMultiple = riskPct > 0 ? movePct / riskPct : NaN;
    var roePct = movePct * lev * 100;
    return { movePct: movePct, rMultiple: rMultiple, roePct: roePct, riskPct: riskPct };
}
function fmtPct(p) {
    return "".concat((p * 100).toFixed(2), "%");
}
function registerCall(bot, cfg, _log) {
    var _this = this;
    // Slash command: /call ...
    bot.command('call', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var parsed, symbol, entry, sl, lev, tps, side, rrLines, card;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(0, permissions_1.isAdmin)(ctx, cfg))
                        return [2 /*return*/, ctx.reply('Admin only.')];
                    parsed = parseCallText(ctx.message.text || '');
                    if (!parsed)
                        return [2 /*return*/, usage(ctx)];
                    symbol = parsed.symbol, entry = parsed.entry, sl = parsed.sl, lev = parsed.lev, tps = parsed.tps;
                    side = inferSide(entry, tps[0]);
                    // Persist (store decimals as strings for Prisma Decimal safety)
                    return [4 /*yield*/, prisma_1.prisma.tradeCall.create({
                            data: {
                                chatId: String((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id),
                                userId: String((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id),
                                symbol: symbol,
                                entry: String(entry),
                                sl: String(sl),
                                leverage: lev,
                                tps: tps.join(','),
                            },
                        })];
                case 1:
                    // Persist (store decimals as strings for Prisma Decimal safety)
                    _c.sent();
                    rrLines = tps.map(function (tp, i) {
                        var _a = calcMetrics(entry, sl, tp, side, lev), movePct = _a.movePct, rMultiple = _a.rMultiple, roePct = _a.roePct;
                        return "TP".concat(i + 1, "  `").concat(tp, "`  \u0394=`").concat(fmtPct(movePct), "`  R=`").concat(isFinite(rMultiple) ? rMultiple.toFixed(2) : '—', "`  ROE\u2248`").concat(roePct.toFixed(1), "%`");
                    });
                    card = "*TRADE CALL* \u2014 *".concat(symbol, "* (").concat(side.toUpperCase(), ")\n`Entry`  ").concat(entry, "\n`SL`     ").concat(sl, "\n`Lev`    ").concat(lev, "x\n\n*Targets*\n").concat(rrLines.map(function (l) { return "- ".concat(l); }).join('\n'), "\n\n_Disclaimer: Not financial advice. Manage size. Use stops._");
                    return [2 /*return*/, ctx.reply(card, { parse_mode: 'Markdown' })];
            }
        });
    }); });
    // Plain text style: call ...
    bot.hears(/^call\s+/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var parsed, symbol, entry, sl, lev, tps, side, rrLines, card;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if ((_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.startsWith('/'))
                        return [2 /*return*/]; // handled by /call
                    if (!(0, permissions_1.isAdmin)(ctx, cfg))
                        return [2 /*return*/, ctx.reply('Admin only.')];
                    parsed = parseCallText(ctx.message.text || '');
                    if (!parsed)
                        return [2 /*return*/, usage(ctx)];
                    symbol = parsed.symbol, entry = parsed.entry, sl = parsed.sl, lev = parsed.lev, tps = parsed.tps;
                    side = inferSide(entry, tps[0]);
                    return [4 /*yield*/, prisma_1.prisma.tradeCall.create({
                            data: {
                                chatId: String((_c = ctx.chat) === null || _c === void 0 ? void 0 : _c.id),
                                userId: String((_d = ctx.from) === null || _d === void 0 ? void 0 : _d.id),
                                symbol: symbol,
                                entry: String(entry),
                                sl: String(sl),
                                leverage: lev,
                                tps: tps.join(','),
                            },
                        })];
                case 1:
                    _e.sent();
                    rrLines = tps.map(function (tp, i) {
                        var _a = calcMetrics(entry, sl, tp, side, lev), movePct = _a.movePct, rMultiple = _a.rMultiple, roePct = _a.roePct;
                        return "TP".concat(i + 1, "  `").concat(tp, "`  \u0394=`").concat(fmtPct(movePct), "`  R=`").concat(isFinite(rMultiple) ? rMultiple.toFixed(2) : '—', "`  ROE\u2248`").concat(roePct.toFixed(1), "%`");
                    });
                    card = "*TRADE CALL* \u2014 *".concat(symbol, "* (").concat(side.toUpperCase(), ")\n`Entry`  ").concat(entry, "\n`SL`     ").concat(sl, "\n`Lev`    ").concat(lev, "x\n\n*Targets*\n").concat(rrLines.map(function (l) { return "- ".concat(l); }).join('\n'), "\n\n_Disclaimer: Not financial advice. Manage size. Use stops._");
                    return [2 /*return*/, ctx.reply(card, { parse_mode: 'Markdown' })];
            }
        });
    }); });
}
