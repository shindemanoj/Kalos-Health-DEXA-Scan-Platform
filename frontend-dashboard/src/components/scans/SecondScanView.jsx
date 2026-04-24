import { formatDate, round1, delta, isImprovement } from '../../lib/utils';

const COMPARISON_METRICS = [
  { key: 'total_body_fat_pct', label: 'Body fat', unit: '%' },
  { key: 'fat_mass_lb', label: 'Fat mass', unit: ' lb' },
  { key: 'lean_mass_lb', label: 'Lean mass', unit: ' lb' },
  { key: 'weight_lb', label: 'Weight', unit: ' lb' },
  { key: 'vat_mass_g', label: 'Visceral fat', unit: ' g' },
  { key: 'bmd_total', label: 'Bone density', unit: ' g/cm²' },
];

export default function SecondScanView({ scans }) {
  // scans is chronological: [first, second]
  const [first, second] = scans;
  const daysBetween = Math.round(
    (new Date(second.scan_date) - new Date(first.scan_date)) / (1000 * 60 * 60 * 24)
  );

  // Count improvements
  const improvements = COMPARISON_METRICS.filter(({ key }) => {
    const d = second[key] - first[key];
    const imp = isImprovement(key, d);
    return imp === true;
  }).length;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm font-medium mb-1">Progress update</p>
        <h3 className="text-xl font-bold mb-1">
          {improvements >= COMPARISON_METRICS.length / 2
            ? 'Great progress! 🎉'
            : improvements > 0
            ? 'Mixed results — keep going 💪'
            : 'Room to improve — let\'s dig in'}
        </h3>
        <p className="text-indigo-200 text-sm">
          {formatDate(first.scan_date)} → {formatDate(second.scan_date)}
          <span className="ml-2 text-indigo-300">({daysBetween} days)</span>
        </p>
      </div>

      {/* Delta cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {COMPARISON_METRICS.map(({ key, label, unit }) => {
          const prev = first[key];
          const curr = second[key];
          if (prev == null || curr == null) return null;
          const d = round1(curr - prev);
          const imp = isImprovement(key, d);
          const sign = d >= 0 ? '+' : '';

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium mb-2">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{round1(curr)}<span className="text-sm font-normal text-gray-400">{unit}</span></p>
              <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                ${imp === true ? 'bg-emerald-50 text-emerald-700' :
                  imp === false ? 'bg-rose-50 text-rose-600' :
                  'bg-gray-50 text-gray-500'}`}>
                {imp === true ? '▲' : imp === false ? '▼' : '—'}
                {sign}{d}{unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-side comparison table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Side-by-side comparison</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {/* Header */}
          <div className="grid grid-cols-4 px-5 py-2.5 text-xs font-medium text-gray-400">
            <span>Metric</span>
            <span className="text-right">{formatDate(first.scan_date)}</span>
            <span className="text-right">{formatDate(second.scan_date)}</span>
            <span className="text-right">Change</span>
          </div>
          {COMPARISON_METRICS.map(({ key, label, unit }) => {
            const prev = first[key];
            const curr = second[key];
            if (prev == null || curr == null) return null;
            const d = round1(curr - prev);
            const imp = isImprovement(key, d);
            const sign = d >= 0 ? '+' : '';
            return (
              <div key={key} className="grid grid-cols-4 px-5 py-3 text-sm items-center hover:bg-gray-50/50 transition-colors">
                <span className="text-gray-600 font-medium">{label}</span>
                <span className="text-right text-gray-400">{round1(prev)}{unit}</span>
                <span className="text-right text-gray-900 font-medium">{round1(curr)}{unit}</span>
                <span className={`text-right font-semibold text-xs
                  ${imp === true ? 'text-emerald-600' :
                    imp === false ? 'text-rose-500' : 'text-gray-400'}`}>
                  {sign}{d}{unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body composition bars compared */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Body composition shift</h3>
        <div className="space-y-3">
          {[
            { label: formatDate(first.scan_date), scan: first },
            { label: formatDate(second.scan_date), scan: second },
          ].map(({ label, scan }) => {
            const bonePct = round1((scan.bmc_lb / scan.total_mass_lb) * 100) || 3;
            const leanPct = round1(100 - scan.total_body_fat_pct - bonePct);
            return (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <div className="h-5 rounded-full overflow-hidden flex">
                  <div className="bg-rose-400" style={{ width: `${scan.total_body_fat_pct}%` }} />
                  <div className="bg-indigo-500" style={{ width: `${leanPct}%` }} />
                  <div className="bg-teal-400" style={{ width: `${bonePct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-400 inline-block"/>Fat</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block"/>Lean</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-teal-400 inline-block"/>Bone</span>
        </div>
      </div>
    </div>
  );
}
