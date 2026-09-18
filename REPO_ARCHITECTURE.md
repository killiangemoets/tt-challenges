# Repo architecture — code layout

Process topology (SPA → API → queue → worker → MinIO / Postgres / Anthropic) lives in [ARCHITECTURE.md](ARCHITECTURE.md). HTTP and worker contracts live in [API_SPECS.md](API_SPECS.md). Schema draft: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). This file is the **codebase** map: packages, folders, who owns which runtime process, and what is deliberately *not* shared.

The package/runtime scaffold now exists under `apps/`. Product feature folders are added only when their first route or service is implemented.

---

## Shape: one git repo, two app packages

This is a **monorepo at the git level** (the challenge already is). It is **not** a Turbo/Nx workspace and **not** three published npm packages.

| Unit | Why |
|---|---|
| **`apps/frontend`** | Vite React SPA. Talks only HTTP + SSE to the API. |
| **`apps/backend`** | One Node/TypeScript package, **two process entrypoints**: Fastify API and ingest worker. |

API and worker share Prisma, MinIO, SQS, and the same `@xenova/transformers` model. Duplicating those across `apps/api` and `apps/worker` (or a third `packages/embeddings`) costs more than it saves in a 2–3 hour slice.

**Do not add** `packages/db`, `packages/queue`, `packages/shared` unless the same Zod DTOs are copied into both apps and it actually hurts. The FE/BE contract is [API_SPECS.md](API_SPECS.md); OpenAPI UI is `GET /api-docs.html`. Frontend may keep its own Zod for forms and URL state.

Root npm workspaces provide one lockfile and workspace scripts without adding Turbo/Nx.

---

## Target tree

```
tt-challenges/
├── apps/
│   ├── backend/
│   │   ├── prisma/                  # schema.prisma + migrations (Prisma’s usual root)
│   │   ├── src/
│   │   │   ├── api/                 # Fastify process only
│   │   │   │   ├── server.ts        # listen, plugins, CORS, swagger → /api-docs.html
│   │   │   │   └── routes/          # /api/v1 handlers; thin; call common/services
│   │   │   ├── worker/              # ElasticMQ consumer process only — no HTTP
│   │   │   │   └── main.ts
│   │   │   └── common/              # imported by api *and* worker
│   │   │       ├── database/        # Prisma client singleton
│   │   │       ├── schemas/         # Fastify request/response Zod
│   │   │       ├── helpers/         # S3/SQS clients, chunking, env
│   │   │       └── services/        # domain ops on top of Prisma (see below)
│   │   ├── test/                    # backend tests (sibling of src/, not under src/)
│   │   │   ├── api/                 # route / HTTP contract vs API_SPECS.md
│   │   │   ├── worker/              # ingest status machine, chunk insert, fail/retry
│   │   │   └── common/              # retrieve isolation, zod, chunker — no Anthropic
│   │   ├── package.json             # scripts: dev:api, dev:worker, test
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/              # shadcn / Radix
│       │   │   └── layout/          # app shell
│       │   ├── constants/
│       │   ├── hooks/
│       │   │   ├── data/            # TanStack Query (documents, dashboard, orgs)
│       │   │   └── ui/              # search params, debounce
│       │   ├── pages/               # thin route composition
│       │   ├── schemas/             # client Zod (forms, filters)
│       │   ├── helpers/
│       │   └── resources/           # axios + fetch SSE against /api/v1
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
├── data/                            # seed corpus (git); not the runtime store
├── context-brain/                   # product/customer brief (not runtime)
├── llm-prompts/v1/                  # Anthropic system prompts (chat + generate)
├── templates/portco-brief.md        # Dana memo skeleton (generate fills headings)
├── prompts/                         # session transcripts for reviewers — NOT LLM prompts
├── docker-compose.yml               # db, minio, queue (+ optional app services later)
├── Makefile                         # keep `make up` as the entry point
├── ARCHITECTURE.md                  # runtime topology
├── API_SPECS.md                     # HTTP + queue contract
├── DATABASE_SCHEMA.md               # Postgres draft
└── REPO_ARCHITECTURE.md             # this file
```

Flatten empty folders until a second caller exists. Do not pre-create unused `common/services` files.

---

## Processes vs folders

