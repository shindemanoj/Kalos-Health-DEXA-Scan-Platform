const fs = require('fs');
const { query, queryOne } = require('../db');
const { parseDexaPdf } = require('../services/pdfService');
const { chatQuery } = require('../services/aiService');

// GET /api/scans/:id
async function getScan(req, res) {
  const scan = await queryOne(
    'SELECT * FROM scans WHERE id = $1',
    [req.params.id]
  );
  if (!scan) return res.status(404).json({ error: 'Scan not found' });

  // Members can only read their own scans
  if (req.user.role === 'member' && scan.member_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ scan });
}

// POST /api/scans/upload
async function uploadScan(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });

  // Determine which member this scan belongs to
  // Members upload for themselves; coaches can pass member_id in body
  const memberId = req.user.role === 'member'
    ? req.user.id
    : (req.body.member_id || req.user.id);

  let extracted;
  try {
    extracted = await parseDexaPdf(req.file.path);
  } catch (err) {
    fs.unlinkSync(req.file.path);
    return res.status(422).json({ error: `PDF parsing failed: ${err.message}` });
  }

  const scan = await queryOne(
    `INSERT INTO scans (
       member_id, scan_date, pdf_path,
       weight_lb, height_in, bmi,
       total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
       bmd_total, bmd_t_score, bmd_z_score,
       vat_mass_g, vat_volume_cm3, vat_area_cm2,
       android_fat_pct, gynoid_fat_pct, android_gynoid_ratio,
       trunk_fat_pct, legs_fat_pct,
       lean_height2, appen_lean_height2,
       scan_id_raw, raw_json
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
       $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
     )
     RETURNING *`,
    [
      memberId,
      extracted.scan_date,
      req.file.path,
      extracted.weight_lb,
      extracted.height_in,
      extracted.bmi,
      extracted.total_body_fat_pct,
      extracted.fat_mass_lb,
      extracted.lean_mass_lb,
      extracted.bmc_lb,
      extracted.total_mass_lb,
      extracted.bmd_total,
      extracted.bmd_t_score,
      extracted.bmd_z_score,
      extracted.vat_mass_g,
      extracted.vat_volume_cm3,
      extracted.vat_area_cm2,
      extracted.android_fat_pct,
      extracted.gynoid_fat_pct,
      extracted.android_gynoid_ratio,
      extracted.trunk_fat_pct,
      extracted.legs_fat_pct,
      extracted.lean_height2,
      extracted.appen_lean_height2,
      extracted.scan_id_raw,
      JSON.stringify(extracted),
    ]
  );

  res.status(201).json({ scan });
}

// DELETE /api/scans/:id
async function deleteScan(req, res) {
  const scan = await queryOne('SELECT * FROM scans WHERE id = $1', [req.params.id]);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });

  if (req.user.role === 'member' && scan.member_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await query('DELETE FROM scans WHERE id = $1', [req.params.id]);
  if (scan.pdf_path && fs.existsSync(scan.pdf_path)) {
    fs.unlinkSync(scan.pdf_path);
  }
  res.json({ message: 'Scan deleted' });
}

// POST /api/scans/chat — MemberGPT
async function chatWithScans(req, res) {
  const { message, member_id, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // Pull all relevant scan data for context
  const scans = member_id
    ? await query(
        `SELECT s.*, u.name AS member_name
         FROM scans s JOIN users u ON u.id = s.member_id
         WHERE s.member_id = $1 ORDER BY s.scan_date ASC`,
        [member_id]
      )
    : await query(
        `SELECT s.*, u.name AS member_name
         FROM scans s JOIN users u ON u.id = s.member_id
         ORDER BY u.name, s.scan_date ASC`
      );

  const members = await query(
    `SELECT u.id, u.name, COUNT(s.id)::int AS scan_count
     FROM users u LEFT JOIN scans s ON s.member_id = u.id
     WHERE u.role = 'member' GROUP BY u.id ORDER BY u.name`
  );

  const reply = await chatQuery({ message, history, scans, members });
  res.json({ reply });
}

module.exports = { getScan, uploadScan, deleteScan, chatWithScans };
