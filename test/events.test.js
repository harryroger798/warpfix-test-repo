const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { AsyncEventEmitter, TaskQueue } = require('../src/events/emitter');

describe('AsyncEventEmitter', () => {
  it('emits events to handlers', async () => {
    const emitter = new AsyncEventEmitter();
    let received = null;
    emitter.on('test', (data) => { received = data; });
    await emitter.emit('test', { value: 42 });
    assert.strictEqual(received.value, 42);
  });

  it('supports multiple handlers', async () => {
    const emitter = new AsyncEventEmitter();
    const results = [];
    emitter.on('test', () => results.push('a'));
    emitter.on('test', () => results.push('b'));
    await emitter.emit('test', {});
    assert.deepStrictEqual(results, ['a', 'b']);
  });

  it('once handlers fire only once', async () => {
    const emitter = new AsyncEventEmitter();
    let count = 0;
    emitter.once('test', () => { count++; });
    await emitter.emit('test', {});
    await emitter.emit('test', {});
    assert.strictEqual(count, 1);
  });

  it('middleware can transform data', async () => {
    const emitter = new AsyncEventEmitter();
    emitter.use(async (data) => ({ ...data, enriched: true }));
    let received = null;
    emitter.on('test', (data) => { received = data; });
    await emitter.emit('test', { value: 1 });
    assert.strictEqual(received.enriched, true);
  });

  it('middleware can cancel event', async () => {
    const emitter = new AsyncEventEmitter();
    emitter.use(async () => null);
    let called = false;
    emitter.on('test', () => { called = true; });
    await emitter.emit('test', {});
    assert.strictEqual(called, false);
  });

  it('off removes specific handler', async () => {
    const emitter = new AsyncEventEmitter();
    const results = [];
    const handlerA = () => results.push('a');
    const handlerB = () => results.push('b');
    emitter.on('test', handlerA);
    emitter.on('test', handlerB);
    emitter.off('test', handlerA);
    await emitter.emit('test', {});
    assert.deepStrictEqual(results, ['b']);
  });

  it('listenerCount returns correct count', () => {
    const emitter = new AsyncEventEmitter();
    emitter.on('test', () => {});
    emitter.on('test', () => {});
    emitter.once('test', () => {});
    assert.strictEqual(emitter.listenerCount('test'), 3);
  });
});

describe('TaskQueue', () => {
  it('runs tasks with concurrency limit', async () => {
    const queue = new TaskQueue(2);
    const order = [];

    queue.add(async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push('a');
      return 'a';
    });
    queue.add(async () => {
      await new Promise((r) => setTimeout(r, 10));
      order.push('b');
      return 'b';
    });
    queue.add(async () => {
      order.push('c');
      return 'c';
    });

    const results = await queue.run();
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results.filter((r) => r.status === 'fulfilled').length, 3);
  });

  it('handles task failures gracefully', async () => {
    const queue = new TaskQueue(1);
    queue.add(async () => { throw new Error('boom'); });
    queue.add(async () => 'ok');

    const results = await queue.run();
    assert.strictEqual(results[0].status, 'rejected');
    assert.strictEqual(results[1].status, 'fulfilled');
  });

  it('respects priority ordering', async () => {
    const queue = new TaskQueue(1);
    const order = [];

    queue.add(async () => { order.push('low'); }, 1);
    queue.add(async () => { order.push('high'); }, 10);
    queue.add(async () => { order.push('mid'); }, 5);

    await queue.run();
    assert.strictEqual(order[0], 'high');
    assert.strictEqual(order[1], 'mid');
    assert.strictEqual(order[2], 'low');
  });
});
