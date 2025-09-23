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
// src/index.ts
var telegraf_1 = require("telegraf");
var pino_1 = require("pino");
var config_1 = require("./config");
var commands_1 = require("./commands");
var alertWorker_1 = require("./jobs/alertWorker");
var refreshTop100Worker_1 = require("./jobs/refreshTop100Worker");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var log, cfg, bot, me, e_1, shutdown;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log = (0, pino_1.default)({
                        level: process.env.LOG_LEVEL || 'info',
                        messageKey: 'msg',
                        base: undefined,
                    });
                    cfg = (0, config_1.loadConfig)();
                    if (!cfg.TELEGRAM_BOT_TOKEN) {
                        log.error('TELEGRAM_BOT_TOKEN missing in .env');
                        process.exit(1);
                    }
                    bot = new telegraf_1.Telegraf(cfg.TELEGRAM_BOT_TOKEN);
                    // Centralized bot error capture
                    bot.catch(function (err, ctx) {
                        log.error({
                            err: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
                            update: ctx.update,
                        }, 'telegraf error');
                    });
                    // Register all commands
                    (0, commands_1.default)(bot, cfg, log);
                    // Background tasks
                    (0, refreshTop100Worker_1.startTop100RefreshLoop)(cfg, log);
                    (0, alertWorker_1.startAlertLoop)(bot, cfg, log);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, bot.telegram.getMe()];
                case 2:
                    me = _a.sent();
                    log.info({ id: me.id, username: me.username, name: me.first_name }, 'bot identity');
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    log.warn({ err: e_1.message }, 'could not fetch bot identity');
                    return [3 /*break*/, 4];
                case 4: 
                // Launch long polling (drop backlog; only process messages to keep latency low)
                return [4 /*yield*/, bot.launch({
                        dropPendingUpdates: true,
                        allowedUpdates: ['message', 'callback_query'], // trim if you don't use callbacks
                    })];
                case 5:
                    // Launch long polling (drop backlog; only process messages to keep latency low)
                    _a.sent();
                    log.info('telegram bot up');
                    shutdown = function (signal) { return __awaiter(_this, void 0, void 0, function () {
                        var e_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    log.info({ signal: signal }, 'shutting down');
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, 4, 5]);
                                    return [4 /*yield*/, bot.stop(signal)];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 5];
                                case 3:
                                    e_2 = _a.sent();
                                    log.warn({ err: e_2.message }, 'error during bot.stop');
                                    return [3 /*break*/, 5];
                                case 4:
                                    process.exit(0);
                                    return [7 /*endfinally*/];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); };
                    process.once('SIGINT', function () { return shutdown('SIGINT'); });
                    process.once('SIGTERM', function () { return shutdown('SIGTERM'); });
                    // Catch unhandled errors to avoid silent crashes
                    process.on('unhandledRejection', function (reason) {
                        log.error({ reason: reason }, 'unhandledRejection');
                    });
                    process.on('uncaughtException', function (err) {
                        log.error({ err: err.message, stack: err.stack }, 'uncaughtException');
                        // optional: process.exit(1);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) {
    // final safety net
    // eslint-disable-next-line no-console
    console.error('fatal startup error', e);
    process.exit(1);
});
