// src/db/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Optional logging controls via env:
 *  PRISMA_LOG=query (or info|warn|error)
 *  PRISMA_LOG_PRETTY=true  -> compact single-line query logs
 */
const logLevels = (process.env.PRISMA_LOG || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean) as Prisma.LogLevel[];

type GlobalWithPrisma = typeof globalThis & {
  __prisma?: PrismaClient;
};

const g = globalThis as GlobalWithPrisma;

function makeClient() {
  const client = new PrismaClient({
    log: logLevels.length ? logLevels : ['warn', 'error'],
  });

  // Pretty one-liners for query logs (when PRISMA_LOG includes "query")
  if (logLevels.includes('query')) {
    client.$on('query', (e) => {
      if (process.env.PRISMA_LOG_PRETTY === 'true') {
        // Compact: model op (duration ms) — query
        const model = (e as any).model ?? '';
        const op = (e as any).action ?? '';
        console.log(
          `[prisma] ${model} ${op} (${e.duration}ms) — ${e.query.replace(/\s+/g, ' ')}`
        );
      } else {
        console.log('[prisma:query]', e);
      }
    });
  }
  client.$on('error', (e) => console.error('[prisma:error]', e));
  client.$on('warn', (e) => console.warn('[prisma:warn]', e));

  return client;
}

// Reuse a single instance in dev to avoid re-creating on hot reloads
export const prisma: PrismaClient = g.__prisma ?? makeClient();
if (process.env.NODE_ENV !== 'production') {
  g.__prisma = prisma;
}

// Graceful shutdown (recommended when running long-lived bots/workers)
let disconnected = false;
async function disconnect() {
  if (disconnected) return;
  disconnected = true;
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.warn('[prisma] disconnect error:', (err as Error).message);
  }
}

process.once('beforeExit', disconnect);
process.once('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});
process.once('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});
