// scripts/seed.js
// Run with: node scripts/seed.js
// Generates real bcrypt hashes at runtime — no hardcoded placeholder hashes.

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEMO_PASSWORD = 'Kalos2024!';
const SALT_ROUNDS   = 12;

const MEMBERS = [
    { id: 'a1000000-0000-0000-0000-000000000001', email: 'alex@kalos.com',   name: 'Alex Rivera'    },
    { id: 'a2000000-0000-0000-0000-000000000002', email: 'sarah@kalos.com',  name: 'Sarah Chen'     },
    { id: 'a3000000-0000-0000-0000-000000000003', email: 'jordan@kalos.com', name: 'Jordan Taylor'  },
    { id: 'a4000000-0000-0000-0000-000000000004', email: 'marcus@kalos.com', name: 'Marcus Johnson' },
    { id: 'a5000000-0000-0000-0000-000000000005', email: 'priya@kalos.com',  name: 'Priya Patel'    },
];

// ── Scan data (realistic DEXA values) ────────────────────────────────────────
const SCANS = [
    // ── Alex Rivera — 1 scan (Persona A: first scan) ──────────────────────────
    {
        member_id: 'a1000000-0000-0000-0000-000000000001',
        scan_date: '2024-06-22', weight_lb: 165.8, height_in: 67.5, bmi: 25.6,
        total_body_fat_pct: 19.4, fat_mass_lb: 31.58, lean_mass_lb: 131.44, bmc_lb: 2.04, total_mass_lb: 163.02,
        bmd_total: 1.536, bmd_t_score: 3.4, bmd_z_score: 3.3,
        trunk_fat_pct: 17.8, legs_fat_pct: 22.35, android_fat_pct: 20.4, gynoid_fat_pct: 21.7,
        android_gynoid_ratio: 0.94, vat_mass_g: 317, vat_volume_cm3: 343, vat_area_cm2: 65.7,
        lean_height2: 19.1, appen_lean_height2: 8.72, scan_id_raw: 'A0622240C',
    },

    // ── Sarah Chen — 2 scans (Persona B: first comparison) ────────────────────
    {
        member_id: 'a2000000-0000-0000-0000-000000000002',
        scan_date: '2024-01-10', weight_lb: 148.2, height_in: 64.5, bmi: 25.1,
        total_body_fat_pct: 28.4, fat_mass_lb: 42.1,  lean_mass_lb: 101.6, bmc_lb: 4.5, total_mass_lb: 148.2,
        bmd_total: 1.182, bmd_t_score: 1.2, bmd_z_score: 1.0,
        trunk_fat_pct: 31.2, legs_fat_pct: 26.8, android_fat_pct: 33.5, gynoid_fat_pct: 29.0,
        android_gynoid_ratio: 1.15, vat_mass_g: 420, vat_volume_cm3: 455, vat_area_cm2: 88.2,
        lean_height2: 16.8, appen_lean_height2: 7.41, scan_id_raw: 'B0110241A',
    },
    {
        member_id: 'a2000000-0000-0000-0000-000000000002',
        scan_date: '2024-07-18', weight_lb: 145.0, height_in: 64.5, bmi: 24.6,
        total_body_fat_pct: 26.1, fat_mass_lb: 37.9,  lean_mass_lb: 102.7, bmc_lb: 4.4, total_mass_lb: 145.0,
        bmd_total: 1.201, bmd_t_score: 1.3, bmd_z_score: 1.1,
        trunk_fat_pct: 28.5, legs_fat_pct: 24.2, android_fat_pct: 30.1, gynoid_fat_pct: 27.8,
        android_gynoid_ratio: 1.08, vat_mass_g: 365, vat_volume_cm3: 395, vat_area_cm2: 76.4,
        lean_height2: 17.1, appen_lean_height2: 7.65, scan_id_raw: 'B0718241B',
    },

    // ── Jordan Taylor — 3 scans (Persona C: returning member) ─────────────────
    {
        member_id: 'a3000000-0000-0000-0000-000000000003',
        scan_date: '2023-09-05', weight_lb: 182.4, height_in: 70.0, bmi: 26.1,
        total_body_fat_pct: 22.8, fat_mass_lb: 41.6,  lean_mass_lb: 136.2, bmc_lb: 4.6, total_mass_lb: 182.4,
        bmd_total: 1.410, bmd_t_score: 2.1, bmd_z_score: 1.9,
        trunk_fat_pct: 24.1, legs_fat_pct: 20.5, android_fat_pct: 25.8, gynoid_fat_pct: 22.6,
        android_gynoid_ratio: 1.14, vat_mass_g: 480, vat_volume_cm3: 520, vat_area_cm2: 100.1,
        lean_height2: 18.5, appen_lean_height2: 8.89, scan_id_raw: 'C0905231A',
    },
    {
        member_id: 'a3000000-0000-0000-0000-000000000003',
        scan_date: '2024-01-15', weight_lb: 179.8, height_in: 70.0, bmi: 25.7,
        total_body_fat_pct: 21.2, fat_mass_lb: 38.1,  lean_mass_lb: 137.1, bmc_lb: 4.6, total_mass_lb: 179.8,
        bmd_total: 1.425, bmd_t_score: 2.2, bmd_z_score: 2.0,
        trunk_fat_pct: 22.6, legs_fat_pct: 19.4, android_fat_pct: 24.1, gynoid_fat_pct: 21.8,
        android_gynoid_ratio: 1.10, vat_mass_g: 440, vat_volume_cm3: 476, vat_area_cm2: 91.8,
        lean_height2: 18.6, appen_lean_height2: 9.04, scan_id_raw: 'C0115241B',
    },
    {
        member_id: 'a3000000-0000-0000-0000-000000000003',
        scan_date: '2024-07-22', weight_lb: 177.2, height_in: 70.0, bmi: 25.4,
        total_body_fat_pct: 19.8, fat_mass_lb: 35.1,  lean_mass_lb: 137.5, bmc_lb: 4.6, total_mass_lb: 177.2,
        bmd_total: 1.440, bmd_t_score: 2.3, bmd_z_score: 2.1,
        trunk_fat_pct: 21.0, legs_fat_pct: 18.1, android_fat_pct: 22.5, gynoid_fat_pct: 20.9,
        android_gynoid_ratio: 1.08, vat_mass_g: 398, vat_volume_cm3: 431, vat_area_cm2: 83.1,
        lean_height2: 18.7, appen_lean_height2: 9.18, scan_id_raw: 'C0722241C',
    },

    // ── Marcus Johnson — 5 scans (Persona C: meaningful trends) ───────────────
    {
        member_id: 'a4000000-0000-0000-0000-000000000004',
        scan_date: '2023-03-10', weight_lb: 210.0, height_in: 72.0, bmi: 28.5,
        total_body_fat_pct: 27.3, fat_mass_lb: 57.3,  lean_mass_lb: 148.3, bmc_lb: 4.4, total_mass_lb: 210.0,
        bmd_total: 1.340, bmd_t_score: 1.8, bmd_z_score: 1.5,
        trunk_fat_pct: 30.2, legs_fat_pct: 24.5, android_fat_pct: 32.8, gynoid_fat_pct: 27.3,
        android_gynoid_ratio: 1.20, vat_mass_g: 610, vat_volume_cm3: 661, vat_area_cm2: 127.4,
        lean_height2: 18.3, appen_lean_height2: 8.58, scan_id_raw: 'D0310231A',
    },
    {
        member_id: 'a4000000-0000-0000-0000-000000000004',
        scan_date: '2023-07-14', weight_lb: 206.5, height_in: 72.0, bmi: 28.0,
        total_body_fat_pct: 25.8, fat_mass_lb: 53.3,  lean_mass_lb: 148.8, bmc_lb: 4.4, total_mass_lb: 206.5,
        bmd_total: 1.358, bmd_t_score: 1.9, bmd_z_score: 1.6,
        trunk_fat_pct: 28.4, legs_fat_pct: 23.1, android_fat_pct: 30.5, gynoid_fat_pct: 26.1,
        android_gynoid_ratio: 1.17, vat_mass_g: 562, vat_volume_cm3: 608, vat_area_cm2: 117.2,
        lean_height2: 18.4, appen_lean_height2: 8.71, scan_id_raw: 'D0714231B',
    },
    {
        member_id: 'a4000000-0000-0000-0000-000000000004',
        scan_date: '2023-11-20', weight_lb: 203.2, height_in: 72.0, bmi: 27.6,
        total_body_fat_pct: 24.1, fat_mass_lb: 49.0,  lean_mass_lb: 149.8, bmc_lb: 4.4, total_mass_lb: 203.2,
        bmd_total: 1.372, bmd_t_score: 2.0, bmd_z_score: 1.7,
        trunk_fat_pct: 26.5, legs_fat_pct: 21.8, android_fat_pct: 28.2, gynoid_fat_pct: 24.9,
        android_gynoid_ratio: 1.13, vat_mass_g: 510, vat_volume_cm3: 552, vat_area_cm2: 106.4,
        lean_height2: 18.5, appen_lean_height2: 8.86, scan_id_raw: 'D1120231C',
    },
    {
        member_id: 'a4000000-0000-0000-0000-000000000004',
        scan_date: '2024-03-05', weight_lb: 200.8, height_in: 72.0, bmi: 27.2,
        total_body_fat_pct: 22.6, fat_mass_lb: 45.4,  lean_mass_lb: 150.9, bmc_lb: 4.5, total_mass_lb: 200.8,
        bmd_total: 1.385, bmd_t_score: 2.1, bmd_z_score: 1.8,
        trunk_fat_pct: 24.8, legs_fat_pct: 20.4, android_fat_pct: 26.5, gynoid_fat_pct: 23.6,
        android_gynoid_ratio: 1.12, vat_mass_g: 468, vat_volume_cm3: 507, vat_area_cm2: 97.7,
        lean_height2: 18.7, appen_lean_height2: 9.01, scan_id_raw: 'D0305241D',
    },
    {
        member_id: 'a4000000-0000-0000-0000-000000000004',
        scan_date: '2024-08-01', weight_lb: 199.0, height_in: 72.0, bmi: 27.0,
        total_body_fat_pct: 21.2, fat_mass_lb: 42.2,  lean_mass_lb: 152.3, bmc_lb: 4.5, total_mass_lb: 199.0,
        bmd_total: 1.398, bmd_t_score: 2.2, bmd_z_score: 1.9,
        trunk_fat_pct: 23.0, legs_fat_pct: 19.1, android_fat_pct: 24.8, gynoid_fat_pct: 22.5,
        android_gynoid_ratio: 1.10, vat_mass_g: 430, vat_volume_cm3: 466, vat_area_cm2: 89.8,
        lean_height2: 18.9, appen_lean_height2: 9.20, scan_id_raw: 'D0801241E',
    },

    // ── Priya Patel — 4 scans (Persona C: mixed results) ─────────────────────
    {
        member_id: 'a5000000-0000-0000-0000-000000000005',
        scan_date: '2023-05-15', weight_lb: 135.0, height_in: 63.0, bmi: 23.9,
        total_body_fat_pct: 30.2, fat_mass_lb: 40.8,  lean_mass_lb: 90.4, bmc_lb: 3.8, total_mass_lb: 135.0,
        bmd_total: 1.105, bmd_t_score: 0.8, bmd_z_score: 0.7,
        trunk_fat_pct: 33.5, legs_fat_pct: 28.1, android_fat_pct: 36.2, gynoid_fat_pct: 32.4,
        android_gynoid_ratio: 1.12, vat_mass_g: 388, vat_volume_cm3: 420, vat_area_cm2: 81.0,
        lean_height2: 15.9, appen_lean_height2: 7.12, scan_id_raw: 'E0515231A',
    },
    {
        member_id: 'a5000000-0000-0000-0000-000000000005',
        scan_date: '2023-10-08', weight_lb: 133.5, height_in: 63.0, bmi: 23.6,
        total_body_fat_pct: 28.7, fat_mass_lb: 38.3,  lean_mass_lb: 91.3, bmc_lb: 3.9, total_mass_lb: 133.5,
        bmd_total: 1.118, bmd_t_score: 0.9, bmd_z_score: 0.8,
        trunk_fat_pct: 31.8, legs_fat_pct: 26.9, android_fat_pct: 34.5, gynoid_fat_pct: 31.2,
        android_gynoid_ratio: 1.10, vat_mass_g: 358, vat_volume_cm3: 388, vat_area_cm2: 74.8,
        lean_height2: 16.1, appen_lean_height2: 7.30, scan_id_raw: 'E1008231B',
    },
    {
        member_id: 'a5000000-0000-0000-0000-000000000005',
        scan_date: '2024-02-20', weight_lb: 136.2, height_in: 63.0, bmi: 24.1,
        total_body_fat_pct: 29.5, fat_mass_lb: 40.2,  lean_mass_lb: 91.9, bmc_lb: 4.1, total_mass_lb: 136.2,
        bmd_total: 1.130, bmd_t_score: 1.0, bmd_z_score: 0.9,
        trunk_fat_pct: 32.4, legs_fat_pct: 27.5, android_fat_pct: 35.0, gynoid_fat_pct: 31.8,
        android_gynoid_ratio: 1.11, vat_mass_g: 372, vat_volume_cm3: 403, vat_area_cm2: 77.7,
        lean_height2: 16.3, appen_lean_height2: 7.40, scan_id_raw: 'E0220241C',
    },
    {
        member_id: 'a5000000-0000-0000-0000-000000000005',
        scan_date: '2024-08-10', weight_lb: 132.0, height_in: 63.0, bmi: 23.3,
        total_body_fat_pct: 27.1, fat_mass_lb: 35.8,  lean_mass_lb: 92.4, bmc_lb: 3.8, total_mass_lb: 132.0,
        bmd_total: 1.145, bmd_t_score: 1.1, bmd_z_score: 1.0,
        trunk_fat_pct: 30.1, legs_fat_pct: 25.2, android_fat_pct: 32.8, gynoid_fat_pct: 29.5,
        android_gynoid_ratio: 1.11, vat_mass_g: 335, vat_volume_cm3: 363, vat_area_cm2: 70.0,
        lean_height2: 16.4, appen_lean_height2: 7.55, scan_id_raw: 'E0810241D',
    },
];

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Generate the real hash once — reuse for all demo accounts
        console.log(`Hashing password (rounds=${SALT_ROUNDS}) — this takes a few seconds...`);
        const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
        console.log('Hash generated ✓');

        // ── Users ──────────────────────────────────────────────────────────────
        for (const m of MEMBERS) {
            await client.query(
                `INSERT INTO users (id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, 'member')
         ON CONFLICT (email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               name          = EXCLUDED.name`,
                [m.id, m.email, passwordHash, m.name]
            );
            console.log(`  ✓ user: ${m.email}`);
        }

        // ── Scans ──────────────────────────────────────────────────────────────
        // Delete existing seed scans so re-running is safe
        const memberIds = MEMBERS.map(m => m.id);
        await client.query(
            `DELETE FROM scans WHERE member_id = ANY($1::uuid[])`,
            [memberIds]
        );

        for (const s of SCANS) {
            await client.query(
                `INSERT INTO scans (
           member_id, scan_date, weight_lb, height_in, bmi,
           total_body_fat_pct, fat_mass_lb, lean_mass_lb, bmc_lb, total_mass_lb,
           bmd_total, bmd_t_score, bmd_z_score,
           trunk_fat_pct, legs_fat_pct, android_fat_pct, gynoid_fat_pct,
           android_gynoid_ratio, vat_mass_g, vat_volume_cm3, vat_area_cm2,
           lean_height2, appen_lean_height2, scan_id_raw
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
           $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
           $21,$22,$23,$24
         )`,
                [
                    s.member_id, s.scan_date, s.weight_lb, s.height_in, s.bmi,
                    s.total_body_fat_pct, s.fat_mass_lb, s.lean_mass_lb, s.bmc_lb, s.total_mass_lb,
                    s.bmd_total, s.bmd_t_score, s.bmd_z_score,
                    s.trunk_fat_pct, s.legs_fat_pct, s.android_fat_pct, s.gynoid_fat_pct,
                    s.android_gynoid_ratio, s.vat_mass_g, s.vat_volume_cm3, s.vat_area_cm2,
                    s.lean_height2, s.appen_lean_height2, s.scan_id_raw,
                ]
            );
        }
        console.log(`  ✓ ${SCANS.length} scans inserted`);

        await client.query('COMMIT');
        console.log(`\nSeed complete. Login with any demo account using: ${DEMO_PASSWORD}`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed failed — rolled back:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();