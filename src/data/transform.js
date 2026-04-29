/**
 * Data transformation pipeline with chaining support
 */

const { mergeSort } = require('../utils/math');

class DataPipeline {
  constructor(data) {
    this._data = Array.isArray(data) ? [...data] : [];
    this._steps = [];
  }

  static from(data) {
    return new DataPipeline(data);
  }

  filter(predicate) {
    this._steps.push({ type: 'filter', fn: predicate });
    return this;
  }

  map(transform) {
    this._steps.push({ type: 'map', fn: transform });
    return this;
  }

  sort(comparator) {
    this._steps.push({ type: 'sort', fn: comparator });
    return this;
  }

  groupBy(keyFn) {
    this._steps.push({ type: 'groupBy', fn: keyFn });
    return this;
  }

  distinct(keyFn = (x) => x) {
    this._steps.push({ type: 'distinct', fn: keyFn });
    return this;
  }

  execute() {
    let result = [...this._data];

    for (const step of this._steps) {
      switch (step.type) {
        case 'filter':
          result = result.filter(step.fn);
          break;
        case 'map':
          result = result.map(step.fn);
          break;
        case 'sort':
          result = mergeSort(result, step.fn);
          break;
        case 'groupBy': {
          const groups = {};
          for (const item of result) {
            const key = step.fn(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          return groups;
        }
        case 'distinct': {
          const seen = new Set();
          result = result.filter((item) => {
            const key = step.fn(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          break;
        }
      }
    }

    return result;
  }
}

function deepMerge(target, ...sources) {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        // Recursively merge nested objects instead of overwriting
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function unflattenObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

module.exports = { DataPipeline, deepMerge, flattenObject, unflattenObject };