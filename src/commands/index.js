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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = registerCommands;
var help_1 = require("./help");
var alerts_1 = require("./alerts");
var chart_1 = require("./chart");
var ema_1 = require("./ema");
var rsi_1 = require("./rsi");
var heatmap_1 = require("./heatmap");
var findpair_1 = require("./findpair");
var call_1 = require("./call");
var margin_1 = require("./margin");
var pnl_1 = require("./pnl");
var wallet_1 = require("./wallet");
var giveaway_1 = require("./giveaway");
var dev_1 = require("./dev");
var whoami_1 = require("./whoami");
var list_admins_1 = require("./list_admins");
var atrbreak_1 = require("./atrbreak");
var backtest_1 = require("./backtest");
// Helper to register commands with optional scopes
function publishMenus(bot) {
    return __awaiter(this, void 0, void 0, function () {
        var common, adminish, maybeAlpha, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    common = [
                        { command: "help", description: "Show commands" },
                        { command: "whoami", description: "Print your user id and chat id" },
                        { command: "alert", description: "Set price alert: /alert BTC 65000" },
                        { command: "alertlist", description: "List active alerts" },
                        { command: "chart", description: "Quick chart image" },
                        { command: "ema", description: "EMA scanner" },
                        { command: "rsi", description: "RSI scanner" },
                        { command: "heatmap", description: "Order book heatmap" },
                        { command: "findpair", description: "Guess pair by price" },
                        { command: "margin", description: "Position sizing" },
                        { command: "pnl", description: "PnL checker" },
                        { command: "atrbreak", description: "ATR breakout scanner" },
                        { command: "backtest", description: "Backtest EMA cross" },
                    ];
                    adminish = [
                        { command: "call", description: "Publish trade call, admin" },
                        { command: "wallet", description: "AI bot trades, admin" },
                        { command: "giveaway", description: "Timed giveaway, admin" },
                        { command: "list_admins", description: "List group admin IDs, owner only" },
                        { command: "alertreset", description: "Clear alerts, admin" },
                        { command: "div", description: "Dev hook, admin" },
                    ];
                    maybeAlpha = [{ command: "alpha", description: "AI market take, or type $symbol" }];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    // Default global menu, safe baseline
                    return [4 /*yield*/, bot.telegram.setMyCommands(__spreadArray(__spreadArray(__spreadArray([], maybeAlpha, true), common, true), adminish, true)).catch(function () { })];
                case 2:
                    // Default global menu, safe baseline
                    _b.sent();
                    // Private chats, show everything that helps solo users
                    return [4 /*yield*/, bot.telegram
                            .setMyCommands(__spreadArray(__spreadArray([], maybeAlpha, true), common, true), {
                            scope: { type: "all_private_chats" },
                        })
                            .catch(function () { })];
                case 3:
                    // Private chats, show everything that helps solo users
                    _b.sent();
                    // Group chats, keep it tighter and include admin tools
                    return [4 /*yield*/, bot.telegram
                            .setMyCommands(__spreadArray(__spreadArray([], maybeAlpha, true), [
                            { command: "help", description: "Show commands" },
                            { command: "alert", description: "Set price alert" },
                            { command: "alertlist", description: "List active alerts" },
                            { command: "chart", description: "Quick chart" },
                            { command: "ema", description: "EMA scanner" },
                            { command: "rsi", description: "RSI scanner" },
                            { command: "heatmap", description: "Order book heatmap" },
                            { command: "findpair", description: "Guess pair by price" },
                            { command: "margin", description: "Position sizing" },
                            { command: "pnl", description: "PnL checker" },
                            { command: "giveaway", description: "Timed giveaway, admin" },
                            { command: "call", description: "Trade call, admin" },
                            { command: "list_admins", description: "List admin IDs" },
                            { command: "alertreset", description: "Clear alerts, admin" },
                        ], false), { scope: { type: "all_group_chats" } })
                            .catch(function () { })];
                case 4:
                    // Group chats, keep it tighter and include admin tools
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function registerCommands(bot, cfg, log) {
    var _this = this;
    // Publish slash menus, best effort
    void publishMenus(bot);
    // Core handlers
    (0, help_1.registerHelp)(bot);
    (0, whoami_1.registerWhoAmI)(bot);
    (0, alerts_1.registerAlerts)(bot, cfg, log);
    (0, chart_1.registerChart)(bot, cfg, log);
    (0, ema_1.registerEMA)(bot, cfg, log);
    (0, rsi_1.registerRSI)(bot, cfg, log);
    (0, heatmap_1.registerHeatmap)(bot, cfg, log);
    (0, findpair_1.registerFindPair)(bot, cfg, log);
    (0, call_1.registerCall)(bot, cfg, log);
    (0, margin_1.registerMargin)(bot, cfg, log);
    (0, pnl_1.registerPnL)(bot, cfg, log);
    (0, wallet_1.registerWallet)(bot, cfg, log);
    (0, giveaway_1.registerGiveaway)(bot, cfg, log);
    (0, atrbreak_1.registerATRBreak)(bot, cfg, log);
    (0, backtest_1.registerBacktest)(bot, cfg, log);
    (0, dev_1.registerDev)(bot, cfg, log);
    (0, list_admins_1.registerListAdmins)(bot, cfg);
    // Optional: registerAlpha if present. Works in dev and in compiled dist.
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var mod, _a, _b;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 6, , 7]);
                    mod = void 0;
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 5]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("./alpha"); })];
                case 2:
                    mod = _d.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _d.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("./alpha.js"); })];
                case 4:
                    mod = _d.sent();
                    return [3 /*break*/, 5];
                case 5:
                    if (mod === null || mod === void 0 ? void 0 : mod.registerAlpha) {
                        mod.registerAlpha(bot, cfg, log);
                        (_c = log === null || log === void 0 ? void 0 : log.info) === null || _c === void 0 ? void 0 : _c.call(log, "alpha command registered");
                    }
                    return [3 /*break*/, 7];
                case 6:
                    _b = _d.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); })();
}
