import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('task runner', () => {
  it('handles task failures gracefully', async () => {
    const runTask = async (task) => {
      try {
        await task();
      } catch (err) {
        return { success: false, error: err.message };
      }
      return { success: true };
    };

    const failingTask = async () => {
      throw new Error('Task failed');
    };

    const result = await runTask(failingTask);
    assert.equal(result.success, false);
    assert.equal(result.error, 'Task failed');
  });
});