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
exports.registerGiveaway = registerGiveaway;
var permissions_1 = require("../core/permissions");
function usage(ctx) {
    return ctx.reply('Usage: `/giveaway <durationSec> <prize> [winners=N]`\n' +
        'Example: `/giveaway 3600 $25 USDT winners=3`', { parse_mode: 'Markdown' });
}
function parseArgs(text) {
    // Accept:
    // /giveaway 3600 $25 USDT winners=3
    // giveaway 120 "Nitro 1 month" winners=1
    var parts = text.trim().split(/\s+/).slice(1);
    if (!parts.length)
        return null;
    var dur = Number(parts[0]);
    if (!Number.isFinite(dur) || dur <= 0)
        return null;
    // pull any winners=N token from the rest, prize is everything else joined with spaces
    var winners = 1;
    var rest = parts.slice(1).filter(function (p) {
        var m = p.match(/^winners=(\d+)$/i);
        if (m)
            winners = Math.max(1, Math.min(20, Number(m[1]))); // clamp 1..20
        return !m;
    });
    var prize = rest.join(' ').trim().replace(/^"(.*)"$/, '$1');
    if (!prize)
        return null;
    return { durationSec: Math.floor(dur), prize: prize, winners: winners };
}
function startGiveaway(bot, ctx, parsed) {
    var _this = this;
    var _a;
    var durationSec = parsed.durationSec, prize = parsed.prize, winners = parsed.winners;
    if (durationSec < 5)
        return ctx.reply('Giveaway duration must be >= 5 seconds.');
    var chatId = String((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id);
    var entrants = new Set();
    // Listener to collect entrants from messages in the same chat
    var onMessage = function (msgCtx) {
        var _a, _b, _c;
        if (String((_a = msgCtx.chat) === null || _a === void 0 ? void 0 : _a.id) !== chatId)
            return;
        var from = msgCtx.from;
        if (!from)
            return;
        if ((_c = (_b = msgCtx.message) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.startsWith('/giveaway'))
            return; // ignore command echo
        if (from.is_bot)
            return;
        entrants.add(String(from.id));
    };
    bot.on('message', onMessage);
    ctx.reply("\uD83C\uDF81 *Giveaway started* \u2014 prize: *".concat(prize, "*\nEnds in ").concat(durationSec, "s.\nSend any message to enter."), { parse_mode: 'Markdown' });
    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
        var list, pool, pick, take, i, idx, labels, _i, pick_1, id, member, name_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Stop collecting
                    bot.off('message', onMessage);
                    list = Array.from(entrants);
                    if (list.length === 0) {
                        return [2 /*return*/, ctx.reply('No entrants, giveaway cancelled.')];
                    }
                    pool = __spreadArray([], list, true);
                    pick = [];
                    take = Math.min(winners, pool.length);
                    for (i = 0; i < take; i++) {
                        idx = Math.floor(Math.random() * pool.length);
                        pick.push(pool.splice(idx, 1)[0]);
                    }
                    labels = [];
                    _i = 0, pick_1 = pick;
                    _b.label = 1;
                case 1:
                    if (!(_i < pick_1.length)) return [3 /*break*/, 6];
                    id = pick_1[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, ctx.telegram.getChatMember(Number(chatId), Number(id))];
                case 3:
                    member = _b.sent();
                    name_1 = member.user.username
                        ? "@".concat(member.user.username)
                        : [member.user.first_name, member.user.last_name].filter(Boolean).join(' ') || id;
                    labels.push(name_1);
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    labels.push(id);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [4 /*yield*/, ctx.reply("\uD83C\uDFC6 Winners for *".concat(prize, "*:\n- ").concat(labels.join('\n- ')), { parse_mode: 'Markdown' })];
                case 7:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); }, durationSec * 1000);
}
function registerGiveaway(bot, cfg, _log) {
    var _this = this;
    // Slash style
    bot.command('giveaway', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var parsed;
        return __generator(this, function (_a) {
            if (!(0, permissions_1.isAdmin)(ctx, cfg))
                return [2 /*return*/, ctx.reply('Admin only.')];
            parsed = parseArgs((ctx.message.text || ''));
            if (!parsed)
                return [2 /*return*/, usage(ctx)];
            startGiveaway(bot, ctx, parsed);
            return [2 /*return*/];
        });
    }); });
    // Plain text style
    bot.hears(/^giveaway\s+/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var parsed;
        var _a, _b;
        return __generator(this, function (_c) {
            if ((_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.startsWith('/'))
                return [2 /*return*/]; // handled above
            if (!(0, permissions_1.isAdmin)(ctx, cfg))
                return [2 /*return*/, ctx.reply('Admin only.')];
            parsed = parseArgs((ctx.message.text || ''));
            if (!parsed)
                return [2 /*return*/, usage(ctx)];
            startGiveaway(bot, ctx, parsed);
            return [2 /*return*/];
        });
    }); });
}
