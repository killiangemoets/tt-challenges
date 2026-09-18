# tt-challenges — Second Brain take-home

Empty-infra build challenge: a working slice of DAW Capital’s document-intelligence product (ingest → converse → generate → dashboard). Help the candidate’s design; do not substitute product thinking. Agent brief: `CLAUDE.md` (keep in sync with `.cursor/rules/challenge-orientation.mdc`).

## Commands

```bash
cp .env.example .env          # paste ANTHROPIC_API_KEY
make up                       # build/start frontend, API, worker, db, MinIO, ElasticMQ
make down                     # stop; keep volumes
make reset                    # wipe volumes + up
make ps
make logs                     # or SVC=frontend|api|worker|db|minio|queue
make psql                     # psql -U brain -d secondbrain
make build                    # backend + frontend production builds, in Docker
make typecheck                # backend + frontend, in Docker
make lint                     # backend + frontend, in Docker
make test                     # backend Vitest, in Docker
python3 scripts/index-prompts.py   # rebuild PROMPTS.md auto-index from prompts/*.jsonl
```

Node 22.18+ is encoded in the Docker images; host Node/npm is not required. Root npm workspaces + `package-lock.json`; no Turbo/Nx. `make up` is the compose entry point. API/worker deploy Prisma migrations; API creates the MinIO bucket and SQS queue.

## Environment

| Variable / endpoint | Purpose |
|---------------------|---------|
| `ANTHROPIC_API_KEY` | Only allowed external API (generation / conversation). `.env` gitignored. |
| Frontend `localhost:5173` | Vite SPA readiness page; source bind-mounted |
| API `localhost:3000` | `/health`; generated docs at `/api-docs.html` |
| Postgres `localhost:5432` | `brain` / `brain`, db `secondbrain` — schema is candidate-owned |
| MinIO API `localhost:9000`, console `:9001` | `documents` bucket; `minio-root` / `minio-secret`; path-style S3 |
| ElasticMQ `localhost:9324` | SQS-compatible `ingest` queue; local creds any |

## Architecture (summary)

- **Today:** `docker-compose.yml` (`name: second-brain`) — `frontend`, complete Fastify `api`, ingest `worker`, `db`, `minio`, `queue`. Backend routes, schema, resource initialization, ingestion, retrieval, and generation persistence are implemented.
- **Target processes:** `ARCHITECTURE.md` — Vite React SPA → Fastify API; ingest **worker** behind ElasticMQ; MinIO; Postgres+pgvector; Anthropic from the API. HTTP + worker contract: `API_SPECS.md`. **Code layout:** `REPO_ARCHITECTURE.md` — `apps/frontend` + `apps/backend` (`src/api`, `src/worker`, `src/common`, `test/`).
- **Schema:** `DATABASE_SCHEMA.md` + `apps/backend/prisma/` — organizations, one `documents` table, chunks `vector(384)`, and generated-citation FKs. Chat retrieve = fund ∪ 0–3 portcos.
- **Corpus:** `data/` (fund + PC1 Vantage, PC2 Cascade, PC3 Ridgeline). **Customer context:** `context-brain/`.
- **To build (STACK):** Vite React 18 **SPA** (CSR, `react-router-dom`, Tailwind, shadcn/Radix, TanStack Query, RHF+zod, axios, lucide, prettier; TanStack Table if a table UI exists). **Fastify** + TypeScript + zod + Prisma + axios + eslint/prettier; API docs at **`/api-docs.html`**. Postgres+pgvector; MinIO + ElasticMQ (AWS SDK); Anthropic **official SDK** (`messages.stream`; no LangChain/LangGraph); embeddings **`@xenova/transformers`**. No Hono, no Next/SSR.
- **Must-slice:** async ingest (`.md` only; MinIO + `documents`; Ingest Seeds + upload; Retry) → cited streaming chat (`portcoOrganizationIds`, markers) → **portco brief** from `templates/portco-brief.md` saved as **generated** (split from uploads) → dashboard. Isolation in the data model (SQL scope).
- Detail: `.cursor/memory/architecture.md`

## Verification

1. Clean clone → `make up` → steps in `DECISIONS.md` “How to run”.
2. Corpus ingest; one grounded cited Q&A; one generated document persisted; dashboard shows KB / pipeline / generated.
3. Failed document visible; no invented claims. Checkpoints 1–7 recorded in `DECISIONS.md` with **verbatim** quotes; never fill “In your own words”.
4. Raw transcripts in `prompts/` (hooks → `scripts/export-transcript.sh` then `scripts/index-prompts.py`). Auto-index in `PROMPTS.md`; candidate edits **Did with it**. Decision reminders in `DECISIONS.md` `<!-- agent-reminders:* -->` blocks — never **In your own words**.

## Memory

Deep knowledge in `.cursor/memory/`. Read by task — do not load all files every session.

| File | Contains | Read when |
|------|----------|-----------|
| project-brief.md | Mission, timebox, eval, definition of done | Scope, use case, cuts |
| architecture.md | Backing services vs to-build; `data/` layout; pillar data flow; `REPO_ARCHITECTURE.md` | Schema, pipeline, new modules, folder layout |
| conventions.md | Checkpoints, DECISIONS/PROMPTS rules, stack rails, agent must-nots | Any implementation |
| business-logic.md | DAW/portcos, personas, JTBD, grounding/isolation invariants | Features, generate UX |
| ux-direction.md | DESIGN tokens and product-feel | UI, dashboard, generated docs |
| stack-and-deps.md | Families, compose, make, env | Deps, infra, config |
| active-context.md | Pre-build state, Cursor wiring, open checkpoints | Session start |
