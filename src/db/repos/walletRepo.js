"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRepo = void 0;
var prisma_1 = require("../prisma");
exports.WalletRepo = {
    listByChat: function (chatId) {
        return prisma_1.prisma.walletPosition.findMany({ where: { chatId: chatId } });
    }
};
