/**
 * Main entry point - re-exports all modules
 */

const { binarySearch, mergeSort, matrixMultiply, fibonacci, gcd, lcm } = require('./utils/math');
const { parseEmail, parseURL, camelToSnake, snakeToCamel, truncate, levenshteinDistance, tokenize } = require('./utils/string');
const { DataPipeline, deepMerge, flattenObject, unflattenObject } = require('./data/transform');
const { AsyncEventEmitter, TaskQueue } = require('./events/emitter');
const { LRUCache } = require('./cache/lru');

module.exports = {
  // Math
  binarySearch, mergeSort, matrixMultiply, fibonacci, gcd, lcm,
  // String
  parseEmail, parseURL, camelToSnake, snakeToCamel, truncate, levenshteinDistance, tokenize,
  // Data
  DataPipeline, deepMerge, flattenObject, unflattenObject,
  // Events
  AsyncEventEmitter, TaskQueue,
  // Cache
  LRUCache,
};
