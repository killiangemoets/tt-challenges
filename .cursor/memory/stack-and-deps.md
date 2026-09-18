# Stack and dependencies

## Runtime

- `make up` runs `frontend` (`:5173`), `api` (`:3000`), ingest `worker`, `db`, MinIO, and ElasticMQ. API/worker deploy Prisma migrations; API creates the `documents` bucket and `ingest` queue.
- Root npm workspaces + one lockfile. Node 22.18+ in app images; host Node/npm not required.
- Backing: Docker Desktop (or compatible), ~4GB free.

## Major dependencies

| Package / service | Role |
|-------------------|------|
| React 18 + Vite + TypeScript | Frontend SPA (CSR only; `react-router-dom`; no Next/SSR) |
| zod + react-hook-form | Client validation / forms |
| shadcn/ui + Radix UI | Components |
| TanStack Query | Server state |
| TanStack Table | Optional — when a table UI exists |
| axios | FE API client; BE outbound HTTP (not Anthropic) |
| tailwindcss + lucide-react + lodash | Styling, icons, helpers |
| prettier (FE+BE); eslint (BE) | Basic format/lint |
| Fastify | API |
| `@fastify/multipart` | Markdown upload parsing; 10 MB limit |
| Prisma | Schema/migrations/Postgres (pgvector via raw SQL if needed) |
| OpenAPI HTML | Served at `/api-docs.html` |
| Postgres 16 + pgvector `pgvector/pgvector:pg16` | Chunks, embeddings, metadata |
| MinIO `quay.io/minio/minio` | S3-compatible object storage |
| ElasticMQ `softwaremill/elasticmq-native` | SQS-compatible queue |
| AWS SDK S3/SQS | Pipeline; MinIO `forcePathStyle: true` |
| Anthropic official SDK | Converse/generate via `messages.stream`. **No LangChain/LangGraph.** |
| `@xenova/transformers` | Embeddings: ingest worker **and** query retrieve. Same model. Not Voyage/OpenAI. |
| `llm-prompts/v1/` | Versioned chat + generate system prompts (not `prompts/` transcripts) |
| `templates/portco-brief.md` | Fixed generate memo skeleton |

**Disallowed swaps:** Next.js / SSR, Hono, Pinecone, Redis-as-the-queue, LangChain/LangGraph, extra cloud APIs besides Anthropic (including hosted embeddings).

## Infrastructure

| Service | Host | Creds / notes |
|---------|------|----------------|
| `db` | `:5432` | user/pass `brain`, db `secondbrain`; volume `pgdata` |
| `minio` | API `:9000`, console `:9001` | `minio-root` / `minio-secret`; volume `miniodata` |
| `queue` | `:9324` | local any; no compose volume; CreateQueue via API |

`make reset` = `docker compose down -v` then `up`; this recreates app dependency volumes, applies the initial pgvector migration, seeds four organizations, and initializes the bucket/queue.

## Configuration

- `.env.example` → `.env`: optional-at-bootstrap `ANTHROPIC_API_KEY`, host ports, local DB/MinIO/SQS URLs/credentials, CORS, frontend API URL. Compose overrides internal hosts.
- `.gitignore`: `.env`, package/build/coverage caches, venv, `.DS_Store`.
- Hooks: `.cursor/hooks.json`, `.claude/settings.json` → export + `scripts/index-prompts.py`.
- Commands: `make up/down/reset/ps/logs/psql/build/typecheck/lint/test`.
- Root `package.json` workspaces + `package-lock.json`; backend/frontend Dockerfiles use `npm ci`.
