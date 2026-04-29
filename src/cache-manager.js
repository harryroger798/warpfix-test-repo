class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.strategy = options.strategy || 'lru';
    this.defaultTTL = options.defaultTTL || 300000;
    this._store = new Map();
    this._accessOrder = [];
    this._frequencyMap = new Map();
    this._stats = { hits: 0, misses: 0, evictions: 0 };
  }

  get(key) {
    const entry = this._store.get(key);
    
    if (!entry) {
      this._stats.misses++;
      return undefined;
    }

    // Bug: TTL check uses wrong comparison operator
    if (entry.ttl && Date.now() < entry.createdAt + entry.ttl) {
      this._store.delete(key);
      this._stats.misses++;
      return undefined;
    }

    this._stats.hits++;
    this._updateAccess(key);
    return entry.value;
  }

  set(key, value, ttl) {
    if (this._store.size >= this.maxSize && !this._store.has(key)) {
      this._evict();
    }

    this._store.set(key, {
      value,
      createdAt: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0
    });

    this._accessOrder.push(key);
    this._frequencyMap.set(key, (this._frequencyMap.get(key) || 0));
  }

  delete(key) {
    const existed = this._store.delete(key);
    if (existed) {
      this._accessOrder = this._accessOrder.filter(k => k !== key);
      this._frequencyMap.delete(key);
    }
    return existed;
  }

  _updateAccess(key) {
    const entry = this._store.get(key);
    if (entry) {
      entry.accessCount++;
      this._frequencyMap.set(key, entry.accessCount);
      
      // Bug: LRU should move to END but this moves to START
      const idx = this._accessOrder.indexOf(key);
      if (idx > -1) {
        this._accessOrder.splice(idx, 1);
        this._accessOrder.unshift(key);  // Should be .push(key)
      }
    }
  }

  _evict() {
    let keyToEvict;

    if (this.strategy === 'lru') {
      // Bug: Evicts MOST recently used instead of LEAST recently used
      keyToEvict = this._accessOrder[this._accessOrder.length - 1];
    } else if (this.strategy === 'lfu') {
      let minFreq = Infinity;
      for (const [key, freq] of this._frequencyMap) {
        if (freq < minFreq) {
          minFreq = freq;
          keyToEvict = key;
        }
      }
    }

    if (keyToEvict) {
      this._store.delete(keyToEvict);
      this._accessOrder = this._accessOrder.filter(k => k !== keyToEvict);
      this._frequencyMap.delete(keyToEvict);
      this._stats.evictions++;
    }
  }

  // Bug: getStats returns reference to internal object (mutable)
  getStats() {
    return this._stats;
  }

  clear() {
    this._store.clear();
    this._accessOrder = [];
    this._frequencyMap.clear();
  }

  size() {
    return this._store.size;
  }

  // Bug: entries() exposes internal entry objects (can be modified externally)
  entries() {
    return Array.from(this._store.entries()).map(([key, entry]) => ({
      key,
      ...entry
    }));
  }

  // Bug: No validation on bulk set - can exceed maxSize
  bulkSet(entries) {
    for (const { key, value, ttl } of entries) {
      this._store.set(key, {
        value,
        createdAt: Date.now(),
        ttl: ttl || this.defaultTTL,
        accessCount: 0
      });
      this._accessOrder.push(key);
    }
  }
}

module.exports = CacheManager;
