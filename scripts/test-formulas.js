// Simple formula tests for unit conversions
function approxEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

const tests = [];

// Temperature
tests.push({ name: 'C->F 0', got: (0 * 9/5 + 32), expect: 32 });
tests.push({ name: 'F->C 32', got: ((32 - 32) * 5/9), expect: 0 });

// Weight
tests.push({ name: 'kg->lb 1', got: (1 * 2.20462), expect: 2.20462 });
tests.push({ name: 'lb->kg 2.20462', got: (2.20462 / 2.20462), expect: 1 });

// Distance
tests.push({ name: 'km->mi 1', got: (1 * 0.621371), expect: 0.621371 });
tests.push({ name: 'mi->km 0.621371', got: (0.621371 / 0.621371), expect: 1 });

// Volume
tests.push({ name: 'L->gal 1', got: (1 * 0.264172052), expect: 0.264172052 });
tests.push({ name: 'gal->L 0.264172052', got: (0.264172052 / 0.264172052), expect: 1 });

let failed = 0;
tests.forEach(t => {
  const ok = approxEqual(t.got, t.expect, 1e-9);
  if (!ok) {
    console.error(`FAIL ${t.name}: got=${t.got} expected=${t.expect}`);
    failed++;
  } else {
    console.log(`ok   ${t.name}`);
  }
});

if (failed) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('All tests passed');
  process.exit(0);
}