```
Browser
  └── apps/frontend          Vite CSR (react-router-dom)
           │ HTTP / SSE
           ▼
apps/backend  src/api        Fastify
           │ enqueue         retrieve + Anthropic stream + persist brief
           │                 query embed (xenova)
           ├──────────────► ElasticMQ
           ├──────────────► MinIO
           ├──────────────► Postgres+pgvector
           └──────────────► Anthropic (official SDK, API only)

apps/backend  src/worker     poll ElasticMQ
                             GetObject → extract → chunk → embed → chunks
                             status ready | failed on documents
```

| Process | Entrypoint | May do | Must not |
|---|---|---|---|
| SPA | Vite `dev` / static host | Call `/api/v1`, render dashboard / chat / memo | Talk to Postgres, MinIO, SQS, or Anthropic |
| API | `src/api/server.ts` | PutObject + insert `documents` + `SendMessage`; retrieve; `messages.stream`; persist generated briefs | Extract / chunk / embed **ingest** inline |
| Worker | `src/worker/main.ts` | Consume `{ documentId }`; GetObject; chunk; embed; replace chunks; set status | Serve HTTP; call Anthropic; ingest from git `data/` as system of record |

Same Docker image (or same `apps/backend` build) with two `CMD`s is fine. Two compose services, one build context.

---

## Backend `test/`

Sits at **`apps/backend/test/`**, next to `src/` — not `src/**/*.test.ts` and not a repo-root `/test`. Same package, so tests import `../src/...` without a publish step.

Mirror the production cut so a failing test names the process:

| Path | Covers |
|---|---|
| `test/api/` | Fastify inject against [API_SPECS.md](API_SPECS.md): `.md` only (400/415), org required, retry only from `failed`, generate 409 when KB empty, SSE event *types* (mock Anthropic) |
| `test/worker/` | `{ documentId }` → `processing` → chunks + `ready`, or `failed` + `errorMessage`; Retry replaces chunks; never reads git `data/` as system of record |
| `test/common/` | Retrieve SQL scope (fund always, optional one PC, never PC→PC, generated rows excluded); chunker; zod DTOs |

**Do not** call the live Anthropic API in tests. Stub `messages.stream`. Xenova can be stubbed in API/worker tests; a single helper test may load the real model if it stays fast enough — do not make every ingest test download the net.

STACK does not lock a runner. **Vitest** (or `node:test`) is fine; one runner, `package.json` `"test"`. No duplicate global DB bootstrap inside each file if you later add a shared `test/setup`. Challenge reviewers still run `make up` + [DECISIONS.md](DECISIONS.md); tests are for *your* isolation/status invariants, not a substitute for that path.

Frontend tests are out of this folder. Add `apps/frontend` tests only if you want them — not required to mirror `test/` on day one.

---

## `common/` ownership

### `database/`

Prisma client. Migrations live in `apps/backend/prisma/`. pgvector similarity may be `$queryRaw` if Prisma has no native `vector` type.

**Checkpoint 3 is not fully locked.** Do not add `schema.prisma` until the remaining calls are confirmed: `organizations` table vs enum-only on documents; `generated_citations` → `chunks` vs jsonb on the brief. Locked already: one `documents` table, `source` = `uploaded` | `generated`.

Isolation (fund vs portco) is a **data-layer** concern: retrieve `WHERE chunks.organization_id = ANY(scope)` with `scope = {fund} ∪ {selected PC or empty}`. Not handler `if`s.

### `services/`

Real domain operations used by more than one route or by both API and worker — not 1:1 Prisma wrappers.

| Service (illustrative) | Callers | Responsibility |
|---|---|---|
| Ingest enqueue / retry | API routes | Validate `.md`; MinIO + `documents` row (`source=uploaded`, `status=queued`); SQS `{ documentId }`; Retry only from `failed` |
| Ingest seeds | API | Walk `data/**/*.md`; org from path; same path as upload |
| Ingest process | **Worker only** | GetObject → extract → chunk → embed → delete+insert chunks → `ready` / `failed` + `errorMessage` |
| Retrieve | Chat + generate routes | Query embed (same xenova model as ingest); SQL in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md); uploaded + ready only; generated rows never retrieved |
| Generate persist | Brief stream route (after model) | PutObject markdown; insert `documents` `source=generated` `status=ready` `organization_id` = **portco**; `generated_citations`; **no chunks** |

### `schemas/`

Zod for Fastify bodies/query, aligned with [API_SPECS.md](API_SPECS.md) (`ErrorBody`, document DTOs, SSE event types).

### `helpers/`

Env (`ANTHROPIC_API_KEY`, Postgres, MinIO `forcePathStyle: true`, ElasticMQ endpoint), AWS SDK clients, markdown chunker, xenova embed wrapper (one model, two call sites: worker ingest + API query).

