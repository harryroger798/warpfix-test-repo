/**
 * LRU Cache with TTL support and eviction callbacks
 */

class LRUCache {
  constructor(capacity, options = {}) {
    this._capacity = capacity;
    this._ttl = options.ttl || null;
    this._onEvict = options.onEvict || null;
    this._map = new Map();
    this._stats = { hits: 0, misses: 0, evictions: 0 };
  }

  get(key) {
    if (!this._map.has(key)) {
      this._stats.misses++;
      return undefined;
    }

    const entry = this._map.get(key);

    // Check TTL
    if (this._ttl && Date.now() - entry.createdAt > this._ttl) {
      this._map.delete(key);
      this._stats.misses++;
      return undefined;
    }

    // BUG: Does NOT move to end (most recently used) - breaks LRU ordering
    // Missing: this._map.delete(key); this._map.set(key, ...)
    // Just updates lastAccess but doesn't reorder in the Map
    entry.lastAccess = Date.now();
    this._stats.hits++;
    return entry.value;
  }

  set(key, value) {
    if (this._map.has(key)) {
      this._map.delete(key);
    } else if (this._map.size >= this._capacity) {
      // BUG: Evicts LAST entry (most recently used) instead of FIRST (least recently used)
      const entries = [...this._map.entries()];
      const [evictedKey, evictedEntry] = entries[entries.length - 1];
      this._map.delete(evictedKey);
      this._stats.evictions++;
      if (this._onEvict) {
        this._onEvict(evictedKey, evictedEntry.value);
      }
    }

    this._map.set(key, {
      value,
      createdAt: Date.now(),
      lastAccess: Date.now(),
    });
  }

  has(key) {
    if (!this._map.has(key)) return false;
    if (this._ttl) {
      const entry = this._map.get(key);
      if (Date.now() - entry.createdAt > this._ttl) {
        this._map.delete(key);
        return false;
      }
    }
    return true;
  }

  delete(key) {
    return this._map.delete(key);
  }

  clear() {
    this._map.clear();
  }

  get size() {
    return this._map.size;
  }

  get stats() {
    const total = this._stats.hits + this._stats.misses;
    return {
      ...this._stats,
      hitRate: total > 0 ? this._stats.hits / total : 0,
    };
  }

  entries() {
    return [...this._map.entries()].map(([key, entry]) => [key, entry.value]);
  }
}

module.exports = { LRUCache };
