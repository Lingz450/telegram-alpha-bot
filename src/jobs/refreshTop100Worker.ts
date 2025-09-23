// src/jobs/refreshTop100Worker.ts
import type { Cfg } from '../config';
import { getWorkingExchange, computeTop100 } from '../exchange/client';

export function startTop100RefreshLoop(cfg: Cfg, log: any) {
  let backoffMs = 60_000;            // start at 1 minute
  const backoffMax = 15 * 60_000;    // cap at 15 minutes
  const successInterval = 60 * 60_000; // refresh hourly on success

  async function runOnce() {
    try {
      // Pick the first reachable exchange from your priority list (EXCHANGES in .env)
      const { id, ex } = await getWorkingExchange(cfg);

      const list = await computeTop100(ex, cfg.UNIVERSE_BASE, cfg.UNIVERSE_LIMIT);
      log.info({ count: list.length, ex: id }, 'Top100 refreshed');

      // On success, reset to the longer interval
      backoffMs = successInterval;
    } catch (e: any) {
      log.warn(
        { err: e?.message || String(e) },
        'Top100 refresh failed, will retry with backoff'
      );
      // Exponential backoff between attempts when failing
      backoffMs = Math.min(backoffMs * 2, backoffMax);
    }
  }

  async function loop() {
    await runOnce();
    setTimeout(loop, backoffMs);
  }

  // kick it off
  loop();
}
