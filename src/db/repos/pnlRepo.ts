import { prisma } from '../prisma';

export const PnLRepo = {
  listByChat(chatId: string) {
    return prisma.executedTrade.findMany({ where: { chatId } });
  }
};
