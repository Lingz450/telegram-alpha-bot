import { prisma } from '../prisma';

export const WalletRepo = {
  listByChat(chatId: string) {
    return prisma.walletPosition.findMany({ where: { chatId } });
  }
};
