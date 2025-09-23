"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtNum = void 0;
var fmtNum = function (n, digits) {
    if (digits === void 0) { digits = 6; }
    return Number.isFinite(n) ? Number(n).toFixed(digits) : String(n);
};
exports.fmtNum = fmtNum;
