# Stack and dependencies

## Runtime

- **No app runtime in repo.** Candidate adds React 18 + Vite (host or Docker) and Node HTTP API.
- Backing: Docker Desktop (or compatible), ~4GB free.

## Major dependencies (families — libraries inside OK)

| Package / service | Role |
|-------------------|------|
| React 18 + Vite + TanStack Query | Frontend / server state |
| Node HTTP (Hono preferred; Express/Fastify OK) | API |
| Postgres 16 + pgvector `pgvector/pgvector:pg16` | Chunks, embeddings, metadata |
| MinIO | S3-compatible object storage |
| ElasticMQ `softwaremill/elasticmq-native` | SQS-compatible queue |
| AWS SDK S3/SQS | Pipeline; MinIO `forcePathStyle: true` |
| Anthropic + LangChain/LangGraph or equivalent | Converse/generate agent layer |
| Embeddings | Candidate’s call (hosted or local/deterministic) |

**Disallowed swaps:** Next.js-on-Vercel, Pinecone, Redis-as-the-queue, extra cloud APIs besides Anthropic.

## Infrastructure

| Service | Host | Creds / notes |
|---------|------|----------------|
| `db` | `:5432` | user/pass `brain`, db `secondbrain`; volume `pgdata` |
| `minio` | API `:9000`, console `:9001` | `minio-root` / `minio-secret`; volume `miniodata` |
| `queue` | `:9324` | local any; no compose volume; CreateQueue via API |

`make reset` = `docker compose down -v` then `up`. Empty until candidate creates schema/buckets/queues (code, migrations, or init — must run after clean `make up`).

## Configuration

- `.env.example` → `.env`: `ANTHROPIC_API_KEY` only.
- `.gitignore`: `.env`, `node_modules/`, `dist/`, `build/`, venv, `.DS_Store`.
- Hooks: `.cursor/hooks.json`, `.claude/settings.json` → export + `scripts/index-prompts.py`.
- No `package.json` / lockfiles yet.
