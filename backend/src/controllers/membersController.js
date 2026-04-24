const { query, queryOne } = require('../db');

// GET /api/members
async function listMembers(_req, res) {
  const members = await query(
    `SELECT u.id, u.name, u.email, u.created_at,
            COUNT(s.id)::int AS scan_count,
            MAX(s.scan_date) AS last_scan_date
     FROM users u
     LEFT JOIN scans s ON s.member_id = u.id
     WHERE u.role = 'member'
     GROUP BY u.id
     ORDER BY u.name`
  );
  res.json({ members });
}

// GET /api/members/:id
async function getMember(req, res) {
  const member = await queryOne(
    `SELECT u.id, u.name, u.email, u.created_at,
            COUNT(s.id)::int AS scan_count,
            MAX(s.scan_date) AS last_scan_date
     FROM users u
     LEFT JOIN scans s ON s.member_id = u.id
     WHERE u.id = $1 AND u.role = 'member'
     GROUP BY u.id`,
    [req.params.id]
  );
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json({ member });
}

// GET /api/members/:id/scans
async function getMemberScans(req, res) {
  const scans = await query(
    `SELECT id, scan_date, weight_lb, height_in,
            total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
            bmd_total, bmd_t_score, bmd_z_score,
            vat_mass_g, vat_volume_cm3, vat_area_cm2,
            android_fat_pct, gynoid_fat_pct, android_gynoid_ratio,
            trunk_fat_pct, legs_fat_pct,
            lean_height2, appen_lean_height2,
            bmi, scan_id_raw, created_at
     FROM scans
     WHERE member_id = $1
     ORDER BY scan_date DESC`,
    [req.params.id]
  );
  res.json({ scans });
}

module.exports = { listMembers, getMember, getMemberScans };
