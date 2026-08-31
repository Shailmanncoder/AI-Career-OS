# AI CareerOS

**Turn your resume into your career roadmap.**

AI CareerOS analyzes where a candidate is today and determines what they need to reach their desired career. Built for **ATH Hackathon 0.1 – 2026, Problem Statement #7: AI-Powered Resume Analysis & Career Recommendation System**.

---

## The core idea

Most resume tools return a score and a keyword list. Neither tells you which skill to learn on Monday morning, or what learning it would actually be worth.

AI CareerOS separates two concerns that are usually muddled together:

| Concern | Owner | Why |
| --- | --- | --- |
| Compatibility %, rankings, gap sizes, progress %, assessment scores | **Deterministic backend** | Reproducible, auditable, identical for identical inputs |
| Analysis, explanations, recommendations, generated questions, feedback | **Gemini** | Language work a model is genuinely good at |

A language model never decides your percentage. It explains a number the application already calculated.

---

## Core journey

```
Landing → Auth → Onboarding → Resume Upload → Parsing → AI Analysis
   → Skill Extraction → Career Matching → Skill Gap Analysis
   → Roadmap → Career Simulator → Assessments → Interview Coach → Progress
```

### The differentiating feature

The **Career Simulator** lets you select skills you are considering and recalculates compatibility instantly, in the browser, using the same deterministic engine that produced your baseline. Select Node.js, SQL and REST API Design against Full Stack Developer and the score moves 66% → 83%, with an AI explanation of why those specific skills matter.

---

## Features

- **Resume analysis** — PDF/DOCX text extraction, structured profile extraction, strict schema validation before anything is stored
- **Skill intelligence** — 101 skills across 12 categories, each with an estimated level, the evidence behind it, and a confidence value
- **Career matching** — 14 roles with weighted required/important/optional skills, scored deterministically
- **Skill gap engine** — current vs required level, prioritised by gap size, role weight, and existing foundation
- **Career simulator** — instant what-if recalculation with saved simulation history
- **Personalized roadmap** — 30/60/90-day phased plans with learning, practice, project, and assessment tasks; progress persists
- **Learning recommendations** — 111 curated resources from official documentation and open courses, mapped to your gaps
- **Resume optimizer** — ATS Readiness Score, keyword coverage, formatting warnings, and rewrites constrained to content already in your resume
- **Skill assessments** — generated questions, deterministic scoring, results replace AI estimates with recorded evidence
- **Interview coach** — one question at a time, scored on five dimensions, adaptive follow-ups
- **Progress tracking** — roadmap completion, verified skills, streaks, assessment and simulation trends

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15.5 (App Router, React 19, Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 + shadcn/ui primitives + Lucide icons |
| Charts | Recharts |
| Database | PostgreSQL + Prisma 6 |
| Auth | Auth.js v5 (credentials, JWT sessions, bcrypt) |
| AI | Google Gemini (`gemini-3.6-flash`) via REST |
| Validation | Zod |
| Forms | React Hook Form |
| Tests | Vitest |

One coherent Next.js application. No separate Python backend, no microservices.

---

## Architecture

```
app/
  (app)/          authenticated shell — dashboard, resume, skills, careers,
                  simulator, roadmap, optimizer, assessments, interview, progress
  (auth)/         login, register
  api/            18 route handlers
  onboarding/
components/
  ui/             shadcn/ui primitives
  charts/         Recharts wrappers
  marketing/      landing page sections
  shared/         score ring, stat card, empty/error states
lib/
  ai/             Gemini client, prompts, per-task services
  engine/         deterministic scoring, gaps, simulation
  services/       resume, career, roadmap, dashboard, fallbacks
  validation/     Zod schemas (AI contracts + forms)
  data/           skill, career, and resource catalogues
  db/  auth/  api/
prisma/           schema, migration, seed
tests/            engine, validation, and service tests
```

### AI safety design

Every Gemini call goes through one client (`lib/ai/gemini.ts`) that:

- requests structured JSON (`responseMimeType: application/json`)
- retries transient failures up to 3 attempts with backoff, and stops
- handles timeout, rate limit, malformed JSON, missing key, and unavailable model distinctly
- validates every response against a Zod schema before it reaches application logic

**If any of that fails, a deterministic offline engine takes over** — heuristic resume parsing, template roadmaps, keyword-based ATS analysis, offline assessment grading, and rule-based interview scoring. The app is fully functional without an API key; the UI labels offline output honestly.

---

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local, Docker, Neon, or Supabase)

### Install

```bash
npm install
```

If npm blocks lifecycle scripts, approve the ones Prisma and esbuild need:

```bash
npm install-scripts approve @prisma/client @prisma/engines prisma esbuild fsevents unrs-resolver
```

### Environment

```bash
cp .env.example .env
```

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_URL` | Yes | `http://localhost:3000` in development |
| `GEMINI_API_KEY` | No | Without it the offline engine is used |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.6-flash` |

Never commit `.env`. It is gitignored.

A local database via Docker:

```bash
docker run -d --name aicareeros-pg -e POSTGRES_PASSWORD=careeros -e POSTGRES_USER=careeros -e POSTGRES_DB=ai_career_os -p 5433:5432 postgres:16-alpine
```

### Database

```bash
npx prisma migrate deploy
npm run db:seed
```

Seeds 101 skills, 14 career roles, 189 role-skill weights, 111 learning resources, and one complete demo candidate.

### Run

```bash
npm run dev
```

---

## Demo account

| | |
| --- | --- |
| Email | `demo@aicareeros.dev` |
| Password | `DemoPass123` |

Or use **Explore Demo** on the landing page, which pre-fills the form.

The demo account is **Aarav Mehta, a fictional candidate** created for demonstration — a frontend developer with roughly two years of experience, moving toward full stack. It ships with a resume, 19 analyzed skills, scored matches across all 14 roles, a 90-day roadmap partly completed, an assessment attempt, and an in-progress interview. Every screen labels it as demo data. No real person's information is used anywhere.

**Suggested demo path:** Dashboard → Career Matches → Career Simulator (select Top 3 gaps, watch 66% → 83%) → Save simulation and explain → Roadmap.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run verify` | typecheck + lint + test + build |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed catalogue and demo data |
| `npm run db:studio` | Prisma Studio |

---

## Security

- Credentials hashed with bcrypt (12 rounds); no plaintext storage
- JWT sessions, secure cookies, protected route middleware
- Every API route authenticates, authorizes, and scopes queries to the session user
- Per-user, per-route rate limiting
- File type, extension, MIME, and size validation (5 MB cap); raw files are never stored, only extracted text
- All AI calls are server-side; the API key is never exposed to the client
- All AI output validated before it influences application logic
- Zod validation on every request body
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`

---

## Deployment

Vercel-compatible. Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `GEMINI_API_KEY` as environment variables, point the database at Neon or Supabase, and run `npx prisma migrate deploy` followed by `npm run db:seed` against the production database.

---

## Honesty commitments

These are enforced in the prompts, the schemas, and the UI copy:

- AI-estimated skill levels are labelled as estimates, never as verified measurements
- Assessments are practice tools, explicitly **not** certifications
- The optimizer never fabricates employers, degrees, certifications, metrics, or achievements — missing numbers become bracketed placeholders for the candidate to fill in
- "ATS Readiness Score" makes no claim about any specific vendor's applicant tracking system
- Learning resource URLs are curated real links, never model-generated
- Offline-generated output is labelled as such wherever it appears

---

## Code conventions

This codebase contains **zero source-code comments** by design. Intent is carried by TypeScript types, Zod schemas, and explicit naming. Documentation lives in this README.
