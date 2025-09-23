"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = isAdmin;
function isAdmin(ctx, cfg) {
    var _a, _b, _c, _d, _e, _f;
    var uid = String((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '');
    var chat = String((_d = (_c = ctx.chat) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : '');
    if (cfg.OWNER_ID && uid === String(cfg.OWNER_ID))
        return true;
    if ((_e = cfg.ADMIN_USER_IDS) === null || _e === void 0 ? void 0 : _e.includes(uid))
        return true;
    if ((_f = cfg.ADMIN_CHAT_IDS) === null || _f === void 0 ? void 0 : _f.includes(chat))
        return true;
    // If message is from an "anonymous admin", uid can be empty → deny.
    return false;
}
