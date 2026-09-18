# Active context

## Current focus

- Runnable scaffold complete: root npm workspaces; Dockerized React/Vite frontend, Fastify API (`/health`, `/api-docs.html`), and idle worker plus db/MinIO/ElasticMQ. `make up` starts all six. Schema **draft** in `DATABASE_SCHEMA.md`; feature routes and resource initialization are not built. **Locked:** one `documents` table, `source` uploaded|generated. **Open:** orgs table vs enum; citation FKs vs jsonb. No Prisma schema until those.

## Recent decisions

- 2026-09-18: Use Cursor for the challenge. Added `.cursor/hooks.json` (stop/sessionEnd → `scripts/export-transcript.sh`), `.cursor/rules/challenge-orientation.mdc` (`alwaysApply`, mirrors `CLAUDE.md`). Kept `.claude/settings.json`.
- 2026-09-18: `export-transcript.sh` accepts Cursor `conversation_id` as session id fallback.
- 2026-09-18: `/refresh-memory` init — `AGENTS.md` operational front page; depth in `.cursor/memory/`. Existing fact preserved: follow `CLAUDE.md` and keep it in sync with the Cursor rule.
- 2026-09-18: Auto `PROMPTS.md` index (`scripts/index-prompts.py` on stop) + `challenge-build-log.mdc` reminder bullets in `DECISIONS.md`. Candidate still types **In your own words** and **Did with it**.
- 2026-09-18: Pillar 4 — Sam’s morning dashboard (**S**). Needs-me + pipeline/KB + generated list.
- 2026-09-18: `STACK.md` aligned to SPEC — Fastify (not Hono), Prisma, Vite CSR kit, Anthropic official SDK, no LangChain/LangGraph, `@xenova/transformers` ingest + retrieve. `/api-docs.html`.
- 2026-09-18: Repo layout documented in `REPO_ARCHITECTURE.md` (candidate tree: `apps/backend` + `apps/frontend`). Backend tests: `apps/backend/test/`.
- 2026-09-18: Bootstrap runtime uses root npm workspaces + Node 22 Docker images. `make up` starts six services with hot reload; typecheck/lint/build and 2 API bootstrap tests pass.
- 2026-09-18: MinIO image moved from unavailable Docker Hub `minio/minio` to official `quay.io/minio/minio`.

## Open questions (candidate — not agent-filled)

- Data model (checkpoint 3): `documents.source` locked. Confirm `organizations` table vs enum; `generated_citations` → chunks vs jsonb.
- Product initialization after `make up`: migration + bucket + queue lifecycle.

## Known issues

- Backing resources start empty; scaffold runs, product does not until features are built.
- `DECISIONS.md` still has empty reminder blocks; `PROMPTS.md` auto-index fills from `prompts/`.
- Transcript hook needs trusted workspace / Hooks enabled in Cursor.
- Two backend API bootstrap tests; no frontend tests or CI.
- `npm audit --omit=dev`: current required `@xenova/transformers` line carries transitive protobufjs/sharp advisories; do not force-downgrade it without validating the required embedding stack.
