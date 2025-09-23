"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ema = ema;
var technicalindicators_1 = require("technicalindicators");
function ema(values, period) {
    return technicalindicators_1.EMA.calculate({ period: period, values: values });
}
