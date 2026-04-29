import { test } from 'node:test';
import assert from 'node:assert/strict';

test('handles task failures gracefully', async (t) => {
  const errors = [];
  
  const runTask = async (task) => {
    try {
      await task();
    } catch (err) {
      errors.push(err);
    }
  };

  const failingTask = async () => {
    throw new Error('Task failed');
  };

  await runTask(failingTask);

  assert.strictEqual(errors.length, 1);
  assert.strictEqual(errors[0].message, 'Task failed');
});