-- Migration 002: scans table
-- Schema derived from the Kalos DEXA scan report (Hologic Horizon Wi).
-- Stores the metrics that matter most for member progress and coaching.

CREATE TABLE IF NOT EXISTS scans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_date     DATE NOT NULL,
  pdf_path      TEXT,               -- local path or S3 key
  scan_id_raw   TEXT,               -- original scan ID from report e.g. "A0622240C"

  -- ── Biometrics ─────────────────────────────────────────────────────────────
  weight_lb     NUMERIC(6,2),
  height_in     NUMERIC(5,2),
  bmi           NUMERIC(5,2),

  -- ── Body Composition (Total row, Body Composition Results) ─────────────────
  total_body_fat_pct  NUMERIC(5,2),   -- % body fat
  fat_mass_lb         NUMERIC(7,2),   -- total fat mass (lb)
  lean_mass_lb        NUMERIC(7,2),   -- lean soft tissue (lb)
  bmc_lb              NUMERIC(6,2),   -- bone mineral content (lb)
  total_mass_lb       NUMERIC(7,2),   -- total mass (lb)

  -- ── Bone Mineral Density (DXA Results Summary, Total row) ──────────────────
  bmd_total     NUMERIC(6,4),         -- g/cm²
  bmd_t_score   NUMERIC(5,2),
  bmd_z_score   NUMERIC(5,2),

  -- ── Regional Fat ──────────────────────────────────────────────────────────
  trunk_fat_pct         NUMERIC(5,2),
  legs_fat_pct          NUMERIC(5,2),  -- average of L+R legs
  android_fat_pct       NUMERIC(5,2),
  gynoid_fat_pct        NUMERIC(5,2),

  -- ── Adipose Indices ────────────────────────────────────────────────────────
  android_gynoid_ratio  NUMERIC(5,3),
  vat_mass_g            NUMERIC(8,2),  -- visceral adipose tissue mass (g)
  vat_volume_cm3        NUMERIC(8,2),
  vat_area_cm2          NUMERIC(8,2),

  -- ── Lean Indices ──────────────────────────────────────────────────────────
  lean_height2          NUMERIC(6,3),  -- lean/height² kg/m²
  appen_lean_height2    NUMERIC(6,3),  -- appendicular lean/height² kg/m²

  -- ── Raw payload (full extracted JSON for future re-processing) ─────────────
  raw_json      JSONB,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scans_member_id  ON scans(member_id);
CREATE INDEX idx_scans_scan_date  ON scans(scan_date DESC);
CREATE INDEX idx_scans_member_date ON scans(member_id, scan_date DESC);
