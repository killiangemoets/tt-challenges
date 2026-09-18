# tt-challenges — Second Brain take-home

Empty-infra build challenge: a working slice of DAW Capital’s document-intelligence product (ingest → converse → generate → dashboard). Help the candidate’s design; do not substitute product thinking. Agent brief: `CLAUDE.md` (keep in sync with `.cursor/rules/challenge-orientation.mdc`).

## Commands

```bash
cp .env.example .env          # paste ANTHROPIC_API_KEY
make up                       # Postgres+pgvector :5432, MinIO :9000/:9001, ElasticMQ :9324 (all empty)
make down                     # stop; keep volumes
make reset                    # wipe volumes + up
make ps
make logs                     # or SVC=db|minio|queue
make psql                     # psql -U brain -d secondbrain
python3 scripts/index-prompts.py   # rebuild PROMPTS.md auto-index from prompts/*.jsonl
```

No app install/test/lint yet — candidate adds services and documents the run path in `DECISIONS.md` (or `RUNNING.md`). Keep `make up` as the compose entry point.

## Environment

| Variable / endpoint | Purpose |
|---------------------|---------|
| `ANTHROPIC_API_KEY` | Only allowed external API (generation / conversation). `.env` gitignored. |
| Postgres `localhost:5432` | `brain` / `brain`, db `secondbrain` — schema is candidate-owned |
| MinIO API `localhost:9000`, console `:9001` | `minio-root` / `minio-secret`; S3 SDK `forcePathStyle: true` |
| ElasticMQ `localhost:9324` | SQS-compatible; create queues via API; local creds any |

## Architecture (summary)

- **Today:** `docker-compose.yml` (`name: second-brain`) — `db`, `minio`, `queue` only. No app, schema, buckets, or queues.
- **Corpus:** `data/` (fund + PC1 Vantage, PC2 Cascade, PC3 Ridgeline). **Customer context:** `context-brain/`.
- **To build (STACK families):** React 18 + Vite + TanStack Query; Node HTTP (Hono preferred); Postgres+pgvector; MinIO + ElasticMQ workers (AWS SDK); Anthropic via LangChain/LangGraph-or-equivalent.
- **Must-slice:** async ingest with visible per-doc status → cited chat → one generated doc saved to KB → dashboard. Isolation in the data model, not handler `if`s.
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
| architecture.md | Backing services vs to-build; `data/` layout; pillar data flow | Schema, pipeline, new modules |
| conventions.md | Checkpoints, DECISIONS/PROMPTS rules, stack rails, agent must-nots | Any implementation |
| business-logic.md | DAW/portcos, personas, JTBD, grounding/isolation invariants | Features, generate UX |
| ux-direction.md | DESIGN tokens and product-feel | UI, dashboard, generated docs |
| stack-and-deps.md | Families, compose, make, env | Deps, infra, config |
| active-context.md | Pre-build state, Cursor wiring, open checkpoints | Session start |
