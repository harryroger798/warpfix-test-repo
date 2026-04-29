const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { DataPipeline, deepMerge, flattenObject, unflattenObject } = require('../src/data/transform');

describe('DataPipeline', () => {
  it('chains filter and map', () => {
    const result = DataPipeline.from([1, 2, 3, 4, 5, 6])
      .filter((x) => x % 2 === 0)
      .map((x) => x * 10)
      .execute();
    assert.deepStrictEqual(result, [20, 40, 60]);
  });

  it('sorts with custom comparator', () => {
    const result = DataPipeline.from([{ name: 'Charlie', age: 30 }, { name: 'Alice', age: 25 }, { name: 'Bob', age: 35 }])
      .sort((a, b) => a.age - b.age)
      .execute();
    assert.strictEqual(result[0].name, 'Alice');
    assert.strictEqual(result[2].name, 'Bob');
  });

  it('groups by key', () => {
    const result = DataPipeline.from([
      { dept: 'eng', name: 'Alice' },
      { dept: 'sales', name: 'Bob' },
      { dept: 'eng', name: 'Charlie' },
    ])
      .groupBy((item) => item.dept)
      .execute();
    assert.strictEqual(result.eng.length, 2);
    assert.strictEqual(result.sales.length, 1);
  });

  it('removes duplicates', () => {
    const result = DataPipeline.from([1, 2, 2, 3, 3, 3])
      .distinct()
      .execute();
    assert.deepStrictEqual(result, [1, 2, 3]);
  });

  it('handles complex chained operations', () => {
    const users = [
      { name: 'Alice', score: 85 },
      { name: 'Bob', score: 92 },
      { name: 'Charlie', score: 78 },
      { name: 'Diana', score: 95 },
      { name: 'Eve', score: 88 },
    ];
    const result = DataPipeline.from(users)
      .filter((u) => u.score >= 80)
      .sort((a, b) => b.score - a.score)
      .map((u) => `${u.name}: ${u.score}`)
      .execute();
    assert.deepStrictEqual(result, ['Diana: 95', 'Bob: 92', 'Eve: 88', 'Alice: 85']);
  });
});

describe('deepMerge', () => {
  it('merges nested objects', () => {
    const result = deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 3, d: 4 } });
    assert.deepStrictEqual(result, { a: { b: 1, c: 3, d: 4 } });
  });

  it('overwrites non-objects', () => {
    const result = deepMerge({ a: 1 }, { a: 2, b: 3 });
    assert.deepStrictEqual(result, { a: 2, b: 3 });
  });

  it('handles multiple sources', () => {
    const result = deepMerge({}, { a: 1 }, { b: 2 }, { c: 3 });
    assert.deepStrictEqual(result, { a: 1, b: 2, c: 3 });
  });
});

describe('flattenObject / unflattenObject', () => {
  it('flattens nested object', () => {
    const result = flattenObject({ a: { b: { c: 1 }, d: 2 }, e: 3 });
    assert.deepStrictEqual(result, { 'a.b.c': 1, 'a.d': 2, 'e': 3 });
  });

  it('unflattens dotted keys', () => {
    const result = unflattenObject({ 'a.b.c': 1, 'a.d': 2, 'e': 3 });
    assert.deepStrictEqual(result, { a: { b: { c: 1 }, d: 2 }, e: 3 });
  });

  it('roundtrips correctly', () => {
    const original = { config: { db: { host: 'localhost', port: 5432 }, redis: { url: 'redis://localhost' } } };
    assert.deepStrictEqual(unflattenObject(flattenObject(original)), original);
  });
});
