import { prisma } from '../prisma';

export const TradesRepo = {
  createCall(data: Parameters<typeof prisma.tradeCall.create>[0]['data']) {
    return prisma.tradeCall.create({ data });
  }
};
