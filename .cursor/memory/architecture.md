# Architecture

## Overview

- **No application architecture exists yet.** Candidate designs schema, API, workers, UI.
- Runtime today: three empty Docker services in `docker-compose.yml`. App may be compose services or host processes — document in `DECISIONS.md`.
- Compose project name: `second-brain`. Extend compose/Makefile freely; keep `make up` as entry.

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
| `prompts/` | Raw AI logs (source of truth for review) |
| `docker-compose.yml` / `Makefile` | Backing services lifecycle |

Typical portco docs: VCP, scorecards, board decks, org DD, leadership assessments, interview notes, competency frameworks, 360s.

## Boundaries (target shape from SPEC/STACK — not implemented)

- **Object storage (MinIO):** raw files.
- **Queue (ElasticMQ):** async ingest workers — not all-inline (pillar point).
- **Postgres + pgvector:** chunks, embeddings, metadata, generated artifacts.
- **API (Node HTTP):** app surface; **UI (React + TanStack Query).**
- **Anthropic:** converse + generate; embeddings candidate’s call (corpus is small).
- Only external network: Anthropic API.

## Data flow (expected)

1. Seed/upload → MinIO → enqueue → worker parse/chunk/embed → Postgres; per-doc status queued/processing/ready/failed in UI.
2. Chat retrieves real passages; answers cite them; silence → “I don’t know”.
3. Generate document from conversation + retrieval; persist; list in KB; dashboard shows KB + pipeline + generated.
4. Single-doc failure must not kill the pipeline.

## Decisions

- App tree, schema, sync vs async split, embedding strategy: **candidate checkpoints** — not chosen. See `active-context.md`.
