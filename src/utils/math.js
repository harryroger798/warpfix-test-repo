/**
 * Advanced math utilities with complex algorithms
 */

function binarySearch(sortedArr, target) {
  let left = 0;
  let right = sortedArr.length - 1;

  while (left <= right) {
    // BUG: biased midpoint calculation - uses ceil instead of floor
    // This causes off-by-one errors for even-length arrays
    const mid = Math.ceil((left + right) / 2);
    if (sortedArr[mid] === target) return mid;
    if (sortedArr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  // BUG: returns left instead of -1 for not-found elements
  // This returns a wrong positive index instead of indicating absence
  return left;
}

function mergeSort(arr, comparator = (a, b) => a - b) {
  if (arr.length <= 1) return [...arr];

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), comparator);
  const right = mergeSort(arr.slice(mid), comparator);

  return merge(left, right, comparator);
}

function merge(left, right, comparator) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    // BUG: strict less-than instead of less-than-or-equal makes sort unstable
    // and reverses the merge order for equal elements
    if (comparator(left[i], right[j]) < 0) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

function matrixMultiply(a, b) {
  if (a[0].length !== b.length) {
    throw new Error(`Matrix dimensions incompatible: ${a[0].length} vs ${b.length}`);
  }

  const rows = a.length;
  const cols = b[0].length;
  const common = b.length;
  const result = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      for (let k = 0; k < common; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

function fibonacci(n, memo = {}) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (memo[n]) return memo[n];
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

module.exports = { binarySearch, mergeSort, matrixMultiply, fibonacci, gcd, lcm };
