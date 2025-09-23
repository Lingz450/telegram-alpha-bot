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
exports.registerListAdmins = registerListAdmins;
function nameOf(user) {
    var handle = (user === null || user === void 0 ? void 0 : user.username) ? "@".concat(user.username) : '';
    var full = [user === null || user === void 0 ? void 0 : user.first_name, user === null || user === void 0 ? void 0 : user.last_name].filter(Boolean).join(' ');
    return handle || full || '(no name)';
}
function statusOf(s) {
    // creator | administrator | member | restricted | left | kicked
    return (s || 'unknown').replace(/_/g, ' ');
}
/**
 * /list_admins (run inside a group/supergroup)
 * - Only the OWNER_ID can run it (if OWNER_ID is set). If OWNER_ID is unset, anyone can run (bootstrap).
 * - Prints each admin's user_id + name, and an .env-ready ADMIN_USER_IDS line.
 */
function registerListAdmins(bot, cfg) {
    var _this = this;
    bot.command('list_admins', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var uid, chatId, chatType, title, admins, e_1, lines, ids, msg, _a;
        var _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 5, , 6]);
                    uid = String((_c = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : '');
                    chatId = String((_e = (_d = ctx.chat) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : '');
                    chatType = ((_f = ctx.chat) === null || _f === void 0 ? void 0 : _f.type) || '';
                    title = ((_g = ctx.chat) === null || _g === void 0 ? void 0 : _g.title) || '';
                    // Permission: if OWNER_ID is configured, only owner can run
                    if (cfg.OWNER_ID && uid !== cfg.OWNER_ID) {
                        return [2 /*return*/, ctx.reply('Owner only.')];
                    }
                    // Must be run in a group/supergroup to enumerate admins
                    if (!chatType || chatType === 'private') {
                        return [2 /*return*/, ctx.reply('Use `/list_admins` inside the group you want to configure.', {
                                parse_mode: 'Markdown',
                            })];
                    }
                    admins = void 0;
                    _h.label = 1;
                case 1:
                    _h.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ctx.getChatAdministrators()];
                case 2:
                    admins = _h.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _h.sent();
                    return [2 /*return*/, ctx.reply('I need permission to view the member list. Make sure the bot is in the group and can read members.')];
                case 4:
                    if (!(admins === null || admins === void 0 ? void 0 : admins.length)) {
                        return [2 /*return*/, ctx.reply('No admins found (weird, but okay).')];
                    }
                    lines = admins.map(function (a) {
                        var user = a.user;
                        var label = nameOf(user);
                        var st = statusOf(a.status);
                        var anon = (user === null || user === void 0 ? void 0 : user.is_bot) ? ' (bot)' : '';
                        // FYI: Anonymous admins show up as "is_anonymous" in some contexts; user.id still not your real id.
                        var maybeAnon = (a === null || a === void 0 ? void 0 : a.is_anonymous) ? ' (anonymous admin)' : '';
                        return "- ".concat(label).concat(anon).concat(maybeAnon, "  `").concat(user.id, "`  ").concat(st);
                    });
                    ids = admins.map(function (a) { return String(a.user.id); }).join(',');
                    msg = [
                        "*Admins for this chat*",
                        "`chat_id`  ".concat(chatId, " ").concat(title ? "(".concat(title, ")") : ''),
                        '',
                        lines.join('\n'),
                        '',
                        'Add to `.env` (example):',
                        "`ADMIN_USER_IDS=".concat(ids, "`"),
                        "`ADMIN_CHAT_IDS=".concat(chatId, "`   # optional: allow admin-only commands in this chat"),
                        '',
                        '_Note: If your account is set to **Remain Anonymous** in this group, Telegram hides your real user_id. Turn that off temporarily or DM the bot `/whoami` to get your id._',
                    ].join('\n');
                    return [2 /*return*/, ctx.reply(msg, { parse_mode: 'Markdown' })];
                case 5:
                    _a = _h.sent();
                    return [2 /*return*/, ctx.reply('Could not list admins (permissions or Telegram API issue).')];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // Optional plain-text alias
    bot.hears(/^list[_ ]admins$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            ctx.message.text = '/list_admins';
            return [2 /*return*/, bot.handleUpdate(ctx.update)];
        });
    }); });
}
