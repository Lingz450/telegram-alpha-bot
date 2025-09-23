import { prisma } from '../prisma';

export const AlertsRepo = {
  allActiveByChat(chatId: string) {
    return prisma.alert.findMany({ where: { chatId, active: true }});
  }
};
