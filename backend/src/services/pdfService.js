const fs = require('fs');
const pdf = require('pdf-parse');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract a float from text using a regex.
 * @param {RegExp} regex  Must have exactly one capture group for the number.
 * @param {string} text
 * @param {number} [group=1]  Which capture group holds the value.
 */
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

/**
 * Average two nullable numbers. Returns null if both are null.
 */
function avg(a, b) {
  if (a == null && b == null) return null;
  if (a == null) return b;
  if (b == null) return a;
  return parseFloat(((a + b) / 2).toFixed(2));
}

// ─── Table row extractors ─────────────────────────────────────────────────────

/**
 * Extract a named row from the Body Composition Results table.
 * Rows look like: "Trunk  13.41  61.77  75.18  17.8  24  17"
 *                  label  fat    lean   total  %fat
 *
 * We keep the raw (non-collapsed) line to preserve column order.
 */
function extractBodyCompRow(label, lines) {
  // Match a line starting with the label followed by whitespace-separated numbers
  const re = new RegExp(
      `^${label}\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)`,
      'im'
  );
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      return {
        fat_mass:   parseFloat(m[1]),
        lean_mass:  parseFloat(m[2]),
        total_mass: parseFloat(m[3]),
        fat_pct:    parseFloat(m[4]),
      };
    }
  }
  return null;
}

/**
 * Extract the "Total" row from the DXA Results Summary table.
 * Row: "Total  2282.13  3506.17  1.536  3.4  3.3"
 *              area     bmc      bmd   t    z
 */
function extractBmdTotalRow(lines) {
  const re = /^Total\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/im;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      return {
        bmd:     parseFloat(m[3]),
        t_score: parseFloat(m[4]),
        z_score: parseFloat(m[5]),
      };
    }
  }
  return null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

async function parseDexaPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);

  // Keep original lines for table parsing; make a collapsed version for simple extractions
  const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
  const text = data.text; // do NOT collapse — breaks table column alignment

  // ── Simple single-value fields ─────────────────────────────────────────────
  const scan_date   = extractDate(text);
  const scan_id_raw = (() => {
    const m = text.match(/ID:\s*([A-Z0-9]+)/i);
    return m ? m[1] : null;
  })();

  const weight_lb = extractNumber(/Weight:\s*([\d.]+)\s*lb/i, text);
  const height_in = extractNumber(/Height:\s*([\d.]+)\s*in/i, text);
  const bmi       = extractNumber(/BMI\s*=\s*([\d.]+)/i, text);

  // ── Body composition table rows ────────────────────────────────────────────
  const totalRow   = extractBodyCompRow('Total', lines);
  const trunkRow   = extractBodyCompRow('Trunk', lines);
  const lLegRow    = extractBodyCompRow('L Leg', lines);
  const rLegRow    = extractBodyCompRow('R Leg', lines);
  const androidRow = extractBodyCompRow('Android \\(A\\)', lines)
      || extractBodyCompRow('Android', lines);
  const gynoidRow  = extractBodyCompRow('Gynoid \\(G\\)', lines)
      || extractBodyCompRow('Gynoid', lines);

  // BMC is reported separately in the DXA Summary — extract from that table
  // "Total  2282.13  3506.17  1.536  3.4  3.3" — bmc in grams, convert to lb
  const bmc_g  = extractNumber(/^Total\s+[\d.]+\s+([\d.]+)/im, text);
  const bmc_lb = bmc_g != null ? parseFloat((bmc_g / 453.592).toFixed(3)) : null;

  // ── BMD row ────────────────────────────────────────────────────────────────
  const bmdRow = extractBmdTotalRow(lines);

  // ── Adipose indices ────────────────────────────────────────────────────────
  const android_gynoid_ratio = extractNumber(/Android\/Gynoid Ratio\s*([\d.]+)/i, text);
  const vat_mass_g           = extractNumber(/Est\.\s*VAT Mass\s*\(g\)\s*([\d.]+)/i, text);
  const vat_volume_cm3       = extractNumber(/Est\.\s*VAT Volume\s*\(cm[³3]\)\s*([\d.]+)/i, text);
  const vat_area_cm2         = extractNumber(/Est\.\s*VAT Area\s*\(cm[²2]\)\s*([\d.]+)/i, text);

  // ── Lean indices ───────────────────────────────────────────────────────────
  const lean_height2       = extractNumber(/Lean\/Height[²2]\s*\(kg\/m[²2]\)\s*([\d.]+)/i, text);
  const appen_lean_height2 = extractNumber(/Appen\.\s*Lean\/Height[²2].*?([\d.]+)/i, text);

  const result = {
    scan_date,
    scan_id_raw,
    weight_lb,
    height_in,
    bmi,

    total_body_fat_pct: totalRow?.fat_pct    ?? extractNumber(/Total Body % Fat\s*([\d.]+)/i, text),
    fat_mass_lb:        totalRow?.fat_mass   ?? null,
    lean_mass_lb:       totalRow?.lean_mass  ?? null,
    total_mass_lb:      totalRow?.total_mass ?? null,
    bmc_lb,

    bmd_total:   bmdRow?.bmd     ?? null,
    bmd_t_score: bmdRow?.t_score ?? null,
    bmd_z_score: bmdRow?.z_score ?? null,

    trunk_fat_pct:    trunkRow?.fat_pct ?? null,
    legs_fat_pct:     avg(lLegRow?.fat_pct, rLegRow?.fat_pct),
    android_fat_pct:  androidRow?.fat_pct ?? null,
    gynoid_fat_pct:   gynoidRow?.fat_pct  ?? null,

    android_gynoid_ratio,
    vat_mass_g,
    vat_volume_cm3,
    vat_area_cm2,

    lean_height2,
    appen_lean_height2,
  };

  // ── Validation: warn if critical fields are missing ───────────────────────
  const critical = ['scan_date', 'total_body_fat_pct', 'lean_mass_lb', 'fat_mass_lb'];
  const missing  = critical.filter(k => result[k] == null);
  if (missing.length > 0) {
    console.warn(`[pdfService] Partial extraction — missing: ${missing.join(', ')}`);
  }

  return result;
}

module.exports = { parseDexaPdf };