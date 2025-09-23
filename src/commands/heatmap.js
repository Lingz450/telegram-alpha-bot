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
exports.registerHeatmap = registerHeatmap;
var symbols_1 = require("../core/symbols");
var client_1 = require("../exchange/client");
var marketData_1 = require("../exchange/marketData");
var heatmapRenderer_1 = require("../charts/heatmapRenderer");
var isMode = function (s) { return s === 'normal' || s === 'extended'; };
function usage(ctx) {
    return ctx.reply('Usage: `/heatmap BTCUSDT extended` or `heatmap BTCUSDT normal`', { parse_mode: 'Markdown' });
}
function parseArgs(text, baseQuote) {
    // Supports:
    //   /heatmap BTCUSDT extended
    //   heatmap BTCUSDT normal
    //   /heatmap BTC ltf=... (ignored) public=true|false (optional and ignored in v1)
    var parts = text.trim().split(/\s+/).slice(1);
    if (parts.length < 1)
        return null;
    var raw = parts[0].replace(/^\$/, '');
    var symbol = (0, symbols_1.normSymbol)(raw, baseQuote);
    var mode = 'normal';
    if (parts[1]) {
        var m = parts[1].toLowerCase();
        if (isMode(m))
            mode = m;
    }
    // Optional "public=true|false" is accepted but not used yet
    // const pub = parts.find(p => /^public=(true|false)$/i.test(p));
    return { symbol: symbol, mode: mode };
}
function handleHeatmap(ctx, cfg, text) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, symbol, mode, ex, ob, png, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parsed = parseArgs(text, cfg.UNIVERSE_BASE);
                    if (!parsed)
                        return [2 /*return*/, usage(ctx)];
                    symbol = parsed.symbol, mode = parsed.mode;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, client_1.makeExchange)(cfg)];
                case 2:
                    ex = _a.sent();
                    return [4 /*yield*/, (0, marketData_1.orderbook)(ex, symbol, mode === 'extended' ? 200 : 50)];
                case 3:
                    ob = _a.sent();
                    return [4 /*yield*/, (0, heatmapRenderer_1.renderHeatmap)({ symbol: symbol, mode: mode, orderbook: ob })];
                case 4:
                    png = _a.sent();
                    return [4 /*yield*/, ctx.replyWithPhoto({ source: png }, { caption: "**".concat(symbol, "** order book ").concat(mode), parse_mode: 'Markdown' })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    return [2 /*return*/, ctx.reply('Could not render heatmap. Example: `/heatmap BTCUSDT extended`', { parse_mode: 'Markdown' })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function registerHeatmap(bot, cfg, _log) {
    var _this = this;
    // Slash command: /heatmap BTCUSDT extended
    bot.command('heatmap', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var text;
        var _a;
        return __generator(this, function (_b) {
            text = (((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) || '');
            return [2 /*return*/, handleHeatmap(ctx, cfg, text)];
        });
    }); });
    // Plain text style: heatmap BTCUSDT extended
    bot.hears(/^heatmap\s+/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var text;
        var _a;
        return __generator(this, function (_b) {
            text = (((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) || '');
            // If user typed /heatmap, the command handler already caught it
            if (text.startsWith('/'))
                return [2 /*return*/];
            return [2 /*return*/, handleHeatmap(ctx, cfg, text)];
        });
    }); });
}
