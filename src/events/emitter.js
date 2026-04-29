/**
 * Async event system with middleware and task queue
 */

class AsyncEventEmitter {
  constructor() {
    this._handlers = new Map();
    this._onceHandlers = new Map();
    this._middleware = [];
  }

  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
    return this;
  }

  once(event, handler) {
    if (!this._onceHandlers.has(event)) {
      this._onceHandlers.set(event, []);
    }
    this._onceHandlers.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
    return this;
  }

  async emit(event, data) {
    let processedData = data;

    for (const mw of this._middleware) {
      processedData = await mw(processedData);
      if (processedData === null) return;
    }

    const handlers = this._handlers.get(event) || [];
    const onceHandlers = this._onceHandlers.get(event) || [];

    for (const handler of handlers) {
      await handler(processedData);
    }

    for (const handler of onceHandlers) {
      await handler(processedData);
    }

    this._onceHandlers.delete(event);
  }

  use(middleware) {
    this._middleware.push(middleware);
    return this;
  }

  listenerCount(event) {
    const regular = (this._handlers.get(event) || []).length;
    const once = (this._onceHandlers.get(event) || []).length;
    return regular + once;
  }
}

class TaskQueue {
  constructor(concurrency = 3) {
    this._concurrency = concurrency;
    this._queue = [];
    this._running = 0;
    this._results = [];
    this._resolve = null;
    this._totalAdded = 0;
  }

  add(task, priority = 0) {
    this._queue.push({ task, priority, index: this._totalAdded++ });
    return this;
  }

  async run() {
    if (this._queue.length === 0) return [];

    this._queue.sort((a, b) => b.priority - a.priority);
    this._results = new Array(this._totalAdded);

    return new Promise((resolve) => {
      this._resolve = resolve;
      for (let i = 0; i < this._concurrency && this._queue.length > 0; i++) {
        this._runNext();
      }
    });
  }

  _runNext() {
    if (this._queue.length === 0) {
      if (this._running === 0) {
        this._resolve(this._results);
      }
      return;
    }

    const { task, index } = this._queue.shift();
    this._running++;

    task()
      .then((value) => {
        this._results[index] = { status: 'fulfilled', value };
      })
      .catch((reason) => {
        this._results[index] = { status: 'rejected', reason };
      })
      .finally(() => {
        this._running--;
        this._runNext();
      });
  }
}

module.exports = { AsyncEventEmitter, TaskQueue };