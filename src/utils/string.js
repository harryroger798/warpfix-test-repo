/**
 * String manipulation utilities
 */

function parseEmail(email) {
  const regex = /^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})$/;
  const match = email.match(regex);
  if (!match) return null;
  return { local: match[1], domain: match[2], tld: match[3] };
}

function parseURL(url) {
  const regex = /^(https?):\/\/([^/:]+)(?::(\d+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/;
  const match = url.match(regex);
  if (!match) return null;
  return {
    protocol: match[1],
    host: match[2],
    port: match[3] ? parseInt(match[3]) : null,
    path: match[4] || '/',
    query: match[5] || null,
    fragment: match[6] || null,
  };
}

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function truncate(str, maxLen, suffix = '...') {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - suffix.length) + suffix;
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function tokenize(expression) {
  const tokens = [];
  let i = 0;
  while (i < expression.length) {
    if (/\s/.test(expression[i])) { i++; continue; }
    if (/\d/.test(expression[i])) {
      let num = '';
      while (i < expression.length && /[\d.]/.test(expression[i])) {
        num += expression[i++];
      }
      tokens.push({ type: 'number', value: parseFloat(num) });
    } else if ('+-*/()'.includes(expression[i])) {
      tokens.push({ type: 'operator', value: expression[i++] });
    } else {
      throw new Error(`Unexpected character: ${expression[i]}`);
    }
  }
  return tokens;
}

module.exports = { parseEmail, parseURL, camelToSnake, snakeToCamel, truncate, levenshteinDistance, tokenize };