---

## Frontend layout

Pages stay thin: route → feature components. Server state in `hooks/data/` (TanStack Query). Mutations invalidate dashboard / documents queries. Forms: RHF + zod. Tables (pipeline / generated lists): TanStack Table only if a real table UI ships.

| Path | Role |
|---|---|
| `pages/` | Dashboard (Sam: needs-me, pipeline/KB, generated), chat, memo view |
| `hooks/data/` | `useDashboard`, `useDocuments`, `useOrganizations`, mutations: upload, ingest-seeds, retry |
| `resources/` | axios JSON; `fetch` + `ReadableStream` for `POST /chat/stream` and `POST /briefs/stream` (not `EventSource`) |
| `schemas/` | Upload modal (file + org), chat scope (optional PC1/PC2/PC3; UI states fund is always included) |
| `components/ui/` | shadcn/Radix |
| `components/layout/` | Shell; uploaded vs generated lists stay visually split |

Poll dashboard ~2s while any document is `queued` / `processing`, then stop ([API_SPECS.md](API_SPECS.md)).

---

## LLM prompts vs `prompts/`

| Path | What |
|---|---|
| `llm-prompts/v1/chat.md` | Chat system prompt |
| `llm-prompts/v1/portco-brief.md` | Generate grounding rules |
| `templates/portco-brief.md` | Dana’s headings (prompt ≠ template) |
| `prompts/` | Cursor/Claude **session transcripts** for reviewers |

Do **not** put Anthropic prompts under `apps/backend/src/prompts/` or repo `prompts/`. Load versioned files from `llm-prompts/v1/` at runtime; persist `prompt_version` / `template_version` on generated `documents` rows.

---

## Data flow (code path)

### Ingest (upload or Ingest Seeds)

1. SPA → `POST /api/v1/documents` or `POST /api/v1/ingest-seeds`
2. API: reject non-`.md` (FE also rejects) → PutObject → insert `documents` (`uploaded`, `queued`, org from modal or `data/` path) → `SendMessage` `{ documentId }`
3. Worker: `processing` → GetObject → extract → chunk → embed → replace chunks → `ready` or `failed` + `errorMessage`
4. SPA polls dashboard; failed rows in **Needs me**; Retry re-enqueues (no DLQ)

`data/` is the seed *source*. After Ingest Seeds, MinIO + `documents` is the system of record. Worker never treats the git tree as canonical.

### Converse

1. SPA `POST /api/v1/chat/stream` with history + optional `portcoOrganizationId`
2. API: xenova embed query → retrieve fund always + selected PC if any (none = fund only) → Anthropic `messages.stream` with passages as only evidence
3. SSE `delta` → FE typing effect; then `citations` (chunk ids); `done.unsupported` if KB silent
4. Chat is **not** persisted. Citations are **not** written to `generated_citations`

### Generate

1. SPA `POST /api/v1/briefs/stream` with required portco + chat `history`
2. Same retrieve as chat for that portco ∪ fund
3. Fill `templates/portco-brief.md`; stream `delta`s; persist MinIO + generated row + `generated_citations`
4. SPA routes to memo / dashboard **Generated** list

---

## Infra vs apps

`docker-compose.yml` runs `frontend`, `api`, and `worker` alongside `db`, `minio`, and `queue`. Backend API and worker reuse one Dockerfile with different commands. Source bind mounts provide hot reload; named `node_modules` volumes keep container dependencies isolated from the host.

`make up` builds and starts the complete scaffold. It intentionally does **not** migrate Prisma or create the MinIO bucket / ElasticMQ queue yet. Add that initialization with the first feature after checkpoint 3 is locked.

---

## Explicit non-goals for this layout

- No Next.js / SSR; no Hono; no LangChain / LangGraph
- No second embedder; no hosted vector DB
- No `users` / sessions / ACL tables (provenance ≠ enforcement)
- No `conversations` table (history is request-scoped)
- No chunks on generated documents (re-ingest cut)
- No DLQ; Retry is the failure UX
- No gold-plating one pillar’s folders while others have no routes

---

## Related docs

| File | Owns |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Runtime topology |
| [API_SPECS.md](API_SPECS.md) | Routes, SSE, queue body, status transitions |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Tables (draft) |
| [STACK.md](STACK.md) | Families and libraries |
| [SPEC.md](SPEC.md) | Product must/should/cut |
| [DECISIONS.md](DECISIONS.md) | Calls and how to run |
