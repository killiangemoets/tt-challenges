# App architecture

Target process map for the Second Brain slice. Libraries and ports for **backing** services: [STACK.md](STACK.md). Product calls: [DECISIONS.md](DECISIONS.md). This file is the intended topology — not running until we add those services.

## Processes

| Piece | Role |
|---|---|
| **React SPA** (Vite, CSR) | Dashboard, ingest UI, chat, generated brief. Talks only to the API (HTTP + SSE). |
| **Fastify API** | App surface: upload / Ingest Seeds, chat retrieve+stream, generate brief, dashboard reads. Puts objects in MinIO, writes `documents` rows, enqueues ingest. Embeds queries with `@xenova/transformers`. Calls Anthropic (`messages.stream`). |
| **Ingest worker** | Separate consumer behind ElasticMQ. Does **not** serve HTTP. Extract text → chunk → embed (`@xenova/transformers`) → insert chunks into Postgres. Updates document status (including fail + Retry). |
| **ElasticMQ** | SQS-compatible ingest queue. API produces; worker consumes. |
| **MinIO** | Object store for uploaded/seeded files and generated briefs. |
| **Postgres + pgvector** | Metadata + chunk vectors. Draft tables: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). |
| **Anthropic** | Only allowed external network. Chat and generate. Not used for embeddings. |

Seeds live in `data/` on disk until **Ingest Seeds**; after that they are MinIO + a `documents` row like any other upload.

## Topology

```
                    ┌──────────────────────────────────────┐
                    │            Browser                    │
                    │         Vite React SPA                │
                    └──────────────────┬───────────────────┘
                                       │ HTTP / SSE
                                       ▼
                    ┌──────────────────────────────────────┐
                    │            Fastify API                │
                    │  ingest enqueue · retrieve · stream   │
                    └───┬──────────┬──────────┬─────────┬──┘
          enqueue ingest│          │          │         │ Anthropic
                        ▼          ▼          ▼         ▼
                 ┌───────────┐ ┌───────┐ ┌─────────┐ ┌──────────┐
                 │ ElasticMQ │ │ MinIO │ │Postgres │ │Anthropic │
                 │  ingest   │ │  S3   │ │+pgvector│ │  (ext.)  │
                 └─────┬─────┘ └───────┘ └─────────┘ └──────────┘
                       │ poll
                       ▼
                 ┌───────────┐
                 │  Worker   │
                 │  ingest   │
                 └───────────┘
```

## Ingest

API never runs extract/chunk/embed inline. Path: **MinIO object + `documents` row → queue → worker**.

```
 FE / Ingest Seeds          API                 MinIO           ElasticMQ           Worker              Postgres
        |                    |                    |                 |                  |                    |
        |-- .md + org ------>|                    |                 |                  |                    |
        |                    |-- PutObject ------>|                 |                  |                    |
        |                    |-- insert documents row ------------------------------------------>|
        |                    |-- SendMessage ---------------------->|                  |                    |
        |                    |                    |                 |<-- Receive ------|                    |
        |                    |                    |<-- GetObject ---|------------------|                    |
        |                    |                    |                 |                  | extract→chunk→embed
        |                    |                    |                 |                  |-- chunks + vectors>|
        |                    |                    |                 |                  |-- status ready/fail>|
```

Failed documents stay visible on the document row. Retry re-enqueues. No DLQ.

## Converse / generate (API path, not the worker)

```
 React SPA                 Fastify API                         Postgres+pgvector              Anthropic
     |                          |                                      |                          |
     |-- chat / generate ------>|                                      |                          |
     |                          |-- query embed (xenova, local)        |                          |
     |                          |-- retrieve (fund always + selected PC)|                          |
     |                          |                                      |                          |
     |                          |-- messages.stream (history + passages + versioned prompt) ----->|
     |<======= SSE tokens ======|<================ stream ========================================|
     |                          |                                      |                          |
     |                          |  generate only: persist brief        |                          |
     |                          |  (MinIO + documents kind=generated)  |                          |
```

Retrieval scope: fund always in; optional PC1 / PC2 / PC3; none selected = fund only. No citation, no claim.

## What this file does not lock

- Code packages and folders — [REPO_ARCHITECTURE.md](REPO_ARCHITECTURE.md) (`apps/frontend` + `apps/backend` with `api` / `worker` / `common`).
- Table/column schema — draft in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md); lock before the first Prisma migration.
- Queue name, bucket name, API/FE ports, compose vs host for SPA / API / worker — name them when we extend `docker-compose.yml`.
- HTTP paths, JSON/SSE shapes, and ingest-worker queue/status/chunk contract — [API_SPECS.md](API_SPECS.md).
