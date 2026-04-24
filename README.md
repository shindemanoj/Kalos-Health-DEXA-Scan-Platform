# Kalos Health — DEXA Scan Platform

Two apps sharing one database:
- **Member Dashboard** — members view scan history, upload new PDFs, track progress
- **MemberGPT** — coaches ask natural-language questions about member data

---

## Stack

| Layer | Tech |
|---|---|
| Backend API | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (bcrypt password hashing) |
| PDF Parsing | OpenAI GPT-4o (vision) |
| AI Chat | OpenAI GPT-4o |
| Frontend | React + Vite + Tailwind CSS |

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
│   │   ├── controllers/        # Business logic per route group
│   │   ├── middleware/         # auth.js | errorHandler.js | validate.js
│   │   └── services/
│   │       ├── pdfService.js   # DEXA PDF → structured JSON via GPT-4o
│   │       └── aiService.js    # MemberGPT chat with scan context
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_scans.sql
│   │   └── 003_seed.sql        # 5 demo members, 15 scans
│   └── .env.example
│
├── frontend-dashboard/         # React app — port 5173
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   └── DashboardPage.jsx
│       ├── components/scans/
│       │   ├── FirstScanView.jsx       # Persona A: 1 scan — educational
│       │   ├── SecondScanView.jsx      # Persona B: 2 scans — delta comparison
│       │   ├── ReturningMemberView.jsx # Persona C: 3+ scans — trend charts
│       │   └── UploadScanButton.jsx
│       └── lib/
│           ├── api.js          # Axios instance with JWT interceptor
│           ├── auth.js         # login / logout / token helpers
│           └── utils.js        # formatDate, delta, isImprovement, getPersona
│
└── frontend-membergpt/         # React app — port 5174
    └── src/
        └── App.jsx             # Chat UI with member filter + suggested questions
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 2. Database

```bash
createdb kalos
psql kalos -f backend/migrations/001_create_users.sql
psql kalos -f backend/migrations/002_create_scans.sql
psql kalos -f backend/migrations/003_seed.sql
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and OPENAI_API_KEY
npm install
mkdir -p uploads
npm run dev
# → http://localhost:4000
```

### 4. Dashboard

```bash
cd frontend-dashboard && npm install && npm run dev
# → http://localhost:5173
```

### 5. MemberGPT

```bash
cd frontend-membergpt && npm install && npm run dev
# → http://localhost:5174
```

---

## Demo Accounts (password: `Kalos2024!`)

| Email | Member | Persona |
|---|---|---|
| `alex@kalos.com` | Alex Rivera | 1 scan — first-time |
| `sarah@kalos.com` | Sarah Chen | 2 scans — first comparison |
| `jordan@kalos.com` | Jordan Taylor | 3 scans — returning |
| `marcus@kalos.com` | Marcus Johnson | 5 scans — full trends |
| `priya@kalos.com` | Priya Patel | 4 scans — mixed results |

---

## API Reference

```
POST   /api/auth/register      { email, password, name }
POST   /api/auth/login         { email, password }
GET    /api/auth/me

GET    /api/members            list all with scan count
GET    /api/members/:id
GET    /api/members/:id/scans

GET    /api/scans/:id
POST   /api/scans/upload       multipart { pdf, member_id? }
DELETE /api/scans/:id
POST   /api/scans/chat         { message, member_id?, history? }
```

---

## Key Decisions

**GPT-4o for PDF parsing** — DEXA reports vary by scanner model. A rules-based parser breaks on format variation; GPT-4o vision handles all formats and gives extra-credit multi-format support automatically.

**Persona-adaptive UI** — the dashboard changes its entire layout based on scan count: educational for scan 1, delta comparison for scan 2, trend charts for 3+. No empty states.

**MemberGPT grounded in real data** — the AI receives the full scan dataset as structured context. The system prompt instructs it to say "I can't answer that from the data" rather than hallucinate.

**`raw_json` column** — full extracted payload stored as JSONB, enabling future backfills without re-uploading PDFs.
