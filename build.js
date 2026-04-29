/**
 * Build validation script - checks all modules load correctly
 */

const modules = [
  './src/utils/math',
  './src/utils/string',
  './src/data/transform',
  './src/events/emitter',
  './src/cache/lru',
  './src/index',
];

let failed = false;

for (const mod of modules) {
  try {
    require(mod);
    console.log(`  OK: ${mod}`);
  } catch (err) {
    console.error(`  FAIL: ${mod} - ${err.message}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nBuild validation failed!');
  process.exit(1);
}

console.log('\nBuild validation passed!');
