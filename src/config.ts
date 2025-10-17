// src/config.ts
import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10).transform((s) => s.trim()),

  // Admins (comma-separated IDs)
  ADMIN_IDS: z.string().default(''),
  ADMIN_CHAT_IDS: z.string().default(''),

  // Optional database URL (Prisma / Postgres)
  DATABASE_URL: z.string().optional(),

  // Exchange setup
  EXCHANGE: z.enum(['binance', 'bybit', 'okx']).default('binance').optional(),
  EXCHANGES: z.string().optional(), // multiple exchanges separated by commas

  // Trading universe
  UNIVERSE_BASE: z.string().default('USDT').transform((s) => s.toUpperCase()),
  UNIVERSE_LIMIT: z.coerce.number().int().positive().default(500),

  // Optional Chrome path (for Puppeteer chart screenshots)
  CHROME_PATH: z.string().optional(),

  // Price alert frequency (ms)
  ALERT_TICK_MS: z.coerce.number().int().positive().optional(),

  // 👇 New additions
  AUTO_UPDATE_CHAT_ID: z.string().optional(),          // chat ID for market pulse
  AUTO_UPDATE_INTERVAL_MS: z.coerce.number().default(300000), // default 5 min
  CHAT_MODE_ENABLED: z.coerce.boolean().default(true), // free chat replies toggle
});

export type Cfg = z.infer<typeof Env>;

/**
 * Loads config and normalizes values.
 * Returns parsed env vars + helper sets for admin and exchange lists.
 */
export const loadConfig = (): Cfg & {
  ADMIN_SET: Set<string>;
  ADMIN_CHAT_SET: Set<string>;
  EXCHANGES_LIST: string[];
} => {
  const cfg = Env.parse(process.env);

  const ADMIN_SET = new Set(
    cfg.ADMIN_IDS.split(',').map((s) => s.trim()).filter(Boolean)
  );

  const ADMIN_CHAT_SET = new Set(
    cfg.ADMIN_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean)
  );

  // Normalize EXCHANGES (keep unique order)
  const EXCHANGES_LIST: string[] = [];
  const seen = new Set<string>();

  (cfg.EXCHANGES || cfg.EXCHANGE || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((id) => {
      if (!seen.has(id)) {
        seen.add(id);
        EXCHANGES_LIST.push(id);
      }
    });

  return { ...cfg, ADMIN_SET, ADMIN_CHAT_SET, EXCHANGES_LIST };
};
