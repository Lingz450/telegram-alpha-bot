"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PnLRepo = void 0;
var prisma_1 = require("../prisma");
exports.PnLRepo = {
    listByChat: function (chatId) {
        return prisma_1.prisma.executedTrade.findMany({ where: { chatId: chatId } });
    }
};
