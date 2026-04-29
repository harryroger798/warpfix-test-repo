import { test } from 'node:test';
import assert from 'node:assert/strict';

test('handles task failures gracefully', async (t) => {
  const results = [];
  const errors = [];

  const processTask = async (fn) => {
    try {
      const result = await fn();
      results.push(result);
    } catch (err) {
      errors.push(err.message);
    }
  };

  await processTask(async () => {
    throw new Error('task error');
  });

  assert.strictEqual(errors.length, 1);
  assert.strictEqual(errors[0], 'task error');
  assert.strictEqual(results.length, 0);
});