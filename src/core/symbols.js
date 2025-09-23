"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normSymbol = normSymbol;
function normSymbol(input, base) {
    if (base === void 0) { base = 'USDT'; }
    var s = input.toUpperCase().replace('-', '').replace('/', '');
    if (s.endsWith(base))
        return s;
    return s + base;
}
