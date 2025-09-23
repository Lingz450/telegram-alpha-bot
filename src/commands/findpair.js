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
exports.registerFindPair = registerFindPair;
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
function usage(ctx) {
    return ctx.reply('Usage: `/findpair 0.0000321`', { parse_mode: 'Markdown' });
}
function parsePrice(raw) {
    var cleaned = (raw || '').trim().replace(/[, ]/g, '').toLowerCase();
    // allow decimals and scientific notation (e.g., 1e-6)
    if (!/^(\d+(\.\d+)?)(e-?\d+)?$/.test(cleaned))
        return null;
    var n = Number(cleaned);
    return Number.isFinite(n) && n > 0 ? n : null;
}
function searchPairs(cfg, target) {
    return __awaiter(this, void 0, void 0, function () {
        var ex, universe, rows, _i, universe_1, sym, t, last, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, client_1.makeExchange)(cfg)];
                case 1:
                    ex = _b.sent();
                    return [4 /*yield*/, (0, client_1.getTop100Symbols)(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT)];
                case 2:
                    universe = _b.sent();
                    rows = [];
                    _i = 0, universe_1 = universe;
                    _b.label = 3;
                case 3:
                    if (!(_i < universe_1.length)) return [3 /*break*/, 8];
                    sym = universe_1[_i];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, (0, marketData_1.ticker)(ex, sym)];
                case 5:
                    t = _b.sent();
                    last = Number(t.last);
                    if (!Number.isFinite(last) || last <= 0)
                        return [3 /*break*/, 7];
                    rows.push({ symbol: sym, last: last, diff: Math.abs(1 - last / target) });
                    return [3 /*break*/, 7];
                case 6:
                    _a = _b.sent();
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8:
                    rows.sort(function (a, b) { return a.diff - b.diff; });
                    return [2 /*return*/, rows.slice(0, 5)];
            }
        });
    });
}
function registerFindPair(bot, cfg, _log) {
    var _this = this;
    // Slash command: /findpair 0.0000321
    bot.command('findpair', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var arg, price, best, lines;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    arg = (ctx.message.text || '').split(/\s+/)[1];
                    price = parsePrice(arg || '');
                    if (!price)
                        return [2 /*return*/, usage(ctx)];
                    return [4 /*yield*/, searchPairs(cfg, price)];
                case 1:
                    best = _a.sent();
                    if (!best.length)
                        return [2 /*return*/, ctx.reply('No matches.')];
                    lines = best.map(function (b) { return "- ".concat(b.symbol, "  last=`").concat(b.last, "`"); });
                    return [2 /*return*/, ctx.reply("*Closest matches*\n".concat(lines.join('\n')), { parse_mode: 'Markdown' })];
            }
        });
    }); });
    // Plain text style: findpair 0.0000321
    bot.hears(/^findpair\s+(.+)/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var text, _a, raw, price, best, lines;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    text = ((_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) || '';
                    if (text.startsWith('/'))
                        return [2 /*return*/]; // handled by command above
                    _a = text.match(/^findpair\s+(.+)/i) || [], raw = _a[1];
                    price = parsePrice(raw || '');
                    if (!price)
                        return [2 /*return*/, usage(ctx)];
                    return [4 /*yield*/, searchPairs(cfg, price)];
                case 1:
                    best = _c.sent();
                    if (!best.length)
                        return [2 /*return*/, ctx.reply('No matches.')];
                    lines = best.map(function (b) { return "- ".concat(b.symbol, "  last=`").concat(b.last, "`"); });
                    return [2 /*return*/, ctx.reply("*Closest matches*\n".concat(lines.join('\n')), { parse_mode: 'Markdown' })];
            }
        });
    }); });
}
