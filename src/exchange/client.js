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
exports.makeExchange = makeExchange;
exports.computeTop100 = computeTop100;
exports.getTop100Symbols = getTop100Symbols;
// src/exchange/client.ts
var ccxt_1 = require("ccxt");
// ---------- Singleton exchange (promise) ----------
var exchangePromise = null;
function parseExchangeList(cfg) {
    // Prefer EXCHANGES (comma-separated), else fallback to single EXCHANGE, else default
    var raw = (process.env.EXCHANGES || cfg.EXCHANGE || 'binance').toLowerCase();
    return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}
/** Build an exchange client with safe spot defaults */
function build(id) {
    var Cls = ccxt_1.default[id];
    if (!Cls)
        throw new Error("Unknown exchange id: ".concat(id));
    var ex = new Cls({
        enableRateLimit: true,
        timeout: 20000,
        options: {
            defaultType: 'spot', // force spot
            defaultMarket: 'spot',
            adjustForTimeDifference: true,
        },
        // Some endpoints/CDNs are picky; a UA helps for a few (e.g., OKX)
        headers: id === 'okx' ? { 'User-Agent': 'Mozilla/5.0' } : undefined,
    });
    return ex;
}
/** Try exchanges in order until one loads markets successfully */
function getWorkingExchange(cfg) {
    return __awaiter(this, void 0, void 0, function () {
        var order, lastErr, _i, order_1, id, ex, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    order = parseExchangeList(cfg);
                    _i = 0, order_1 = order;
                    _a.label = 1;
                case 1:
                    if (!(_i < order_1.length)) return [3 /*break*/, 6];
                    id = order_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    ex = build(id);
                    return [4 /*yield*/, ex.loadMarkets()];
                case 3:
                    _a.sent(); // connectivity + schema check
                    return [2 /*return*/, ex];
                case 4:
                    e_1 = _a.sent();
                    lastErr = e_1;
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: throw new Error("No reachable exchange from list: ".concat(order.join(', '), ". Last error: ").concat((lastErr === null || lastErr === void 0 ? void 0 : lastErr.message) || String(lastErr)));
            }
        });
    });
}
/** Public entry: await this anywhere you need an exchange */
function makeExchange(cfg) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!exchangePromise) {
                exchangePromise = getWorkingExchange(cfg);
            }
            return [2 /*return*/, exchangePromise];
        });
    });
}
var topCache = new Map();
var TOP_TTL_MS = 60 * 60 * 1000; // 1h
/** Normalize unified symbol "BTC/USDT:USDT" → "BTC/USDT" */
function normalizeUnifiedSymbol(sym) {
    var s = String(sym);
    if (s.includes(':')) {
        var lhs = s.split(':')[0];
        return lhs;
    }
    return s;
}
/** "BTC/USDT" → "BTCUSDT" (compact form used across the bot) */
function toCompact(sym) {
    return normalizeUnifiedSymbol(sym).replace('/', '');
}
/** Read a robust quote-volume number from a ticker object */
function readTickerQuoteVol(t) {
    var _a;
    var qv = Number(t === null || t === void 0 ? void 0 : t.quoteVolume);
    if (Number.isFinite(qv) && qv > 0)
        return qv;
    var bv = Number(t === null || t === void 0 ? void 0 : t.baseVolume);
    if (Number.isFinite(bv) && bv > 0)
        return bv;
    // vendor-specific fields often live under .info
    var info = (_a = t === null || t === void 0 ? void 0 : t.info) !== null && _a !== void 0 ? _a : {};
    var candidates = [
        info.quoteVolume,
        info.volCcy24h,
        info.vol24h,
        info.volume,
    ];
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var c = candidates_1[_i];
        var n = Number(c);
        if (Number.isFinite(n) && n > 0)
            return n;
    }
    return 0;
}
/** Read market quote currency safely */
function readMarketQuote(m) {
    return m === null || m === void 0 ? void 0 : m.quote;
}
/** Get a rough volume hint from market metadata */
function readMarketVolHint(m) {
    var _a;
    var info = (_a = m === null || m === void 0 ? void 0 : m.info) !== null && _a !== void 0 ? _a : {};
    var fields = [info.quoteVolume, info.volCcy24h, info.vol24h, info.volume];
    for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
        var f = fields_1[_i];
        var n = Number(f);
        if (Number.isFinite(n) && n > 0)
            return n;
    }
    return 0;
}
/**
 * Compute Top-N symbols quoted in `base`, ranked by quote volume.
 * Prefers `fetchTickers()` (more accurate and live). Falls back to markets metadata.
 * Returns compact symbols like BTCUSDT, ETHUSDT, ...
 */
function computeTop100(ex, base, limit) {
    return __awaiter(this, void 0, void 0, function () {
        var key, tickers, list, _a, markets, live, ranked;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    key = "".concat(ex.id, ":").concat(base, ":").concat(limit);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    if (!((_b = ex.has) === null || _b === void 0 ? void 0 : _b.fetchTickers)) return [3 /*break*/, 3];
                    return [4 /*yield*/, ex.fetchTickers()];
                case 2:
                    tickers = _c.sent();
                    list = Object.entries(tickers)
                        .filter(function (_a) {
                        var sym = _a[0], t = _a[1];
                        var unified = normalizeUnifiedSymbol(sym);
                        var _b = unified.split('/'), q = _b[1];
                        return q === base && readTickerQuoteVol(t) > 0;
                    })
                        .map(function (_a) {
                        var sym = _a[0], t = _a[1];
                        return ({
                            sym: toCompact(sym),
                            vol: readTickerQuoteVol(t),
                        });
                    })
                        .sort(function (a, b) { return b.vol - a.vol; })
                        .slice(0, limit)
                        .map(function (x) { return x.sym; });
                    if (list.length) {
                        topCache.set(key, { at: Date.now(), symbols: list });
                        return [2 /*return*/, list];
                    }
                    _c.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 5: return [4 /*yield*/, ex.loadMarkets()];
                case 6:
                    markets = _c.sent();
                    live = Object.values(markets).filter(function (m) {
                        var isActive = typeof m.active === 'boolean' ? m.active : true;
                        return isActive && m.spot && readMarketQuote(m) === base;
                    });
                    ranked = live
                        .map(function (m) { return ({ sym: toCompact(m.symbol), vol: readMarketVolHint(m) }); })
                        .sort(function (a, b) { return b.vol - a.vol; })
                        .slice(0, limit)
                        .map(function (x) { return x.sym; });
                    topCache.set(key, { at: Date.now(), symbols: ranked });
                    return [2 /*return*/, ranked];
            }
        });
    });
}
/** Return cached Top list; recompute when TTL expires */
function getTop100Symbols(ex, base, limit) {
    return __awaiter(this, void 0, void 0, function () {
        var key, hit;
        return __generator(this, function (_a) {
            key = "".concat(ex.id, ":").concat(base, ":").concat(limit);
            hit = topCache.get(key);
            if (!hit || Date.now() - hit.at > TOP_TTL_MS) {
                return [2 /*return*/, computeTop100(ex, base, limit)];
            }
            return [2 /*return*/, hit.symbols];
        });
    });
}
