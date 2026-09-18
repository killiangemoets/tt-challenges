# Architecture

## Overview

- **Target process map:** repo-root `ARCHITECTURE.md` (ASCII topology). React SPA → Fastify API; ingest **worker** consumes ElasticMQ; MinIO objects; Postgres+pgvector; Anthropic from the API only.
- Runtime today: three empty Docker services in `docker-compose.yml`. App processes not added yet. Compose project name: `second-brain`. Extend compose/Makefile freely; keep `make up` as entry.

## Key directories

| Path | Role |
|------|------|
| `data/fund/raw/` | 4 fund markdown files (strategy, team, portfolio construction, talent thesis) |
| `data/portcos/PC1/` | Vantage Managed Services — `inbox/markdown/` + `inbox/360-feedback-2025.md` |
| `data/portcos/PC2/` | Cascade Care Group — `inbox/markdown/` + `inbox/q2-2026-board-update.md` |
| `data/portcos/PC3/` | Ridgeline Freight & Logistics — `inbox/markdown/` |
| `context-brain/` | Product/customer knowledge (not runtime config) |
| `scripts/export-transcript.sh` | Hook: copy transcript → `prompts/raw-session-<id>.jsonl` |
| `scripts/index-prompts.py` | Rebuild `PROMPTS.md` auto-index from those jsonl files |
| `prompts/` | Raw **session** transcripts (reviewers) — **not** Anthropic system prompts |
| `llm-prompts/v1/` | Versioned chat + generate system prompts |
| `templates/portco-brief.md` | Fixed Dana memo skeleton (generate fills; headings always kept) |
| `docker-compose.yml` / `Makefile` | Backing services lifecycle |

Typical portco docs: VCP, scorecards, board decks, org DD, leadership assessments, interview notes, competency frameworks, 360s. **Ingest this slice:** `.md` only (BE+FE). `inbox/office/` binaries are not parsed. Seeds via **Ingest Seeds** (org from path); uploads via Add-file (file + org).

## Boundaries (target shape from SPEC/STACK — not implemented)

- **Object storage (MinIO):** raw files.
- **Queue (ElasticMQ):** async ingest workers — not all-inline (pillar point).
- **Postgres + pgvector:** chunks, embeddings, metadata, generated artifacts.
- **API (Fastify + Prisma):** app surface; **UI (Vite React SPA, TanStack Query, shadcn/Radix).** Docs at `/api-docs.html`.
- **Anthropic:** official SDK in the API (no LangChain/LangGraph). Local `@xenova/transformers` for embeddings.
- Only external network: Anthropic API.

## Data flow (expected)

1. **Ingest Seeds** or **Add file** → **MinIO object + `documents` row** → ElasticMQ → worker: extract text → chunk → embed → insert chunks; status on the document row. Failed: UI error + Retry (no DLQ). `data/` is the seed *source*, not the runtime store.
2. Chat: `@xenova/transformers` query embed → retrieve `fund` always, plus selected portco if any (none = fund only) → Anthropic (history + passages); stream SSE API→UI; citations to real passages; silence → “I don’t know”.
3. From chat: generate **portco brief** from `templates/portco-brief.md` → MinIO + `documents` row `source=generated` (same table; UI list split) → memo UI with citations/flags. Re-ingest into retriever is cut for now.
4. Dashboard (Sam): needs-me + pipeline/KB + generated list. Single-doc failure must not kill the pipeline. Non-`.md` rejected at API and UI.

## Decisions

- Processes: SPA + API + ingest worker (queue). Schema draft: one `documents` table (`source` uploaded|generated). See `DATABASE_SCHEMA.md`.
