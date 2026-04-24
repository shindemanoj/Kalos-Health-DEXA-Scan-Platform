// Format a date string as "Jan 15, 2024"
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// Round to 1 decimal place
export function round1(n) {
  return n != null ? Math.round(n * 10) / 10 : null;
}

// Delta display: +2.1 or -1.4
export function delta(a, b, unit = '') {
  if (a == null || b == null) return null;
  const d = round1(b - a);
  return `${d >= 0 ? '+' : ''}${d}${unit}`;
}

// Is the delta an improvement? (lower fat = better, higher lean = better)
export function isImprovement(metric, deltaVal) {
  const lowerIsBetter = ['total_body_fat_pct', 'fat_mass_lb', 'vat_mass_g',
    'android_gynoid_ratio', 'trunk_fat_pct'];
  const higherIsBetter = ['lean_mass_lb', 'lean_height2', 'appen_lean_height2', 'bmd_total'];

  if (deltaVal === 0) return null;
  if (lowerIsBetter.includes(metric)) return deltaVal < 0;
  if (higherIsBetter.includes(metric)) return deltaVal > 0;
  return null;
}

// Determine persona based on scan count
export function getPersona(scanCount) {
  if (scanCount === 1) return 'first';
  if (scanCount === 2) return 'second';
  return 'returning';
}
