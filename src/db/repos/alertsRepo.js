"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsRepo = void 0;
var prisma_1 = require("../prisma");
exports.AlertsRepo = {
    allActiveByChat: function (chatId) {
        return prisma_1.prisma.alert.findMany({ where: { chatId: chatId, active: true } });
    }
};
