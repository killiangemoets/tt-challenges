# STACK — constraints and foundations

*We constrain the technology **families** — because the job is building in our stack — and lock a few libraries (simple RAG, local embeddings, the FE/BE kits below). Schema, chunking, and screen layout stay yours.*

## What you get (already wired)

`make up` starts three **empty** backing services (see `docker-compose.yml`):

| Service | Image | Where | Credentials |
|---|---|---|---|
| **Postgres 16 + pgvector** | `pgvector/pgvector:pg16` | `localhost:5432` | `brain` / `brain`, db `secondbrain` |
| **MinIO** (S3-compatible object storage) | `minio/minio` | API `localhost:9000`, console `localhost:9001` | `minio-root` / `minio-secret` |
| **ElasticMQ** (SQS-compatible queue) | `softwaremill/elasticmq-native` | `localhost:9324` | any (local) |

No schema, no buckets, no queues exist yet — **creating them is part of your build** (from code, migrations, or an init script; your call, but it must happen on a clean `make up` + your documented steps). `make psql` gives you a SQL shell; the MinIO console shows buckets and objects; `make reset` wipes everything.

## The families (build within these)

- **Frontend:** React 18 + **Vite**, TypeScript, **client-side rendering only** (SPA — no Next.js, no SSR).
- **API:** Node **TypeScript** HTTP on **Fastify** (not Hono).
- **Knowledge base:** **Postgres + pgvector** for chunks/embeddings/metadata, accessed via **Prisma**. Isolation (fund vs portco) lives in the schema.
- **Pipeline:** **object storage (MinIO) + queue (ElasticMQ)** with async workers, using the AWS SDKs (S3/SQS — point them at the local endpoints, `forcePathStyle: true` for MinIO). Ingest path: **put object in MinIO + insert a `documents` row**, then enqueue. Worker: extract text → chunk → embed → insert. Skipping the queue and doing everything inline misses the point of the pillar.
- **Embeddings:** local **`@xenova/transformers`** in the ingest worker **and** at query time. Same model both ways. Vectors in pgvector. **No** second embedder, **no** Voyage/OpenAI embeddings API (Anthropic has none).
- **Generation / chat:** **Anthropic official SDK** (`messages.stream`) in the Fastify API — retrieve, then stream. **No LangChain / LangGraph**. Versioned system prompts in-repo (e.g. `llm-prompts/v1/`), **not** in `prompts/` (session transcripts). Document template: `templates/portco-brief.md`.
- **Runtime:** everything runs **locally under Docker** (compose for services; your app in containers or on the host — document it). The only external dependency allowed is the Anthropic API.

## Backend libraries

TypeScript throughout. Keep configs **basic** (working, not a lint science project).

| Package | Role |
|---|---|
| **Fastify** | HTTP API |
| **zod** | Request/response validation |
| **Prisma** | Schema, migrations, Postgres access (pgvector queries may be `$queryRaw` if Prisma has no native type) |
| **axios** | Outbound HTTP where the official SDKs are not used |
| **prettier** + **eslint** | Format + lint |
| OpenAPI → **`/api-docs.html`** | Generated API docs served at that URL (e.g. `@fastify/swagger` + static HTML / Swagger UI) |

Anthropic: official SDK, not axios-wrapped LangChain.

## Frontend libraries

Vite SPA. **Everything client-side** — `react-router-dom` for routes; no RSC, no Next.

| Package | Role |
|---|---|
| **TypeScript** + **React 18** | UI |
| **zod** | Shared/client schemas |
| **react-hook-form** | Forms (upload modal, filters) |
| **shadcn/ui** + **Radix UI** | Components (shadcn sits on Radix) |
| **TanStack Query** | Server state |
| **TanStack Table** | Only when a real table UI exists (dashboard lists) — not a required install on day one |
| **axios** | API client |
| **tailwindcss** | Styling |
| **lodash** | Small helpers; don't lodash-wrap the product |
| **lucide-react** | Icons |
| **react-router-dom** | Client routing |
| **prettier** | Format (basic) |

Brand tokens still follow [DESIGN.md](DESIGN.md).

## What "production-shaped" means to us

Not polish — habits. The things we check because they predict how you'll build the real thing:

1. **Isolation is a data-layer concern.** Fund vs. portco provenance lives in the schema, not in `if` statements sprinkled through handlers. (Full enforcement is a *could* — thinking about it is a *must*.)
2. **Async work fails visibly.** A stuck or failed document shows up somewhere a user looks — status fields, a dashboard tile — not only in logs.
3. **The brain never lies.** No citation, no claim. "I don't know" is a feature.
4. **Secrets stay out of git.** The key lives in `.env` (gitignored); nothing sensitive committed.
5. **It runs on our machine.** Clean clone → `make up` → your documented steps. We do this first, before reading a line of code.

## Ground rules

- Don't swap the families (no Next.js-on-Vercel, no Hono, no Pinecone, no Redis-as-the-queue, no hosted vector DB).
- Don't add LangChain / LangGraph, extra embedding SaaS, or any network besides Anthropic.
- Beyond this list: chunking helpers, logging, Fastify plugins you actually need.
- Modify `docker-compose.yml` and the `Makefile` freely — they're starting points, not fixtures. Keep `make up` as the entry point.
