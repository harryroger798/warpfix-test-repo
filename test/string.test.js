const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseEmail, parseURL, camelToSnake, snakeToCamel, truncate, levenshteinDistance, tokenize } = require('../src/utils/string');

describe('parseEmail', () => {
  it('parses valid email', () => {
    const result = parseEmail('user@example.com');
    assert.deepStrictEqual(result, { local: 'user', domain: 'example', tld: 'com' });
  });

  it('parses email with dots and plus', () => {
    const result = parseEmail('first.last+tag@sub.domain.org');
    assert.deepStrictEqual(result, { local: 'first.last+tag', domain: 'sub.domain', tld: 'org' });
  });

  it('returns null for invalid email', () => {
    assert.strictEqual(parseEmail('not-an-email'), null);
  });
});

describe('parseURL', () => {
  it('parses full URL', () => {
    const result = parseURL('https://example.com:8080/path?q=1#frag');
    assert.deepStrictEqual(result, {
      protocol: 'https', host: 'example.com', port: 8080,
      path: '/path', query: 'q=1', fragment: 'frag',
    });
  });

  it('parses URL without port', () => {
    const result = parseURL('http://example.com/');
    assert.strictEqual(result.port, null);
    assert.strictEqual(result.host, 'example.com');
  });

  it('returns null for invalid URL', () => {
    assert.strictEqual(parseURL('not a url'), null);
  });
});

describe('camelToSnake / snakeToCamel', () => {
  it('converts camelCase to snake_case', () => {
    assert.strictEqual(camelToSnake('myVariableName'), 'my_variable_name');
  });

  it('converts snake_case to camelCase', () => {
    assert.strictEqual(snakeToCamel('my_variable_name'), 'myVariableName');
  });

  it('handles single word', () => {
    assert.strictEqual(camelToSnake('hello'), 'hello');
    assert.strictEqual(snakeToCamel('hello'), 'hello');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    assert.strictEqual(truncate('Hello World!', 8), 'Hello...');
  });

  it('returns short strings unchanged', () => {
    assert.strictEqual(truncate('Hi', 10), 'Hi');
  });

  it('uses custom suffix', () => {
    assert.strictEqual(truncate('Hello World!', 9, '~'), 'Hello Wo~');
  });
});

describe('levenshteinDistance', () => {
  it('identical strings have distance 0', () => {
    assert.strictEqual(levenshteinDistance('hello', 'hello'), 0);
  });

  it('computes edit distance', () => {
    assert.strictEqual(levenshteinDistance('kitten', 'sitting'), 3);
  });

  it('handles empty strings', () => {
    assert.strictEqual(levenshteinDistance('', 'abc'), 3);
    assert.strictEqual(levenshteinDistance('abc', ''), 3);
  });
});

describe('tokenize', () => {
  it('tokenizes arithmetic expression', () => {
    const tokens = tokenize('3 + 42 * (7 - 2)');
    assert.strictEqual(tokens.length, 9);
    assert.deepStrictEqual(tokens[0], { type: 'number', value: 3 });
    assert.deepStrictEqual(tokens[1], { type: 'operator', value: '+' });
    assert.deepStrictEqual(tokens[2], { type: 'number', value: 42 });
  });

  it('handles decimal numbers', () => {
    const tokens = tokenize('3.14 + 2.0');
    assert.deepStrictEqual(tokens[0], { type: 'number', value: 3.14 });
  });

  it('throws on unexpected character', () => {
    assert.throws(() => tokenize('3 & 4'), /Unexpected character/);
  });
});
