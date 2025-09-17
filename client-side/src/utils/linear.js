// utils/linear.js
export function linearRegression(x = [], y = []) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { slope: null, intercept: null };
  const sx = x.reduce((a, v) => a + v, 0);
  const sy = y.reduce((a, v) => a + v, 0);
  const sxx = x.reduce((a, v) => a + v * v, 0);
  const sxy = x.reduce((a, v, i) => a + v * y[i], 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return { slope: null, intercept: null };
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}
