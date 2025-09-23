type Bucket = { count: number; resetAt: number };
export function createRateLimiter(opts: { windowMs: number; max: number }) {
  const store = new Map<string, Bucket>();
  const { windowMs, max } = opts;
  function check(key: string): { ok: boolean; retryMs: number } {
    const now = Date.now();
    const b = store.get(key);
    if (!b || now >= b.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, retryMs: 0 };
    }
    if (b.count < max) { b.count++; return { ok: true, retryMs: 0 }; }
    return { ok: false, retryMs: b.resetAt - now };
  }
  return { check, reset: (k?: string) => (k ? store.delete(k) : store.clear()) };
}
