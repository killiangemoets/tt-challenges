# STACK — constraints and foundations

*We constrain the technology **families** — because the job is building in our stack — and leave every integration decision to you. How you wire these together is a thing we read, not a thing we prescribe.*

## What you get (already wired)

`make up` starts three **empty** backing services (see `docker-compose.yml`):

| Service | Image | Where | Credentials |
|---|---|---|---|
| **Postgres 16 + pgvector** | `pgvector/pgvector:pg16` | `localhost:5432` | `brain` / `brain`, db `secondbrain` |
| **MinIO** (S3-compatible object storage) | `minio/minio` | API `localhost:9000`, console `localhost:9001` | `minio-root` / `minio-secret` |
| **ElasticMQ** (SQS-compatible queue) | `softwaremill/elasticmq-native` | `localhost:9324` | any (local) |

No schema, no buckets, no queues exist yet — **creating them is part of your build** (from code, migrations, or an init script; your call, but it must happen on a clean `make up` + your documented steps). `make psql` gives you a SQL shell; the MinIO console shows buckets and objects; `make reset` wipes everything.

## The families (build within these)

- **Frontend:** React 18 + Vite, **TanStack Query** for server state. Component library / styling: your choice ([DESIGN.md](DESIGN.md) has brand guidance).
- **API:** Node/TypeScript-or-JS HTTP service. We use **Hono**; Express/Fastify are fine. Talk to Postgres however you like.
- **Knowledge base:** **Postgres + pgvector** for chunks/embeddings/metadata. Your schema is a first-class deliverable — we'll read it.
- **Pipeline:** **object storage (MinIO) + queue (ElasticMQ)** with async workers, using the AWS SDKs (S3/SQS — point them at the local endpoints, `forcePathStyle: true` for MinIO). This mirrors our production S3 + SQS exactly; a pipeline that skips the queue and does everything inline misses the point of the pillar.
- **AI layer:** **Anthropic** (key provided) for generation and conversation, via **LangChain / LangGraph or an equivalent agent structure** — or hand-rolled if you can argue it. Embeddings: your call (Anthropic-adjacent hosted, or a local/deterministic scheme — the corpus is small; simple works). How you keep generation grounded is a core read.
- **Runtime:** everything runs **locally under Docker** (compose for services; your app in containers or on the host — document it). The only external dependency allowed is the Anthropic API.

## What "production-shaped" means to us

Not polish — habits. The things we check because they predict how you'll build the real thing:

1. **Isolation is a data-layer concern.** Fund vs. portco provenance lives in the schema, not in `if` statements sprinkled through handlers. (Full enforcement is a *could* — thinking about it is a *must*.)
2. **Async work fails visibly.** A stuck or failed document shows up somewhere a user looks — status fields, a dashboard tile — not only in logs.
3. **The brain never lies.** No citation, no claim. "I don't know" is a feature.
4. **Secrets stay out of git.** The key lives in `.env` (gitignored); nothing sensitive committed.
5. **It runs on our machine.** Clean clone → `make up` → your documented steps. We do this first, before reading a line of code.

## Ground rules

- Don't swap the families (no Next.js-on-Vercel, no Pinecone, no Redis-as-the-queue) — the constraint *is* the exercise.
- Beyond the families: any library you want.
- Modify `docker-compose.yml` and the `Makefile` freely — they're starting points, not fixtures. Keep `make up` as the entry point.
