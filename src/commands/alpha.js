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
exports.registerAlpha = registerAlpha;
// src/commands/alpha.ts
var telegraf_1 = require("telegraf");
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
var ema_1 = require("../indicators/ema");
var rsi_1 = require("../indicators/rsi");
var atr_1 = require("../indicators/atr");
var levels_1 = require("../indicators/levels");
var symbols_1 = require("../core/symbols");
var TF15 = "15m";
var TF1 = "1h";
var TF4 = "4h";
var TFD = "1d";
var esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
var usd = function (n) {
    return "$" + (n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n.toPrecision(4));
};
var num = function (n) {
    return n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n.toPrecision(4);
};
var pct = function (v) { return "".concat((v >= 0 ? "+" : "")).concat((v * 100).toFixed(2), "%"); };
var fmt = function (n, d) {
    if (d === void 0) { d = 4; }
    return (Number.isFinite(n) ? n.toFixed(d) : String(n));
};
/* ---------------- vibes: concise human summary ---------------- */
function vibeSummary(base, r1h, r4h, e4_50, e4_200, px) {
    var up = e4_50 > e4_200;
    var trend = up ? "uptrend vibes" : "downtrend pressure";
    var tip = "mid range, trade levels";
    if (r4h < 40)
        tip = "oversold zone, wait for strength above 50";
    else if (r4h > 60)
        tip = "momentum on, chase small, buy dips";
    return "".concat(base, " ").concat(trend, ", 1h RSI ").concat(Math.round(r1h), ", 4h RSI ").concat(Math.round(r4h), ". ").concat(tip, ". Price ").concat(usd(px), ".");
}
/* ---------------- ATR(14) last value ---------------- */
function lastATR(c) {
    var _a;
    var series = (0, atr_1.atr)(c, 14);
    return (_a = series.at(-1)) !== null && _a !== void 0 ? _a : NaN;
}
/* ---------------- CoinGecko fundamentals, best effort ---------------- */
function geckoFundamentals(base) {
    return __awaiter(this, void 0, void 0, function () {
        var f, _a, q, s, sr, hit, r, j, m;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = globalThis.fetch;
                    if (_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("node-fetch"); }).then(function (m) { return m.default; })];
                case 1:
                    _a = (_f.sent());
                    _f.label = 2;
                case 2:
                    f = _a;
                    q = encodeURIComponent(base.toLowerCase());
                    return [4 /*yield*/, f("https://api.coingecko.com/api/v3/search?query=".concat(q)).catch(function () { return null; })];
                case 3:
                    s = _f.sent();
                    if (!s || !s.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, s.json().catch(function () { return null; })];
                case 4:
                    sr = _f.sent();
                    hit = (_b = sr === null || sr === void 0 ? void 0 : sr.coins) === null || _b === void 0 ? void 0 : _b.find(function (c) { var _a; return ((_a = c.symbol) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === base.toLowerCase(); });
                    if (!(hit === null || hit === void 0 ? void 0 : hit.id))
                        return [2 /*return*/, null];
                    return [4 /*yield*/, f("https://api.coingecko.com/api/v3/coins/".concat(hit.id, "?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false")).catch(function () { return null; })];
                case 5:
                    r = _f.sent();
                    if (!r || !r.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, r.json().catch(function () { return null; })];
                case 6:
                    j = _f.sent();
                    if (!(j === null || j === void 0 ? void 0 : j.market_data))
                        return [2 /*return*/, null];
                    m = j.market_data;
                    return [2 /*return*/, {
                            name: j.name,
                            rank: j.market_cap_rank,
                            marketCap: (_c = m.market_cap) === null || _c === void 0 ? void 0 : _c.usd,
                            volume24h: (_d = m.total_volume) === null || _d === void 0 ? void 0 : _d.usd,
                            circ: m.circulating_supply,
                            max: m.max_supply,
                            ath: (_e = m.ath) === null || _e === void 0 ? void 0 : _e.usd,
                        }];
            }
        });
    });
}
/* ---------------- exchange market resolution ---------------- */
function resolveMarket(ex_1, raw_1) {
    return __awaiter(this, arguments, void 0, function (ex, raw, quote) {
        var base, want, _i, want_1, id, found;
        var _a, _b;
        if (quote === void 0) { quote = "USDT"; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ex.loadMarkets()];
                case 1:
                    _c.sent();
                    base = raw.toUpperCase().replace(/\/USDT|USDT$/i, "");
                    want = [
                        "".concat(base, "/").concat(quote),
                        "".concat(base).concat(quote),
                        "".concat(base, "-").concat(quote),
                    ];
                    for (_i = 0, want_1 = want; _i < want_1.length; _i++) {
                        id = want_1[_i];
                        if ((_a = ex.markets) === null || _a === void 0 ? void 0 : _a[id])
                            return [2 /*return*/, ex.markets[id]];
                        if ((_b = ex.markets_by_id) === null || _b === void 0 ? void 0 : _b[id])
                            return [2 /*return*/, ex.markets_by_id[id]];
                    }
                    found = Object.values(ex.markets).find(function (m) { return m.base === base && m.quote === quote; });
                    if (found)
                        return [2 /*return*/, found];
                    throw new Error("symbol not found on ".concat(ex.id, ": ").concat(raw));
            }
        });
    });
}
/* ---------------- main analysis ---------------- */
function analyzeSymbol(cfg, raw) {
    return __awaiter(this, void 0, void 0, function () {
        var ex, unified, mkt, symbolUni, base, t, px, chgPct, need, k15, k1, k4, kd, c15, c1, c4, cd, r15, r1, r4, rd, e4_50, e4_200, atr1h, atr4h, atrd, atrPct1h, _a, supports, resistances, s1, s2, rA, rB, fund, take, lines, dd, msg;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    ex = (0, client_1.makeExchange)(cfg);
                    unified = (0, symbols_1.normSymbol)(raw.replace(/^\$/, ""), cfg.UNIVERSE_BASE);
                    return [4 /*yield*/, resolveMarket(ex, unified, cfg.UNIVERSE_BASE || "USDT")];
                case 1:
                    mkt = _l.sent();
                    symbolUni = mkt.symbol;
                    base = mkt.base;
                    return [4 /*yield*/, ex.fetchTicker(symbolUni)];
                case 2:
                    t = _l.sent();
                    px = Number((_d = (_c = (_b = t.last) !== null && _b !== void 0 ? _b : t.close) !== null && _c !== void 0 ? _c : t.bid) !== null && _d !== void 0 ? _d : t.ask);
                    chgPct = Number.isFinite(t.percentage) && t.percentage !== undefined
                        ? t.percentage / 100
                        : Number.isFinite(t.open) && t.open ? (px - t.open) / t.open : NaN;
                    need = 500;
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, symbolUni.replace("/", ""), TF15, need)];
                case 3:
                    k15 = _l.sent();
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, symbolUni.replace("/", ""), TF1, need)];
                case 4:
                    k1 = _l.sent();
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, symbolUni.replace("/", ""), TF4, need)];
                case 5:
                    k4 = _l.sent();
                    return [4 /*yield*/, (0, marketData_1.klines)(ex, symbolUni.replace("/", ""), TFD, need)];
                case 6:
                    kd = _l.sent();
                    c15 = k15.map(function (k) { return k.c; });
                    c1 = k1.map(function (k) { return k.c; });
                    c4 = k4.map(function (k) { return k.c; });
                    cd = kd.map(function (k) { return k.c; });
                    r15 = (_e = (0, rsi_1.rsi)(c15, 14).at(-1)) !== null && _e !== void 0 ? _e : NaN;
                    r1 = (_f = (0, rsi_1.rsi)(c1, 14).at(-1)) !== null && _f !== void 0 ? _f : NaN;
                    r4 = (_g = (0, rsi_1.rsi)(c4, 14).at(-1)) !== null && _g !== void 0 ? _g : NaN;
                    rd = (_h = (0, rsi_1.rsi)(cd, 14).at(-1)) !== null && _h !== void 0 ? _h : NaN;
                    e4_50 = (_j = (0, ema_1.ema)(c4, 50).at(-1)) !== null && _j !== void 0 ? _j : NaN;
                    e4_200 = (_k = (0, ema_1.ema)(c4, 200).at(-1)) !== null && _k !== void 0 ? _k : NaN;
                    atr1h = lastATR(k1);
                    atr4h = lastATR(k4);
                    atrd = lastATR(kd);
                    atrPct1h = atr1h && px ? atr1h / px : NaN;
                    _a = (0, levels_1.findKeyLevels)(k1.slice(-200), 3, 3), supports = _a.supports, resistances = _a.resistances;
                    s1 = supports[0], s2 = supports[1];
                    rA = resistances[0], rB = resistances[1];
                    return [4 /*yield*/, geckoFundamentals(base).catch(function () { return null; })];
                case 7:
                    fund = _l.sent();
                    take = vibeSummary(base, r1, r4, e4_50, e4_200, px);
                    lines = [];
                    lines.push("<b>".concat(esc(base), " \u2014 Alpha snapshot</b>"));
                    lines.push("<code>price</code> ".concat(usd(px), "   <code>24h</code> ").concat(Number.isFinite(chgPct) ? pct(chgPct) : "n/a"));
                    if (fund) {
                        if (fund.rank != null)
                            lines.push("<code>rank</code> #".concat(fund.rank));
                        if (fund.marketCap != null || fund.volume24h != null) {
                            lines.push("<code>mcap</code> ".concat(fund.marketCap != null ? usd(fund.marketCap) : "n/a", "   <code>vol</code> ").concat(fund.volume24h != null ? usd(fund.volume24h) : "n/a"));
                        }
                        if (fund.circ != null) {
                            lines.push("<code>circulating</code> ".concat(num(fund.circ), "   <code>max</code> ").concat(fund.max != null ? num(fund.max) : "∞"));
                        }
                        if (fund.ath != null) {
                            dd = (px - fund.ath) / fund.ath;
                            lines.push("<code>ATH</code> ".concat(usd(fund.ath), "   <code>from ATH</code> ").concat(pct(dd)));
                        }
                    }
                    lines.push("\n<b>Momentum</b>");
                    lines.push("<code>RSI</code> 15m ".concat(Math.round(r15), " | 1h ").concat(Math.round(r1), " | 4h ").concat(Math.round(r4), " | 1d ").concat(Math.round(rd)));
                    lines.push("<code>EMA</code> 4h 50=".concat(num(e4_50), " 200=").concat(num(e4_200), " ").concat(e4_50 > e4_200 ? "↑ trend" : "↓ trend"));
                    lines.push("<code>ATR</code> 1h ~ ".concat(num(atr1h), " (").concat(Number.isFinite(atrPct1h) ? pct(atrPct1h) : "n/a", ") | 4h ~ ").concat(num(atr4h), " | 1d ~ ").concat(num(atrd)));
                    if (s1 || rA) {
                        lines.push("\n<b>Levels</b>");
                        if (rA)
                            lines.push("<code>res</code> ".concat(num(rA)).concat(rB ? " / " + num(rB) : ""));
                        if (s1)
                            lines.push("<code>sup</code> ".concat(num(s1)).concat(s2 ? " / " + num(s2) : ""));
                    }
                    lines.push("\n<i>".concat(esc(take), "</i>"));
                    lines.push("\n<code>note</code> not financial advice, manage risk");
                    msg = lines.join("\n");
                    return [2 /*return*/, {
                            text: msg,
                            base: base,
                            symbolDisplay: symbolUni,
                        }];
            }
        });
    });
}
/* ---------------- handlers ---------------- */
function registerAlpha(bot, cfg, log) {
    var _this = this;
    var kb = function () {
        return telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback("Chart", "alpha_help_chart"), telegraf_1.Markup.button.callback("Heatmap", "alpha_help_heatmap")],
            [telegraf_1.Markup.button.callback("RSI", "alpha_help_rsi"), telegraf_1.Markup.button.callback("Set Alert", "alpha_help_alert")],
            [telegraf_1.Markup.button.callback("Disclaimer", "alpha_disclaimer")],
        ]);
    };
    // /alpha btc
    bot.command("alpha", function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var parts, arg, out, e_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    parts = (((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) || "").trim().split(/\s+/);
                    arg = parts[1];
                    if (!arg) {
                        return [2 /*return*/, ctx.reply("Usage: <code>/alpha btc</code> or send <code>$btc</code>", { parse_mode: "HTML" })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, analyzeSymbol(cfg, arg)];
                case 2:
                    out = _c.sent();
                    return [4 /*yield*/, ctx.reply(out.text, { parse_mode: "HTML", reply_markup: kb().reply_markup })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _c.sent();
                    (_b = log === null || log === void 0 ? void 0 : log.warn) === null || _b === void 0 ? void 0 : _b.call(log, { err: e_1 === null || e_1 === void 0 ? void 0 : e_1.message }, "alpha command failed");
                    return [2 /*return*/, ctx.reply("Couldn’t analyze that symbol. Try <code>$btc</code> or <code>/alpha eth</code>", { parse_mode: "HTML" })];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Quick trigger: "$btc" or "btc" on its own line
    bot.hears(/^\$?([a-z0-9\-]{2,15})$/i, function (ctx, next) { return __awaiter(_this, void 0, void 0, function () {
        var text, sym, out, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    text = (((_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) || "").trim();
                    if (text.startsWith("/"))
                        return [2 /*return*/, next()]; // let real commands through
                    sym = text.replace(/^\$/, "");
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, analyzeSymbol(cfg, sym)];
                case 2:
                    out = _c.sent();
                    return [4 /*yield*/, ctx.reply(out.text, { parse_mode: "HTML", reply_markup: kb().reply_markup })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = _c.sent();
                    return [2 /*return*/, next()];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Inline helpers that teach users the other commands without spamming
    bot.action("alpha_help_chart", function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, ctx.answerCbQuery("Chart, try:  chart BTC 4h  or  chart ETH 1h extended")];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    bot.action("alpha_help_heatmap", function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, ctx.answerCbQuery("Heatmap, try:  heatmap BTC extended  or  heatmap SOL")];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    bot.action("alpha_help_rsi", function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, ctx.answerCbQuery("RSI, try:  rsi timeframe:4h type:overbought  or  rsi timeframe:1h type:oversold")];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    bot.action("alpha_help_alert", function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, ctx.answerCbQuery("Set alert, try:  alert symbol:SOL price:199")];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Disclaimer popup
    bot.action("alpha_disclaimer", function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, ctx.answerCbQuery("Educational commentary, not financial advice. Manage risk and size positions.", { show_alert: true })];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
