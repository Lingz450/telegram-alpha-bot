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
exports.registerWhoAmI = registerWhoAmI;
function fmtStatus(s) {
    if (!s)
        return 'unknown';
    return s.replace(/_/g, ' ');
}
function registerWhoAmI(bot) {
    var _this = this;
    // Slash command
    bot.command('whoami', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        var uid, uname, first, last, fullName, chatId, chatType, title, status, member, _a, lines;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    uid = String((_c = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : '');
                    uname = ((_d = ctx.from) === null || _d === void 0 ? void 0 : _d.username) ? "@".concat(ctx.from.username) : '';
                    first = ((_e = ctx.from) === null || _e === void 0 ? void 0 : _e.first_name) || '';
                    last = ((_f = ctx.from) === null || _f === void 0 ? void 0 : _f.last_name) || '';
                    fullName = [first, last].filter(Boolean).join(' ');
                    chatId = String((_h = (_g = ctx.chat) === null || _g === void 0 ? void 0 : _g.id) !== null && _h !== void 0 ? _h : '');
                    chatType = ((_j = ctx.chat) === null || _j === void 0 ? void 0 : _j.type) || '';
                    title = ((_k = ctx.chat) === null || _k === void 0 ? void 0 : _k.title) || '';
                    _m.label = 1;
                case 1:
                    _m.trys.push([1, 4, , 5]);
                    if (!(chatType && chatType !== 'private' && ((_l = ctx.from) === null || _l === void 0 ? void 0 : _l.id))) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.getChatMember(ctx.from.id)];
                case 2:
                    member = _m.sent();
                    status = member === null || member === void 0 ? void 0 : member.status; // creator | administrator | member | restricted | left | kicked
                    _m.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    _a = _m.sent();
                    return [3 /*break*/, 5];
                case 5:
                    lines = [
                        '*Who am I*',
                        "`user_id`   ".concat(uid, " ").concat(uname, " ").concat(fullName ? "(".concat(fullName, ")") : ''),
                        "`chat_id`   ".concat(chatId, " ").concat(title ? "(".concat(title, ")") : ''),
                        "`chat_type` ".concat(chatType || 'unknown'),
                        "`status`    ".concat(fmtStatus(status)),
                        '',
                        'Add these to `.env`:',
                        "`OWNER_ID=".concat(uid, "`"),
                        "`ADMIN_USER_IDS=".concat(uid, "`"),
                        "`ADMIN_CHAT_IDS=".concat(chatId, "`   # include only if you want chat-scoped admin"),
                        '',
                        '_Tip: In supergroups, disable **Remain Anonymous** for admins if the ID looks odd. ' +
                            'You can also DM the bot `/whoami` to get a clean user_id._',
                    ];
                    return [2 /*return*/, ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' })];
            }
        });
    }); });
    // Plain text fallback ("whoami")
    bot.hears(/^whoami$/i, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Reuse the slash command handler
            ctx.message.text = '/whoami';
            return [2 /*return*/, bot.handleUpdate(ctx.update)];
        });
    }); });
}
