const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { LRUCache } = require('../src/cache/lru');

describe('LRUCache', () => {
  it('basic get/set', () => {
    const cache = new LRUCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    assert.strictEqual(cache.get('a'), 1);
    assert.strictEqual(cache.get('b'), 2);
  });

  it('evicts least recently used', () => {
    const cache = new LRUCache(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // should evict 'a'
    assert.strictEqual(cache.get('a'), undefined);
    assert.strictEqual(cache.get('b'), 2);
    assert.strictEqual(cache.get('c'), 3);
  });

  it('access refreshes position', () => {
    const cache = new LRUCache(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // refresh 'a'
    cache.set('c', 3); // should evict 'b' not 'a'
    assert.strictEqual(cache.get('a'), 1);
    assert.strictEqual(cache.get('b'), undefined);
  });

  it('tracks stats', () => {
    const cache = new LRUCache(2);
    cache.set('a', 1);
    cache.get('a'); // hit
    cache.get('b'); // miss
    const stats = cache.stats;
    assert.strictEqual(stats.hits, 1);
    assert.strictEqual(stats.misses, 1);
    assert.strictEqual(stats.hitRate, 0.5);
  });

  it('eviction callback fires', () => {
    let evicted = null;
    const cache = new LRUCache(1, { onEvict: (k, v) => { evicted = { k, v }; } });
    cache.set('a', 100);
    cache.set('b', 200);
    assert.deepStrictEqual(evicted, { k: 'a', v: 100 });
  });

  it('TTL expiration', async () => {
    const cache = new LRUCache(10, { ttl: 50 });
    cache.set('a', 1);
    assert.strictEqual(cache.get('a'), 1);
    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(cache.get('a'), undefined);
  });

  it('has checks existence and TTL', async () => {
    const cache = new LRUCache(10, { ttl: 50 });
    cache.set('a', 1);
    assert.strictEqual(cache.has('a'), true);
    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(cache.has('a'), false);
  });

  it('handles update of existing key', () => {
    const cache = new LRUCache(2);
    cache.set('a', 1);
    cache.set('a', 10);
    assert.strictEqual(cache.get('a'), 10);
    assert.strictEqual(cache.size, 1);
  });
});
