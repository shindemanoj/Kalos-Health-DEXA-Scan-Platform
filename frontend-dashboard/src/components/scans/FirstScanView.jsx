import { formatDate, round1 } from '../../lib/utils';

const METRIC_EXPLAINERS = [
  {
    key: 'total_body_fat_pct',
    label: 'Body Fat %',
    unit: '%',
    icon: '🫀',
    color: 'bg-rose-50 border-rose-100',
    iconBg: 'bg-rose-100',
    explain: 'The percentage of your total body weight that is fat tissue. Lower is generally healthier for most people.',
  },
  {
    key: 'lean_mass_lb',
    label: 'Lean Mass',
    unit: ' lb',
    icon: '💪',
    color: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100',
    explain: 'Your muscle, organs, bone and water — everything that is not fat. Higher lean mass supports metabolism and strength.',
  },
  {
    key: 'fat_mass_lb',
    label: 'Fat Mass',
    unit: ' lb',
    icon: '⚖️',
    color: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100',
    explain: 'Total pounds of fat tissue in your body. This is more precise than BMI for tracking body composition changes.',
  },
  {
    key: 'vat_mass_g',
    label: 'Visceral Fat',
    unit: ' g',
    icon: '🎯',
    color: 'bg-orange-50 border-orange-100',
    iconBg: 'bg-orange-100',
    explain: 'Fat stored around your organs (visceral adipose tissue). This type is most strongly linked to metabolic health risks.',
  },
  {
    key: 'bmd_total',
    label: 'Bone Density',
    unit: ' g/cm²',
    icon: '🦴',
    color: 'bg-teal-50 border-teal-100',
    iconBg: 'bg-teal-100',
    explain: 'How dense your bones are. Your T-score compares you to a healthy young adult of the same sex.',
  },
  {
    key: 'lean_height2',
    label: 'Lean Index',
    unit: ' kg/m²',
    icon: '📐',
    color: 'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100',
    explain: 'Lean mass normalized for your height — a better measure of muscularity than raw pounds.',
  },
];

export default function FirstScanView({ scan }) {
  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔬</div>
          <div>
            <h3 className="font-semibold text-lg">Your first DEXA scan</h3>
            <p className="text-indigo-200 text-sm mt-1 leading-relaxed">
              Scanned {formatDate(scan.scan_date)} · {scan.weight_lb} lb · {scan.height_in} in · BMI {round1(scan.bmi)}
            </p>
            <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
              DEXA gives you a precise picture of your body composition — far more detailed than weight or BMI alone. 
              This is your baseline. Every future scan will show exactly how you're changing.
            </p>
          </div>
        </div>
      </div>

      {/* Metric breakdown with explanations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your numbers — explained</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METRIC_EXPLAINERS.map(({ key, label, unit, icon, color, iconBg, explain }) => {
            const val = scan[key];
            if (val == null) return null;
            return (
              <div key={key} className={`rounded-xl border p-4 ${color}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${iconBg}`}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">{label}</div>
                    <div className="text-xl font-bold text-gray-900">
                      {key === 'bmd_total' ? val : round1(val)}{unit}
                    </div>
                  </div>
                  {key === 'bmd_t_score' && scan.bmd_t_score != null && (
                    <span className="ml-auto text-xs bg-white/70 rounded-md px-2 py-0.5 text-gray-600">
                      T-score {scan.bmd_t_score}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{explain}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body composition split */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Body composition breakdown</h3>
        <BodyCompositionBar scan={scan} />
        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" />Fat ({round1(scan.total_body_fat_pct)}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />Lean ({round1(100 - scan.total_body_fat_pct - (scan.bmc_lb / scan.total_mass_lb * 100))}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal-400 inline-block" />Bone</span>
        </div>
      </div>

      {/* Regional fat */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Regional fat distribution</h3>
        <div className="space-y-3">
          {[
            { label: 'Trunk', val: scan.trunk_fat_pct, max: 50 },
            { label: 'Legs', val: scan.legs_fat_pct, max: 50 },
            { label: 'Android', val: scan.android_fat_pct, max: 50 },
            { label: 'Gynoid', val: scan.gynoid_fat_pct, max: 50 },
          ].filter(r => r.val != null).map(({ label, val, max }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{label}</span>
                <span className="font-medium text-gray-700">{round1(val)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all"
                  style={{ width: `${Math.min((val / max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps CTA */}
      <div className="bg-gray-900 rounded-2xl p-5 text-white">
        <h3 className="font-semibold mb-1">What's next?</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your coach will use this data to personalise your training and nutrition plan. 
          Most members rescan every 8–12 weeks — that's enough time to see meaningful change.
        </p>
      </div>
    </div>
  );
}

function BodyCompositionBar({ scan }) {
  if (!scan.total_mass_lb) return null;
  const fatPct = scan.total_body_fat_pct;
  const bonePct = round1((scan.bmc_lb / scan.total_mass_lb) * 100);
  const leanPct = round1(100 - fatPct - bonePct);
  return (
    <div className="h-6 rounded-full overflow-hidden flex">
      <div className="bg-rose-400" style={{ width: `${fatPct}%` }} title={`Fat ${fatPct}%`} />
      <div className="bg-indigo-500" style={{ width: `${leanPct}%` }} title={`Lean ${leanPct}%`} />
      <div className="bg-teal-400" style={{ width: `${bonePct}%` }} title={`Bone ${bonePct}%`} />
    </div>
  );
}
