const { EventEmitter } = require('events');
const { Transform, pipeline } = require('stream');

class AsyncBatchProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.batchSize = options.batchSize || 100;
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 30000;
    this.concurrency = options.concurrency || 5;
    this._queue = [];
    this._processing = false;
    this._running = 0;
    this._deadLetterQueue = [];
    this._processors = [];
    this._stats = { processed: 0, failed: 0, retried: 0 };
  }

  addProcessor(fn) {
    this._processors.push(fn);
    return this;
  }

  async enqueue(items) {
    if (!Array.isArray(items)) items = [items];
    this._queue.push(...items);
    
    if (!this._processing) {
      this._processing = true;
      await this._processBatches();
    }
  }

  async _processBatches() {
    while (this._queue.length > 0) {
      const batch = this._queue.splice(0, this.batchSize);
      
      const promises = batch.map(item => this._processItem(item));
      await Promise.allSettled(promises);
    }
    this._processing = false;
  }

  async _processItem(item, retryCount = 0) {
    // Bug: Race condition - _running not properly synchronized
    this._running++;
    
    try {
      let result = item;
      
      for (const processor of this._processors) {
        result = await Promise.race([
          processor(result),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Processor timeout')), this.timeout)
          )
        ]);
      }

      this._stats.processed++;
      // Bug: Decrement happens AFTER _runNext, causing concurrency overshoot
      this._runNext();
      this._running--;
      this.emit('processed', { item, result });
      return result;

    } catch (error) {
      this._running--;

      if (retryCount < this.maxRetries) {
        this._stats.retried++;
        // Bug: No exponential backoff - immediate retry floods the system
        return this._processItem(item, retryCount + 1);
      }

      this._stats.failed++;
      this._deadLetterQueue.push({ item, error: error.message, retries: retryCount });
      this.emit('failed', { item, error });
    }
  }

  _runNext() {
    if (this._queue.length > 0 && this._running < this.concurrency) {
      const next = this._queue.shift();
      this._processItem(next);
    }
  }

  getStats() {
    return { ...this._stats, queueLength: this._queue.length, deadLetters: this._deadLetterQueue.length };
  }

  getDLQ() {
    return [...this._deadLetterQueue];
  }
}

// Bug: Transform stream doesn't handle backpressure correctly
class DataTransformStream extends Transform {
  constructor(transformFn, options = {}) {
    super({ ...options, objectMode: true });
    this._transformFn = transformFn;
    this._buffer = [];
    this._flushInterval = options.flushInterval || 1000;
  }

  _transform(chunk, encoding, callback) {
    this._buffer.push(chunk);
    
    // Bug: Buffer never actually flushes in batches - processes one at a time
    if (this._buffer.length >= 10) {
      const batch = this._buffer.splice(0);
      try {
        const results = batch.map(item => this._transformFn(item));
        results.forEach(r => this.push(r));
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      try {
        this.push(this._transformFn(chunk));
        callback();
      } catch (err) {
        callback(err);
      }
    }
  }

  // Bug: _flush doesn't process remaining buffer items
  _flush(callback) {
    callback();
  }
}

module.exports = { AsyncBatchProcessor, DataTransformStream };
