// src/core/ttlCache.ts
export class TTLCache<K, V> {
  private map = new Map<K, { v: V; exp: number }>();
  constructor(private readonly ttlMs: number) {}

  get(key: K): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return;
    if (Date.now() > hit.exp) {
      this.map.delete(key);
      return;
    }
    return hit.v;
  }

  set(key: K, val: V) {
    this.map.set(key, { v: val, exp: Date.now() + this.ttlMs });
  }

  clear() {
    this.map.clear();
  }
}
