"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesRepo = void 0;
var prisma_1 = require("../prisma");
exports.TradesRepo = {
    createCall: function (data) {
        return prisma_1.prisma.tradeCall.create({ data: data });
    }
};
