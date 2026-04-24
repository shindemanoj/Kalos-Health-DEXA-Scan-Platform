import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatDate, round1, isImprovement } from '../../lib/utils';

const CHARTS = [
  {
    key: 'total_body_fat_pct',
    label: 'Body fat %',
    color: '#f43f5e',
    unit: '%',
    direction: 'lower',
  },
  {
    key: 'lean_mass_lb',
    label: 'Lean mass (lb)',
    color: '#6366f1',
    unit: ' lb',
    direction: 'higher',
  },
  {
    key: 'fat_mass_lb',
    label: 'Fat mass (lb)',
    color: '#f97316',
    unit: ' lb',
    direction: 'lower',
  },
  {
    key: 'vat_mass_g',
    label: 'Visceral fat (g)',
    color: '#ef4444',
    unit: ' g',
    direction: 'lower',
  },
];

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function ReturningMemberView({ scans }) {
  // scans is chronological
  const latest = scans[scans.length - 1];
  const prev = scans[scans.length - 2];

  const chartData = scans.map(s => ({
    date: formatShortDate(s.scan_date),
    fullDate: formatDate(s.scan_date),
    total_body_fat_pct: s.total_body_fat_pct,
    lean_mass_lb: s.lean_mass_lb,
    fat_mass_lb: s.fat_mass_lb,
    vat_mass_g: s.vat_mass_g,
    weight_lb: s.weight_lb,
  }));

  return (
    <div className="space-y-6">
      {/* KPI strip — latest vs previous */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CHARTS.map(({ key, label, unit, direction, color }) => {
          const curr = latest[key];
          const old = prev[key];
          if (curr == null) return null;
          const d = old != null ? round1(curr - old) : null;
          const imp = d != null ? isImprovement(key, d) : null;
          const sign = d != null && d >= 0 ? '+' : '';
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {round1(curr)}<span className="text-sm font-normal text-gray-400">{unit}</span>
              </p>
              {d !== null && (
                <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                  ${imp === true ? 'bg-emerald-50 text-emerald-700' :
                    imp === false ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-500'}`}>
                  {imp === true ? '▲' : imp === false ? '▼' : '—'}
                  {sign}{d}{unit} vs last
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CHARTS.map(({ key, label, color, unit }) => (
          <TrendChart
            key={key}
            data={chartData}
            dataKey={key}
            label={label}
            color={color}
            unit={unit}
          />
        ))}
      </div>

      {/* All scans history table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Scan history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-medium">
                <th className="px-5 py-2.5 text-left">Date</th>
                <th className="px-4 py-2.5 text-right">Weight</th>
                <th className="px-4 py-2.5 text-right">Body fat</th>
                <th className="px-4 py-2.5 text-right">Lean mass</th>
                <th className="px-4 py-2.5 text-right">Visceral fat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...scans].reverse().map((scan, i) => {
                const isLatest = i === 0;
                return (
                  <tr key={scan.id} className={`hover:bg-gray-50/50 transition-colors ${isLatest ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-5 py-3 text-gray-700 font-medium">
                      {formatDate(scan.scan_date)}
                      {isLatest && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">Latest</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{round1(scan.weight_lb)} lb</td>
                    <td className="px-4 py-3 text-right text-gray-600">{round1(scan.total_body_fat_pct)}%</td>
                    <td className="px-4 py-3 text-right text-gray-600">{round1(scan.lean_mass_lb)} lb</td>
                    <td className="px-4 py-3 text-right text-gray-600">{round1(scan.vat_mass_g)} g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data, dataKey, label, color, unit }) {
  const values = data.map(d => d[dataKey]).filter(v => v != null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.15 || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h4 className="text-xs font-semibold text-gray-500 mb-3">{label}</h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[round1(min - padding), round1(max + padding)]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: 'none' }}
            formatter={(val) => [`${round1(val)}${unit}`, label]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
