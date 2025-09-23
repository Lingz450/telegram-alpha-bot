"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
// src/config.ts
require("dotenv/config");
var zod_1 = require("zod");
var Env = zod_1.z.object({
    // Core
    TELEGRAM_BOT_TOKEN: zod_1.z.string().min(10, 'Missing TELEGRAM_BOT_TOKEN'),
    DATABASE_URL: zod_1.z.string().optional(),
    // Exchange / universe
    EXCHANGE: zod_1.z.string().default('binance'),
    UNIVERSE_BASE: zod_1.z.string().default('USDT'),
    UNIVERSE_LIMIT: zod_1.z.coerce.number().default(100),
    // Admin / permissions
    OWNER_ID: zod_1.z.string().optional(),
    ADMIN_USER_IDS: zod_1.z.string().optional(), // "1,2,3"
    ADMIN_CHAT_IDS: zod_1.z.string().optional(), // "-100..., -100..."
    // Jobs / intervals
    ALERT_TICK_MS: zod_1.z.coerce.number().default(5000),
    TOP100_REFRESH_MIN: zod_1.z.coerce.number().default(60),
    // Misc
    LOG_LEVEL: zod_1.z.string().default('info'),
    CHROME_PATH: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    HTTP_PROXY: zod_1.z.string().optional(),
    HTTPS_PROXY: zod_1.z.string().optional(),
});
function split(csv) {
    return csv ? csv.split(/[, ]+/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
}
function loadConfig() {
    var e = Env.parse(process.env);
    return {
        TELEGRAM_BOT_TOKEN: e.TELEGRAM_BOT_TOKEN,
        DATABASE_URL: e.DATABASE_URL,
        EXCHANGE: e.EXCHANGE.toLowerCase(),
        UNIVERSE_BASE: e.UNIVERSE_BASE.toUpperCase(),
        UNIVERSE_LIMIT: e.UNIVERSE_LIMIT,
        OWNER_ID: e.OWNER_ID,
        ADMIN_USER_IDS: split(e.ADMIN_USER_IDS),
        ADMIN_CHAT_IDS: split(e.ADMIN_CHAT_IDS),
        ALERT_TICK_MS: e.ALERT_TICK_MS,
        TOP100_REFRESH_MIN: e.TOP100_REFRESH_MIN,
        LOG_LEVEL: e.LOG_LEVEL,
        CHROME_PATH: e.CHROME_PATH,
        REDIS_URL: e.REDIS_URL,
        HTTP_PROXY: e.HTTP_PROXY,
        HTTPS_PROXY: e.HTTPS_PROXY,
    };
}
