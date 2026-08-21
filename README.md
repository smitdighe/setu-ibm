# Setu — AI Personalized Learning & Teacher Assistant Platform

> "A bridge to every student's pace"

Multi-agent AI platform for Gujarat government schools — powered by IBM Granite LLM (watsonx.ai), IBM Cloudant, IBM Cloud Object Storage, and deployed on IBM Cloud Code Engine.

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- IBM Cloud account with:
  - watsonx.ai project + API key
  - Cloudant instance + API key
  - Cloud Object Storage instance + API key

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp env.example .env.local
# Fill in all IBM Cloud credentials in .env.local
```

Required variables (see `env.example` for full list):

| Variable | Description |
|----------|-------------|
| `WATSONX_API_KEY` | IBM Cloud API key |
| `WATSONX_PROJECT_ID` | watsonx.ai project ID |
| `WATSONX_URL` | watsonx.ai endpoint |
| `CLOUDANT_URL` | Cloudant service URL |
| `CLOUDANT_API_KEY` | Cloudant API key |
| `COS_API_KEY` | Cloud Object Storage API key |
| `COS_SERVICE_INSTANCE_ID` | COS service CRN |
| `COS_ENDPOINT` | COS regional endpoint |
| `NEXTAUTH_SECRET` | Random 32-char string |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev |

### 4. Create databases + indexes

```bash
npm run migrate
```

### 5. Seed demo data

```bash
npm run seed
```

Creates: 2 teachers, 1 admin, 30 students, 2 classes (Grade 6A Math + Science), 2 graded assessments.

**Demo login credentials** (password: `demo1234`):

| Role | Email |
|------|-------|
| Teacher (Math) | `priya@school.edu` |
| Teacher (Science) | `rohit@school.edu` |
| Admin | `principal@school.edu` |
| Student | `student1@school.edu` |

### 6. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

---

## Architecture

```
Browser
  └── Next.js App Router (IBM Cloud Code Engine)
        ├── /teacher   — Teacher Dashboard (skill chart, at-risk list, chat)
        ├── /student   — Student Feed (recommendations, assessments, results)
        └── /api/
              ├── agent          — Orchestrator entry point (all agent intents)
              ├── chat           — Teacher Assistant conversational endpoint
              ├── students       — Student CRUD + analytics
              ├── classes        — Class dashboard
              ├── assessments    — Create/list/approve
              ├── lesson-plans   — COS cache-first lesson plan fetch/generate
              └── recommendations— Personalised resource feed

Agents (src/agents/)
  ├── orchestrator   — Routes requests, caches context, fires post-assessment triggers
  ├── analytics      — Mastery scores, risk scoring, skill distribution
  ├── assessment     — Question generation (Granite), grading, feedback
  ├── lessonPlan     — Differentiated lesson plans (Granite), COS cache
  ├── recommendation — Mastery-based topic selection, OER + SkillsBuild
  └── teacherAssistant — NL query classification, action dispatch (Granite)

IBM Cloud
  ├── watsonx.ai    — Granite 13B Instruct (all LLM calls)
  ├── Cloudant      — All structured data (students, assessments, lesson plans)
  └── COS           — Lesson plan document storage (setu-lesson-plans bucket)
```

---

## Key Design Decisions

- **Audit trail**: All Granite-generated feedback stored as `pending_review` until teacher approves via the Assessments page.
- **Cache-first**: Lesson plans stored in COS after first generation; subsequent requests skip LLM entirely.
- **Low-bandwidth**: Resources cached in Cloudant (24h TTL); OER fetch has 8s abort timeout.
- **Multi-tenant**: Every entity carries `schoolId`; all queries scoped by it.
- **Risk formula**: `0.4 × mastery_decline + 0.3 × missed_assessments + 0.3 × pace_lag`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run migrate` | Create Cloudant DBs + indexes + COS bucket |
| `npm run seed` | Populate demo data |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
