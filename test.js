const assert = require("assert");
const { add, subtract, multiply } = require("./index");

// Tests - BROKEN: expects 4 instead of 3
assert.strictEqual(add(1, 2), 4, "1 + 2 should equal 4");
assert.strictEqual(subtract(5, 3), 2, "5 - 3 should equal 2");
assert.strictEqual(multiply(2, 3), 6, "2 * 3 should equal 6");

console.log("All tests passed!");
