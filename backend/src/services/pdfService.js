const fs = require('fs');
const pdf = require('pdf-parse');

// ─────────────────────────────────────────────────────────────────────────────
// Generic Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractNumber(regex, text, group = 1) {
  const match = text.match(regex);
  if (!match || match[group] == null) return null;

  const val = parseFloat(match[group]);
  return isNaN(val) ? null : val;
}

function extractDate(text) {
  const match = text.match(/Scan\s+Date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (!match) return null;

  const d = new Date(match[1]);
  return isNaN(d) ? null : d.toISOString().split('T')[0];
}

function avg(a, b) {
  if (a == null && b == null) return null;
  if (a == null) return b;
  if (b == null) return a;
  return parseFloat(((a + b) / 2).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// DEXA Table Extractors
// ─────────────────────────────────────────────────────────────────────────────

/*
Matches:

Total31.58131.44163.0219.43124

Meaning:

fat_mass_lb   = 31.58
lean_mass_lb  = 131.44
total_mass_lb = 163.02
fat_pct       = 19.43
*/
function extractBodyCompTotal(text) {
  const match = text.match(
      /Total\s*([0-9]{2}\.[0-9]{2})([0-9]{3}\.[0-9]{2})([0-9]{3}\.[0-9]{2})([0-9]{2}\.[0-9]{2})/
  );

  if (!match) return null;

  return {
    fat_mass_lb: parseFloat(match[1]),
    lean_mass_lb: parseFloat(match[2]),
    total_mass_lb: parseFloat(match[3]),
    fat_pct: parseFloat(match[4]),
  };
}

/*
Matches:

Total2282.133506.171.5363.43.3

Meaning:

area      = 2282.13
bmc_g     = 3506.17
bmd       = 1.536
t_score   = 3.4
z_score   = 3.3
*/
function extractBmdTotal(text) {
  const match = text.match(
      /Total\s*([0-9]{4}\.[0-9]{2})([0-9]{4}\.[0-9]{2})([0-9]\.[0-9]{3})([-0-9.]+)([-0-9.]+)/
  );

  if (!match) return null;

  return {
    area: parseFloat(match[1]),
    bmc_g: parseFloat(match[2]),
    bmd: parseFloat(match[3]),
    t_score: parseFloat(match[4]),
    z_score: parseFloat(match[5]),
  };
}

/*
Matches:

Trunk13.4161.7775.1817.82417

We only care about the 4th number = fat %
*/
function extractFatPct(label, text) {
  const safeLabel = label.replace(/[()]/g, '\\$&');

  const regex = new RegExp(
      `${safeLabel}\\s*([0-9]+\\.[0-9]{1,2})([0-9]+\\.[0-9]{1,2})([0-9]+\\.[0-9]{1,2})([0-9]+\\.[0-9]{1,2})`,
      'i'
  );

  const match = text.match(regex);
  if (!match) return null;

  return parseFloat(match[4]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Parser
// ─────────────────────────────────────────────────────────────────────────────

async function parseDexaPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);

  const rawText = data.text;
  const normalizedText = rawText.replace(/\r/g, '');

  // Uncomment for debugging
  // console.log("========== RAW PDF TEXT ==========");
  // console.log(normalizedText);
  // console.log("==================================");

  // ───────────────────────────────────────────────────────────────────────────
  // Scan Metadata
  // ───────────────────────────────────────────────────────────────────────────

  const scan_date = extractDate(normalizedText);

  const scan_id_raw = (() => {
    const m1 = normalizedText.match(
        /Scan Date:.*?ID:\s*([A-Z][A-Z0-9]{4,})/i
    );
    if (m1) return m1[1];

    const m2 = normalizedText.match(
        /\bID:\s*([A-Z]\d{5,}[A-Z0-9]*)/i
    );
    return m2 ? m2[1] : null;
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // Basic Biometrics
  // ───────────────────────────────────────────────────────────────────────────

  const weight_lb = extractNumber(
      /Weight:\s*([\d.]+)\s*lb/i,
      normalizedText
  );

  const height_in = extractNumber(
      /Height:\s*([\d.]+)\s*in/i,
      normalizedText
  );

  const bmi = extractNumber(
      /BMI\s*=\s*([\d.]+)/i,
      normalizedText
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Main Table Rows
  // ───────────────────────────────────────────────────────────────────────────

  const totalRow = extractBodyCompTotal(normalizedText);
  const bmdRow = extractBmdTotal(normalizedText);

  const bmc_lb =
      bmdRow?.bmc_g != null
          ? parseFloat((bmdRow.bmc_g / 453.592).toFixed(3))
          : null;

  // ───────────────────────────────────────────────────────────────────────────
  // Regional Fat %
  // ───────────────────────────────────────────────────────────────────────────

  const trunk_fat_pct = extractFatPct(
      'Trunk',
      normalizedText
  );

  const l_leg_fat_pct = extractFatPct(
      'L Leg',
      normalizedText
  );

  const r_leg_fat_pct = extractFatPct(
      'R Leg',
      normalizedText
  );

  const android_fat_pct =
      extractFatPct('Android (A)', normalizedText) ||
      extractFatPct('Android', normalizedText);

  const gynoid_fat_pct =
      extractFatPct('Gynoid (G)', normalizedText) ||
      extractFatPct('Gynoid', normalizedText);

  const legs_fat_pct = avg(
      l_leg_fat_pct,
      r_leg_fat_pct
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Adipose Indices
  // ───────────────────────────────────────────────────────────────────────────

  const total_body_fat_pct =
      totalRow?.fat_pct ??
      extractNumber(
          /Total Body % Fat\s*([\d.]+)/i,
          normalizedText
      );

  const android_gynoid_ratio = extractNumber(
      /Android\/Gynoid Ratio\s*([\d.]+)/i,
      normalizedText
  );

  const vat_mass_g = extractNumber(
      /Est\.\s*VAT Mass\s*\(g\)\s*([\d.]+)/i,
      normalizedText
  );

  const vat_volume_cm3 = extractNumber(
      /Est\.\s*VAT Volume\s*\(cm[³3]\)\s*([\d.]+)/i,
      normalizedText
  );

  const vat_area_cm2 = extractNumber(
      /Est\.\s*VAT Area\s*\(cm[²2]\)\s*([\d.]+)/i,
      normalizedText
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Lean Indices
  // ───────────────────────────────────────────────────────────────────────────

  const lean_height2 = extractNumber(
      /Lean\/Height[²2]\s*\(kg\/m[²2]\)\s*([\d.]+)/i,
      normalizedText
  );

  const appen_lean_height2 = extractNumber(
      /Appen\.\s*Lean\/Height[²2].*?([\d.]+)/i,
      normalizedText
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Final Result
  // ───────────────────────────────────────────────────────────────────────────

  const result = {
    scan_date,
    scan_id_raw,

    weight_lb,
    height_in,
    bmi,

    total_body_fat_pct,

    fat_mass_lb: totalRow?.fat_mass_lb ?? null,
    lean_mass_lb: totalRow?.lean_mass_lb ?? null,
    total_mass_lb: totalRow?.total_mass_lb ?? null,

    bmc_lb,

    bmd_total: bmdRow?.bmd ?? null,
    bmd_t_score: bmdRow?.t_score ?? null,
    bmd_z_score: bmdRow?.z_score ?? null,

    trunk_fat_pct,
    legs_fat_pct,
    android_fat_pct,
    gynoid_fat_pct,

    android_gynoid_ratio,
    vat_mass_g,
    vat_volume_cm3,
    vat_area_cm2,

    lean_height2,
    appen_lean_height2,
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Missing Critical Fields Warning
  // ───────────────────────────────────────────────────────────────────────────

  const criticalFields = [
    'scan_date',
    'total_body_fat_pct',
    'fat_mass_lb',
    'lean_mass_lb',
    'bmd_total',
  ];

  const missing = criticalFields.filter(
      (field) => result[field] == null
  );

  if (missing.length > 0) {
    console.warn(
        `[pdfService] Partial extraction — missing: ${missing.join(', ')}`
    );
  }

  return result;
}

module.exports = { parseDexaPdf };