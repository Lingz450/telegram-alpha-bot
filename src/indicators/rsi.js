"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rsi = rsi;
var technicalindicators_1 = require("technicalindicators");
function rsi(values, period) {
    if (period === void 0) { period = 14; }
    return technicalindicators_1.RSI.calculate({ period: period, values: values });
}
