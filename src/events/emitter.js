/**
 * Async event emitter with middleware support
 */

class AsyncEventEmitter {
  constructor() {
    this._handlers = new Map();
    this._middleware = [];
    this._onceHandlers = new Map();
  }

  use(middleware) {
    this._middleware.push(middleware);
    return this;
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
    if (this._handlers.has(event)) {
      const handlers = this._handlers.get(event).filter((h) => h !== handler);
      this._handlers.set(event, handlers);
    }
    return this;
  }

  async emit(event, data) {
    let processedData = { ...data, _event: event, _timestamp: Date.now() };

    // Run middleware chain
    for (const mw of this._middleware) {
      processedData = await mw(processedData);
      if (processedData === null) return []; // middleware can cancel
    }

    const results = [];

    // Run regular handlers
    const handlers = this._handlers.get(event) || [];
    for (const handler of handlers) {
      results.push(await handler(processedData));
    }

    // Run and remove once handlers
    const onceHandlers = this._onceHandlers.get(event) || [];
    for (const handler of onceHandlers) {
      results.push(await handler(processedData));
    }
    this._onceHandlers.delete(event);

    return results;
  }

  listenerCount(event) {
    const regular = (this._handlers.get(event) || []).length;
    const once = (this._onceHandlers.get(event) || []).length;
    return regular + once;
  }

  removeAllListeners(event) {
    if (event) {
      this._handlers.delete(event);
      this._onceHandlers.delete(event);
    } else {
      this._handlers.clear();
      this._onceHandlers.clear();
    }
    return this;
  }
}

class TaskQueue {
  constructor(concurrency = 3) {
    this._concurrency = concurrency;
    this._queue = [];
    this._running = 0;
    this._results = [];
    this._emitter = new AsyncEventEmitter();
  }

  get emitter() {
    return this._emitter;
  }

  add(taskFn, priority = 0) {
    this._queue.push({ fn: taskFn, priority });
    this._queue.sort((a, b) => b.priority - a.priority);
    return this;
  }

  async run() {
    return new Promise((resolve, reject) => {
      const tryRunNext = () => {
        while (this._running < this._concurrency && this._queue.length > 0) {
          const task = this._queue.shift();
          this._running++;

          Promise.resolve()
            .then(() => task.fn())
            .then((result) => {
              this._results.push({ status: 'fulfilled', value: result });
              this._emitter.emit('taskComplete', { result });
            })
            .catch((error) => {
              this._results.push({ status: 'rejected', reason: error.message });
              this._emitter.emit('taskError', { error: error.message });
            })
            .finally(() => {
              this._running--;
              if (this._queue.length === 0 && this._running === 0) {
                this._emitter.emit('allComplete', { results: this._results });
                resolve(this._results);
              } else {
                tryRunNext();
              }
            });
        }
      };

      if (this._queue.length === 0) {
        resolve([]);
        return;
      }

      tryRunNext();
    });
  }
}

module.exports = { AsyncEventEmitter, TaskQueue };