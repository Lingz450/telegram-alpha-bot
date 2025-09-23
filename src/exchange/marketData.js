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
exports.klines = klines;
exports.orderbook = orderbook;
exports.ticker = ticker;
var bottleneck_1 = require("bottleneck");
// --------- Rate-limit + retry ----------
var limiter = new bottleneck_1.default({
    maxConcurrent: 6, // bounded parallelism (keeps scans quick, avoids bans)
    minTime: 120, // ms spacing between requests
});
// tiny retry helper with backoff
function withRetry(fn_1) {
    return __awaiter(this, arguments, void 0, function (fn, tries) {
        var err, _loop_1, i, state_1;
        if (tries === void 0) { tries = 2; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (i) {
                        var _b, e_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 5]);
                                    _b = {};
                                    return [4 /*yield*/, fn()];
                                case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                case 2:
                                    e_1 = _c.sent();
                                    err = e_1;
                                    if (!(i < tries)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 300 * (i + 1)); })];
                                case 3:
                                    _c.sent();
                                    _c.label = 4;
                                case 4: return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i <= tries)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: throw err;
            }
        });
    });
}
// --------- Symbol normalizer ----------
/**
 * Resolve a user symbol like "BTCUSDT" to an exchange market symbol "BTC/USDT".
 * Uses markets_by_symbol when available; otherwise tries common quote suffixes.
 */
function toMarketSymbol(ex, symbol) {
    var _a, _b;
    var map = (_a = ex.markets_by_symbol) !== null && _a !== void 0 ? _a : {};
    var fromMap = (_b = map[symbol]) === null || _b === void 0 ? void 0 : _b.symbol;
    if (fromMap)
        return fromMap;
    if (symbol.includes('/'))
        return symbol; // already normalized
    var m = symbol.match(/^([A-Z0-9\-]+)(USDT|USDC|USD|BTC|ETH)$/i);
    if (m)
        return "".concat(m[1], "/").concat(m[2]).toUpperCase();
    // last resort: try to inject slash before trailing "USDT"
    if (/USDT$/i.test(symbol))
        return symbol.replace(/USDT$/i, '/USDT');
    return symbol;
}
// --------- Tiny caches (per-process) ----------
var kCache = new Map();
var tCache = new Map();
var obCache = new Map();
var TTL_KLINE = {
    '5m': 15000,
    '15m': 30000,
    '1h': 60000,
    '2h': 60000,
    '4h': 120000,
    '1d': 300000,
};
var TTL_TICKER = 5000;
var TTL_OB = 5000;
// --------- Public API ----------
function klines(ex_1, symbol_1, timeframe_1) {
    return __awaiter(this, arguments, void 0, function (ex, symbol, timeframe, limit) {
        var marketSymbol, key, now, ttl, hit, rows, data;
        var _a;
        if (limit === void 0) { limit = 300; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    marketSymbol = toMarketSymbol(ex, symbol);
                    key = "".concat(ex.id || 'ex', ":k:").concat(marketSymbol, ":").concat(timeframe, ":").concat(limit);
                    now = Date.now();
                    ttl = (_a = TTL_KLINE[timeframe]) !== null && _a !== void 0 ? _a : 60000;
                    hit = kCache.get(key);
                    if (hit && now - hit.ts < ttl)
                        return [2 /*return*/, hit.data];
                    return [4 /*yield*/, limiter.schedule(function () {
                            return withRetry(function () { return ex.fetchOHLCV(marketSymbol, timeframe, undefined, limit); });
                        })];
                case 1:
                    rows = _b.sent();
                    data = rows.map(function (_a) {
                        var t = _a[0], o = _a[1], h = _a[2], l = _a[3], c = _a[4], v = _a[5];
                        return ({
                            t: Number(t),
                            o: Number(o),
                            h: Number(h),
                            l: Number(l),
                            c: Number(c),
                            v: Number(v),
                        });
                    });
                    kCache.set(key, { ts: now, data: data });
                    return [2 /*return*/, data];
            }
        });
    });
}
function orderbook(ex_1, symbol_1) {
    return __awaiter(this, arguments, void 0, function (ex, symbol, depth) {
        var marketSymbol, key, now, hit, ob;
        if (depth === void 0) { depth = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    marketSymbol = toMarketSymbol(ex, symbol);
                    key = "".concat(ex.id || 'ex', ":ob:").concat(marketSymbol, ":").concat(depth);
                    now = Date.now();
                    hit = obCache.get(key);
                    if (hit && now - hit.ts < TTL_OB)
                        return [2 /*return*/, hit.data];
                    return [4 /*yield*/, limiter.schedule(function () {
                            return withRetry(function () { return ex.fetchOrderBook(marketSymbol, depth); });
                        })];
                case 1:
                    ob = _a.sent();
                    obCache.set(key, { ts: now, data: ob });
                    return [2 /*return*/, ob];
            }
        });
    });
}
function ticker(ex, symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var marketSymbol, key, now, hit, t, last;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    marketSymbol = toMarketSymbol(ex, symbol);
                    key = "".concat(ex.id || 'ex', ":t:").concat(marketSymbol);
                    now = Date.now();
                    hit = tCache.get(key);
                    if (hit && now - hit.ts < TTL_TICKER)
                        return [2 /*return*/, { last: hit.last, raw: hit.raw }];
                    return [4 /*yield*/, limiter.schedule(function () {
                            return withRetry(function () { return ex.fetchTicker(marketSymbol); });
                        })];
                case 1:
                    t = _d.sent();
                    last = Number((_b = (_a = t.last) !== null && _a !== void 0 ? _a : t.close) !== null && _b !== void 0 ? _b : (t.info && ((_c = t.info.lastPrice) !== null && _c !== void 0 ? _c : t.info.close)));
                    if (Number.isFinite(last))
                        tCache.set(key, { ts: now, last: last, raw: t });
                    return [2 /*return*/, { last: last, raw: t }];
            }
        });
    });
}
