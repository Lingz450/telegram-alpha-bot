// src/config.ts
import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10).transform((s) => s.trim()),
  ADMIN_IDS: z.string().default(''),              // comma-separated user IDs
  ADMIN_CHAT_IDS: z.string().default(''),         // comma-separated chat IDs (optional)
  DATABASE_URL: z.string().optional(),
  EXCHANGE: z.enum(['binance', 'bybit', 'okx']).default('binance'),
  EXCHANGES: z.string().optional(),               // optional priority list: "okx,binance,bybit"
  UNIVERSE_BASE: z.string().default('USDT').transform((s) => s.toUpperCase()),
  UNIVERSE_LIMIT: z.coerce.number().int().positive().default(500), // default raised to 500
  CHROME_PATH: z.string().optional(),
  ALERT_TICK_MS: z.coerce.number().int().positive().optional(),    // alert loop tick override (ms)
});

export type Cfg = z.infer<typeof Env>;

export const loadConfig = (): Cfg & {
  ADMIN_SET: Set<string>;
  ADMIN_CHAT_SET: Set<string>;
  EXCHANGES_LIST: string[];                       // normalized list from EXCHANGES (if any)
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
  (cfg.EXCHANGES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((id) => { if (!seen.has(id)) { seen.add(id); EXCHANGES_LIST.push(id); } });

  return { ...cfg, ADMIN_SET, ADMIN_CHAT_SET, EXCHANGES_LIST };
};
