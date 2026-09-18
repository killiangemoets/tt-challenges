# Stack and dependencies

## Runtime

- **No app runtime in repo yet.** Candidate adds a Vite React 18 **SPA** (host or Docker) and a **Fastify** TypeScript API.
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
| Prisma | Schema/migrations/Postgres (pgvector via raw SQL if needed) |
| OpenAPI HTML | Served at `/api-docs.html` |
| Postgres 16 + pgvector `pgvector/pgvector:pg16` | Chunks, embeddings, metadata |
| MinIO | S3-compatible object storage |
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

`make reset` = `docker compose down -v` then `up`. Empty until candidate creates schema/buckets/queues (code, migrations, or init — must run after clean `make up`).

## Configuration

- `.env.example` → `.env`: `ANTHROPIC_API_KEY` only (app env vars added with the services).
- `.gitignore`: `.env`, `node_modules/`, `dist/`, `build/`, venv, `.DS_Store`.
- Hooks: `.cursor/hooks.json`, `.claude/settings.json` → export + `scripts/index-prompts.py`.
- No `package.json` / lockfiles yet.
