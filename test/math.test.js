const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { binarySearch, mergeSort, matrixMultiply, fibonacci, gcd, lcm } = require('../src/utils/math');

describe('binarySearch', () => {
  it('finds element in sorted array', () => {
    assert.strictEqual(binarySearch([1, 3, 5, 7, 9, 11], 7), 3);
  });

  it('returns -1 for missing element', () => {
    assert.strictEqual(binarySearch([1, 3, 5, 7, 9], 4), -1);
  });

  it('handles single element array', () => {
    assert.strictEqual(binarySearch([42], 42), 0);
  });

  it('handles empty array', () => {
    assert.strictEqual(binarySearch([], 1), -1);
  });

  it('finds first element', () => {
    assert.strictEqual(binarySearch([1, 2, 3, 4, 5], 1), 0);
  });

  it('finds last element', () => {
    assert.strictEqual(binarySearch([1, 2, 3, 4, 5], 5), 4);
  });
});

describe('mergeSort', () => {
  it('sorts numbers ascending', () => {
    assert.deepStrictEqual(mergeSort([5, 3, 8, 1, 9, 2]), [1, 2, 3, 5, 8, 9]);
  });

  it('sorts with custom comparator (descending)', () => {
    assert.deepStrictEqual(mergeSort([5, 3, 8, 1], (a, b) => b - a), [8, 5, 3, 1]);
  });

  it('handles already sorted array', () => {
    assert.deepStrictEqual(mergeSort([1, 2, 3]), [1, 2, 3]);
  });

  it('handles empty array', () => {
    assert.deepStrictEqual(mergeSort([]), []);
  });

  it('does not mutate original array', () => {
    const original = [3, 1, 2];
    mergeSort(original);
    assert.deepStrictEqual(original, [3, 1, 2]);
  });

  it('handles duplicates', () => {
    assert.deepStrictEqual(mergeSort([3, 1, 3, 2, 1]), [1, 1, 2, 3, 3]);
  });
});

describe('matrixMultiply', () => {
  it('multiplies 2x2 matrices', () => {
    const a = [[1, 2], [3, 4]];
    const b = [[5, 6], [7, 8]];
    assert.deepStrictEqual(matrixMultiply(a, b), [[19, 22], [43, 50]]);
  });

  it('multiplies non-square matrices', () => {
    const a = [[1, 2, 3]];
    const b = [[4], [5], [6]];
    assert.deepStrictEqual(matrixMultiply(a, b), [[32]]);
  });

  it('throws on incompatible dimensions', () => {
    assert.throws(() => matrixMultiply([[1, 2]], [[3, 4]]), /incompatible/i);
  });

  it('handles identity matrix', () => {
    const a = [[1, 0], [0, 1]];
    const b = [[5, 6], [7, 8]];
    assert.deepStrictEqual(matrixMultiply(a, b), [[5, 6], [7, 8]]);
  });
});

describe('fibonacci', () => {
  it('returns 0 for n=0', () => {
    assert.strictEqual(fibonacci(0), 0);
  });

  it('returns 1 for n=1', () => {
    assert.strictEqual(fibonacci(1), 1);
  });

  it('computes fib(10) = 55', () => {
    assert.strictEqual(fibonacci(10), 55);
  });

  it('handles large values with memoization', () => {
    assert.strictEqual(fibonacci(50), 12586269025);
  });
});

describe('gcd and lcm', () => {
  it('gcd(12, 8) = 4', () => {
    assert.strictEqual(gcd(12, 8), 4);
  });

  it('gcd handles negative numbers', () => {
    assert.strictEqual(gcd(-12, 8), 4);
  });

  it('lcm(4, 6) = 12', () => {
    assert.strictEqual(lcm(4, 6), 12);
  });
});
