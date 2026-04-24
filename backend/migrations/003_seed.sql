-- Migration 003: seed data
-- 5 members covering all 3 dashboard personas:
--   Persona A (1 scan):  alex@kalos.com
--   Persona B (2 scans): sarah@kalos.com
--   Persona C (3+ scans): jordan@kalos.com, marcus@kalos.com (5 scans), priya@kalos.com (4 scans)
-- Password for all demo accounts: Kalos2024!

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO users (id, email, password_hash, name, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'alex@kalos.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkJ7yB.b6Z1mC5i8XkYAim', 'Alex Rivera', 'member'),
  ('a2000000-0000-0000-0000-000000000002', 'sarah@kalos.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkJ7yB.b6Z1mC5i8XkYAim', 'Sarah Chen', 'member'),
  ('a3000000-0000-0000-0000-000000000003', 'jordan@kalos.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkJ7yB.b6Z1mC5i8XkYAim', 'Jordan Taylor', 'member'),
  ('a4000000-0000-0000-0000-000000000004', 'marcus@kalos.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkJ7yB.b6Z1mC5i8XkYAim', 'Marcus Johnson', 'member'),
  ('a5000000-0000-0000-0000-000000000005', 'priya@kalos.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkJ7yB.b6Z1mC5i8XkYAim', 'Priya Patel', 'member')
ON CONFLICT (email) DO NOTHING;

-- ── Alex Rivera — 1 scan (Persona A: first scan) ──────────────────────────────
INSERT INTO scans (member_id, scan_date, weight_lb, height_in, bmi,
  total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
  bmd_total, bmd_t_score, bmd_z_score,
  trunk_fat_pct, legs_fat_pct, android_fat_pct, gynoid_fat_pct,
  android_gynoid_ratio, vat_mass_g, vat_volume_cm3, vat_area_cm2,
  lean_height2, appen_lean_height2, scan_id_raw)
VALUES
  ('a1000000-0000-0000-0000-000000000001', '2024-06-22', 165.8, 67.5, 25.6,
   19.4, 31.58, 131.44, 2.04, 163.02,
   1.536, 3.4, 3.3,
   17.8, 22.35, 20.4, 21.7,
   0.94, 317, 343, 65.7,
   19.1, 8.72, 'A0622240C');

-- ── Sarah Chen — 2 scans (Persona B: first comparison) ────────────────────────
INSERT INTO scans (member_id, scan_date, weight_lb, height_in, bmi,
  total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
  bmd_total, bmd_t_score, bmd_z_score,
  trunk_fat_pct, legs_fat_pct, android_fat_pct, gynoid_fat_pct,
  android_gynoid_ratio, vat_mass_g, vat_volume_cm3, vat_area_cm2,
  lean_height2, appen_lean_height2, scan_id_raw)
VALUES
  ('a2000000-0000-0000-0000-000000000002', '2024-01-10', 148.2, 64.5, 25.1,
   28.4, 42.1, 101.6, 4.5, 148.2,
   1.182, 1.2, 1.0,
   31.2, 26.8, 33.5, 29.0,
   1.15, 420, 455, 88.2,
   16.8, 7.41, 'B0110241A'),
  ('a2000000-0000-0000-0000-000000000002', '2024-07-18', 145.0, 64.5, 24.6,
   26.1, 37.9, 102.7, 4.4, 145.0,
   1.201, 1.3, 1.1,
   28.5, 24.2, 30.1, 27.8,
   1.08, 365, 395, 76.4,
   17.1, 7.65, 'B0718241B');

-- ── Jordan Taylor — 3 scans (Persona C: returning member) ─────────────────────
INSERT INTO scans (member_id, scan_date, weight_lb, height_in, bmi,
  total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
  bmd_total, bmd_t_score, bmd_z_score,
  trunk_fat_pct, legs_fat_pct, android_fat_pct, gynoid_fat_pct,
  android_gynoid_ratio, vat_mass_g, vat_volume_cm3, vat_area_cm2,
  lean_height2, appen_lean_height2, scan_id_raw)
VALUES
  ('a3000000-0000-0000-0000-000000000003', '2023-09-05', 182.4, 70.0, 26.1,
   22.8, 41.6, 136.2, 4.6, 182.4,
   1.410, 2.1, 1.9,
   24.1, 20.5, 25.8, 22.6,
   1.14, 480, 520, 100.1,
   18.5, 8.89, 'C0905231A'),
  ('a3000000-0000-0000-0000-000000000003', '2024-01-15', 179.8, 70.0, 25.7,
   21.2, 38.1, 137.1, 4.6, 179.8,
   1.425, 2.2, 2.0,
   22.6, 19.4, 24.1, 21.8,
   1.10, 440, 476, 91.8,
   18.6, 9.04, 'C0115241B'),
  ('a3000000-0000-0000-0000-000000000003', '2024-07-22', 177.2, 70.0, 25.4,
   19.8, 35.1, 137.5, 4.6, 177.2,
   1.440, 2.3, 2.1,
   21.0, 18.1, 22.5, 20.9,
   1.08, 398, 431, 83.1,
   18.7, 9.18, 'C0722241C');

