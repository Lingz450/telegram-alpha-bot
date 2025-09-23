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
exports.registerMargin = registerMargin;
var FEE_RATE_ROUNDTRIP = 0.0008; // ~0.08% open+close (taker-ish)
function usage(ctx) {
    return ctx.reply('Usage: `/margin cmp=64200 sl=63450 risk=50 lev=5x`\n' +
        'Params can be in any order. `lev=5` or `lev=5x` both work.', { parse_mode: 'Markdown' });
}
function parseKv(text) {
    // turn "margin cmp=64200 sl=63450 risk=50 lev=5x" into a KV map
    var parts = text.trim().split(/\s+/).slice(1); // drop "margin" or "/margin"
    var kv = {};
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var p = parts_1[_i];
        var _a = p.split('='), k = _a[0], v = _a[1];
        if (k && v)
            kv[k.toLowerCase()] = v;
    }
    return kv;
}
function toNum(x) {
    if (!x)
        return null;
    var n = Number(String(x).replace(/[, ]/g, '').toLowerCase().replace(/x$/, ''));
    return Number.isFinite(n) ? n : null;
}
function registerMargin(bot, _cfg, _log) {
    var _this = this;
    // Slash style: /margin cmp=... sl=... risk=... lev=5x
    bot.command('margin', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var kv, cmp, sl, risk, lev, stopPct, baseNotional, leveredNotional, qty, feesEst, msg;
        return __generator(this, function (_a) {
            kv = parseKv(ctx.message.text || '');
            cmp = toNum(kv['cmp']);
            sl = toNum(kv['sl']);
            risk = toNum(kv['risk']);
            lev = toNum(kv['lev']);
            if (![cmp, sl, risk, lev].every(function (v) { return typeof v === 'number' && v > 0; })) {
                return [2 /*return*/, usage(ctx)];
            }
            stopPct = Math.abs((cmp - sl) / cmp);
            if (!(stopPct > 0))
                return [2 /*return*/, ctx.reply('SL must be different from CMP.')];
            baseNotional = risk / stopPct;
            leveredNotional = baseNotional * lev;
            qty = leveredNotional / cmp;
            feesEst = leveredNotional * FEE_RATE_ROUNDTRIP;
            msg = "*Position sizing*\n`CMP`        ".concat(cmp, "\n`SL`         ").concat(sl, "\n`Stop %`     ").concat((stopPct * 100).toFixed(2), "%\n`Risk ($)`   ").concat(risk, "\n\n`Notional`   ").concat(baseNotional.toFixed(2), "\n`Lev Not.`   ").concat(leveredNotional.toFixed(2), "\n`Qty`        ").concat(qty.toFixed(6), "\n`Fees(est)`  ").concat(feesEst.toFixed(2), "\n");
            return [2 /*return*/, ctx.reply(msg, { parse_mode: 'Markdown' })];
        });
    }); });
    // Plain text style: margin cmp=... sl=... risk=... lev=5x
    bot.hears(/^margin\s+/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var text, kv, cmp, sl, risk, lev, stopPct, baseNotional, leveredNotional, qty, feesEst, msg;
        var _a;
        return __generator(this, function (_b) {
            text = ((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) || '';
            if (text.startsWith('/'))
                return [2 /*return*/]; // handled by command above
            kv = parseKv(text);
            cmp = toNum(kv['cmp']);
            sl = toNum(kv['sl']);
            risk = toNum(kv['risk']);
            lev = toNum(kv['lev']);
            if (![cmp, sl, risk, lev].every(function (v) { return typeof v === 'number' && v > 0; })) {
                return [2 /*return*/, usage(ctx)];
            }
            stopPct = Math.abs((cmp - sl) / cmp);
            if (!(stopPct > 0))
                return [2 /*return*/, ctx.reply('SL must be different from CMP.')];
            baseNotional = risk / stopPct;
            leveredNotional = baseNotional * lev;
            qty = leveredNotional / cmp;
            feesEst = leveredNotional * FEE_RATE_ROUNDTRIP;
            msg = "*Position sizing*\n`CMP`        ".concat(cmp, "\n`SL`         ").concat(sl, "\n`Stop %`     ").concat((stopPct * 100).toFixed(2), "%\n`Risk ($)`   ").concat(risk, "\n\n`Notional`   ").concat(baseNotional.toFixed(2), "\n`Lev Not.`   ").concat(leveredNotional.toFixed(2), "\n`Qty`        ").concat(qty.toFixed(6), "\n`Fees(est)`  ").concat(feesEst.toFixed(2), "\n");
            return [2 /*return*/, ctx.reply(msg, { parse_mode: 'Markdown' })];
        });
    }); });
}
