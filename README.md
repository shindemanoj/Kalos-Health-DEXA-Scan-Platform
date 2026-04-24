# Kalos Health — DEXA Scan Platform

Two apps sharing one database:
- **Member Dashboard** — members view scan history, upload new PDFs, track progress
- **MemberGPT** — coaches ask natural-language questions about member data

## Live Demo

| App | URL |
|---|---|
| Member Dashboard | https://kalos-health-dexa-scan-platform.vercel.app |
| MemberGPT | https://kalos-health-dexa-scan-platform-7lu.vercel.app |

---

## Stack

| Layer | Tech |
|---|---|
| Backend API | Node.js + Express |
| Database | PostgreSQL (Railway) |
| Auth | JWT + bcrypt |
| PDF Parsing | pdf-parse + regex (range-disambiguated) |
| AI Chat | OpenRouter → Claude 3 Haiku |
| Frontend | React + Vite + Tailwind CSS |
| Deployment | Railway (backend + Postgres) + Vercel (frontends) |

---

## Project Structure

```
kalos/
├── backend/
│   ├── src/
│   │   ├── index.js            # Entry point
│   │   ├── app.js              # Express setup, middleware, routes
│   │   ├── db/index.js         # PostgreSQL pool + query helpers
│   │   ├── routes/             # auth.js | members.js | scans.js
│   │   ├── controllers/        # authController | membersController | scansController
│   │   ├── middleware/         # auth.js | errorHandler.js | validate.js
│   │   └── services/
│   │       ├── pdfService.js   # DEXA PDF → structured JSON via pdf-parse + regex
│   │       └── aiService.js    # MemberGPT — OpenRouter context injection
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_scans.sql
│   │   └── 003_seed.sql        # Do not run directly — use scripts/seed.js
│   ├── scripts/
│   │   ├── migrate.js          # Runs all SQL migrations in order
│   │   └── seed.js             # Generates real bcrypt hashes + inserts demo data
│   ├── railway.json            # Railway deploy config
│   └── .env.example
│
├── frontend-dashboard/         # React app — port 5173
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── components/scans/
│   │   │   ├── FirstScanView.jsx       # Persona A: 1 scan — educational explainers
│   │   │   ├── SecondScanView.jsx      # Persona B: 2 scans — delta comparison
│   │   │   ├── ReturningMemberView.jsx # Persona C: 3+ scans — trend charts
│   │   │   └── UploadScanButton.jsx
│   │   └── lib/
│   │       ├── api.js          # Axios + JWT interceptor + VITE_API_URL support
│   │       ├── auth.js         # login / logout / token helpers
│   │       └── utils.js        # formatDate, delta, isImprovement, getPersona
│   ├── vercel.json             # SPA rewrite rule
│   └── .env.example
│
└── frontend-membergpt/         # React app — port 5174
    ├── src/
    │   ├── App.jsx             # Chat UI, member filter, suggested questions
    │   └── lib/
    │       └── api.js          # Axios + VITE_API_URL support (no auth)
    ├── vercel.json             # SPA rewrite rule
    └── .env.example
```

---

## Local Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 2. Database

```bash
createdb kalos
psql kalos -f backend/migrations/001_create_users.sql
psql kalos -f backend/migrations/002_create_scans.sql
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and OPENROUTER_API_KEY
npm install
mkdir -p uploads
node scripts/seed.js   # generates real bcrypt hashes + inserts 5 members, 15 scans
npm run dev
# → http://localhost:4000
```

### 4. Dashboard

```bash
cd frontend-dashboard
npm install
npm run dev
# → http://localhost:5173
```

### 5. MemberGPT

```bash
cd frontend-membergpt
npm install
npm run dev
# → http://localhost:5174
```

---

## Demo Accounts

All accounts use password: **`Kalos2024!`**

| Email | Member | Persona |
|---|---|---|
| `alex@kalos.com` | Alex Rivera | 1 scan — first-time member |
| `sarah@kalos.com` | Sarah Chen | 2 scans — first comparison |
| `jordan@kalos.com` | Jordan Taylor | 3 scans — returning member |
| `marcus@kalos.com` | Marcus Johnson | 5 scans — full trends |
| `priya@kalos.com` | Priya Patel | 4 scans — mixed results |

---

## Environment Variables

### backend/.env

```
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/kalos
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=sk-or-...
MEMBER_GPT_API_URL=http://localhost:5174
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=20
```

### frontend-dashboard/.env and frontend-membergpt/.env

```
# Leave blank for local dev (Vite proxy handles /api → localhost:4000)
# Set to Railway backend URL for production
VITE_API_URL=
```

---

## API Reference

```
POST   /api/auth/register      { email, password, name }
POST   /api/auth/login         { email, password }           → { token, user }
GET    /api/auth/me                                           → { user }          🔒

GET    /api/members                                           → { members }       public
GET    /api/members/:id                                       → { member }        🔒
GET    /api/members/:id/scans                                 → { scans }         🔒

GET    /api/scans/:id                                         → { scan }          🔒
POST   /api/scans/upload       multipart { pdf, member_id? } → { scan }          🔒
DELETE /api/scans/:id                                                             🔒
POST   /api/scans/chat         { message, member_id?, history? } → { reply }     public
```

🔒 = requires `Authorization: Bearer <token>` header

---

## Key Design Decisions

**PDF parsing: pdf-parse + regex, not a vision model**
Switched from GPT-4o vision to pdf-parse for zero per-upload cost, deterministic output, and sub-100ms latency. Two non-trivial bugs were solved during development: (1) the PDF contains two rows both starting with "Total" — disambiguated by numeric range (body comp fat mass < 500 lb vs DXA area > 1000 cm²); (2) `scan_id_raw` was capturing "Referring" because Patient ID is blank in the PDF — fixed by scoping the ID match to the Scan Date line. The `raw_json` column stores the full extracted payload so any scan can be re-parsed without re-upload.

**MemberGPT: OpenRouter instead of OpenAI direct**
Avoids single-provider quota limits. Routes to Claude 3 Haiku via an OpenAI-compatible API. The AI receives the full scan dataset as structured JSON context in a single system message — one system message rather than two because some OpenRouter-routed models handle multiple system entries inconsistently. History trimmed to last 10 messages (5 user/assistant pairs).

**Persona-adaptive dashboard**
The UI renders a completely different component based on scan count — no empty states at any stage. Scan 1: educational metric explainers. Scan 2: delta-first comparison cards. Scan 3+: Recharts trend lines + scrollable history table.

**Per-route auth, not blanket router middleware**
`GET /api/members` and `POST /api/scans/chat` are public (MemberGPT needs them without a token). All write operations and member-scoped reads remain protected. `POST /chat` is declared before `GET /:id` to prevent Express matching the literal string "chat" as an ID parameter.

**`raw_json` column**
Full extracted DEXA payload stored as JSONB. Enables backfilling new metrics from existing scans without requiring re-uploads if the schema is extended later.