-- ── Marcus Johnson — 5 scans (Persona C: meaningful trends) ───────────────────
INSERT INTO scans (member_id, scan_date, weight_lb, height_in, bmi,
  total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
  bmd_total, bmd_t_score, bmd_z_score,
  trunk_fat_pct, legs_fat_pct, android_fat_pct, gynoid_fat_pct,
  android_gynoid_ratio, vat_mass_g, vat_volume_cm3, vat_area_cm2,
  lean_height2, appen_lean_height2, scan_id_raw)
VALUES
  ('a4000000-0000-0000-0000-000000000004', '2023-03-10', 210.0, 72.0, 28.5,
   27.3, 57.3, 148.3, 4.4, 210.0,
   1.340, 1.8, 1.5,
   30.2, 24.5, 32.8, 27.3,
   1.20, 610, 661, 127.4,
   18.3, 8.58, 'D0310231A'),
  ('a4000000-0000-0000-0000-000000000004', '2023-07-14', 206.5, 72.0, 28.0,
   25.8, 53.3, 148.8, 4.4, 206.5,
   1.358, 1.9, 1.6,
   28.4, 23.1, 30.5, 26.1,
   1.17, 562, 608, 117.2,
   18.4, 8.71, 'D0714231B'),
  ('a4000000-0000-0000-0000-000000000004', '2023-11-20', 203.2, 72.0, 27.6,
   24.1, 49.0, 149.8, 4.4, 203.2,
   1.372, 2.0, 1.7,
   26.5, 21.8, 28.2, 24.9,
   1.13, 510, 552, 106.4,
   18.5, 8.86, 'D1120231C'),
  ('a4000000-0000-0000-0000-000000000004', '2024-03-05', 200.8, 72.0, 27.2,
   22.6, 45.4, 150.9, 4.5, 200.8,
   1.385, 2.1, 1.8,
   24.8, 20.4, 26.5, 23.6,
   1.12, 468, 507, 97.7,
   18.7, 9.01, 'D0305241D'),
  ('a4000000-0000-0000-0000-000000000004', '2024-08-01', 199.0, 72.0, 27.0,
   21.2, 42.2, 152.3, 4.5, 199.0,
   1.398, 2.2, 1.9,
   23.0, 19.1, 24.8, 22.5,
   1.10, 430, 466, 89.8,
   18.9, 9.20, 'D0801241E');

-- ── Priya Patel — 4 scans (Persona C: mixed results) ─────────────────────────
INSERT INTO scans (member_id, scan_date, weight_lb, height_in, bmi,
  total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
  bmd_total, bmd_t_score, bmd_z_score,
  trunk_fat_pct, legs_fat_pct, android_fat_pct, gynoid_fat_pct,
  android_gynoid_ratio, vat_mass_g, vat_volume_cm3, vat_area_cm2,
  lean_height2, appen_lean_height2, scan_id_raw)
VALUES
  ('a5000000-0000-0000-0000-000000000005', '2023-05-15', 135.0, 63.0, 23.9,
   30.2, 40.8, 90.4, 3.8, 135.0,
   1.105, 0.8, 0.7,
   33.5, 28.1, 36.2, 32.4,
   1.12, 388, 420, 81.0,
   15.9, 7.12, 'E0515231A'),
  ('a5000000-0000-0000-0000-000000000005', '2023-10-08', 133.5, 63.0, 23.6,
   28.7, 38.3, 91.3, 3.9, 133.5,
   1.118, 0.9, 0.8,
   31.8, 26.9, 34.5, 31.2,
   1.10, 358, 388, 74.8,
   16.1, 7.30, 'E1008231B'),
  ('a5000000-0000-0000-0000-000000000005', '2024-02-20', 136.2, 63.0, 24.1,
   29.5, 40.2, 91.9, 4.1, 136.2,
   1.130, 1.0, 0.9,
   32.4, 27.5, 35.0, 31.8,
   1.11, 372, 403, 77.7,
   16.3, 7.40, 'E0220241C'),
  ('a5000000-0000-0000-0000-000000000005', '2024-08-10', 132.0, 63.0, 23.3,
   27.1, 35.8, 92.4, 3.8, 132.0,
   1.145, 1.1, 1.0,
   30.1, 25.2, 32.8, 29.5,
   1.11, 335, 363, 70.0,
   16.4, 7.55, 'E0810241D');
