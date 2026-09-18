# API & ingest worker specs — Second Brain (thin slice)

Contract for the Fastify API **and** the ingest worker. Implement FE, API, and worker against this file; do not invent extra routes, queue payloads, or status transitions without updating it.

Sources: [SPEC.md](SPEC.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [ARCHITECTURE.md](ARCHITECTURE.md), [STACK.md](STACK.md). Schema is still a **draft** until checkpoint 3 is fully locked; this contract assumes the draft (`organizations` table, `generated_citations` → `chunks`). If those two calls flip, update the types here in the same change.

The SPA talks **only** to the API (HTTP + SSE). The worker has **no HTTP surface**. It consumes ElasticMQ and writes Postgres + reads MinIO.

---

## Conventions

| Topic | Rule |
|---|---|
| Origin | Local API: `http://localhost:3000`. Paths below are origin-relative. |
| Prefix | App JSON/SSE: **`/api/v1`**. Ops/docs stay unversioned. |
| Auth | None. No users, no sessions. |
| Encoding | UTF-8. JSON `Content-Type: application/json` unless noted. |
| Time | ISO-8601 UTC (`2026-09-18T10:43:00.000Z`). |
| IDs | UUID v4 strings. |
| Validation | Fastify + **zod**. 400 on schema fail. |
| `.md` only | Upload and seeds: reject non-markdown. FE and API both enforce. |
| Isolation | Retrieve/generate **scope in SQL**, not prompt-only. Fund always in retrieve set. Chat: fund ∪ 0–3 selected portcos (fund-side user). Generate: exactly one portco ∪ fund. |
| CORS | Allow the Vite SPA origin (dev default `http://localhost:5173`). |
| Docs | Human docs: this file. Generated OpenAPI UI: **`GET /api-docs.html`**. |

### Error envelope (all non-SSE JSON errors)

```ts
type ErrorBody = {
  error: {
    code: ErrorCode;
    message: string; // safe to show Sam
    details?: unknown; // zod issues, etc. — optional
  };
};

type ErrorCode =
  | "bad_request"
  | "unsupported_media_type"
  | "not_found"
  | "conflict"
  | "failed_dependency" // Anthropic / missing key
  | "internal";
```

| HTTP | When |
|---|---|
| 400 | Zod / missing fields / fund used where a portco is required |
| 404 | Unknown id |
| 409 | Illegal state (retry on non-failed, generate while no ready KB, etc.) |
| 415 | File is not `.md` (extension **and** `text/markdown` / `text/plain` / empty type ok; binaries no) |
| 503 | Anthropic unavailable or `ANTHROPIC_API_KEY` missing (chat / generate only) |
| 500 | Unexpected |

SSE failures after headers are sent: emit an `error` event, then close. Do not mix a JSON `ErrorBody` onto an already-open stream.

### SSE (chat + generate)

- **Method is POST** (body required). Do **not** use `EventSource` (GET-only). FE: `fetch` + `ReadableStream`.
- Response: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, no buffering.
- Each event is one JSON object:

```
event: message
data: {"type":"delta","text":"..."}

```

If `event:` is omitted, default `message`. Clients should parse `data` JSON and switch on `type`.

---

## Shared schemas

Align with `DATABASE_SCHEMA.md`. List payloads **omit** markdown bodies.

```ts
type OrganizationSlug = "fund" | "pc1" | "pc2" | "pc3";
type OrganizationKind = "fund" | "portco";
type DocumentSource = "uploaded" | "generated";
type DocumentOrigin = "seed" | "upload"; // uploaded only
type DocumentStatus = "queued" | "processing" | "ready" | "failed";

type Organization = {
  id: string;
  slug: OrganizationSlug;
  kind: OrganizationKind;
  name: string;
};

type OrganizationRef = Pick<Organization, "id" | "slug" | "kind" | "name">;

type Flag = {
  code: string; // e.g. "single_source"
  detail: string;
  section?: string; // template heading when known
};

/** Passage used as evidence. Chat sets `marker`; generate sets `section` — mutually exclusive. */
type Citation = {
  chunkId: string;
  documentId: string;
  filename: string;
  organization: OrganizationRef;
  index: number; // chunk order in the file
  content: string; // exact stored passage
  /** Chat: 1-based marker matching `[n]` in the answer text. Generate: omitted. */
  marker?: number;
  /** Generate: template heading. Chat: omitted. */
  section?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type UploadedDocument = {
  id: string;
  source: "uploaded";
  origin: DocumentOrigin;
  status: DocumentStatus;
  organization: OrganizationRef;
  filename: string;
  seedPath: string | null;
  errorMessage: string | null;
  attemptCount: number;
  /** `count(*)` of chunks for this id. 0 unless status = ready. */
  chunkCount: number;
  readyAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SourceDocumentRef = {
  id: string;
  filename: string;
  organization: OrganizationRef;
};

type GeneratedDocument = {
  id: string;
  source: "generated";
  origin: null;
  status: "ready";
  /** Portco the brief is about — never fund. */
  organization: OrganizationRef;
  filename: string;
  title: string;
  promptVersion: string; // e.g. "llm-prompts/v1/portco-brief.md"
  templateVersion: string; // e.g. "templates/portco-brief.md"
  createdByLabel: string; // default "Sam"
  sourceDocuments: SourceDocumentRef[];
  flags: Flag[];
  readyAt: string;
  createdAt: string;
  updatedAt: string;
};

type DocumentListItem = UploadedDocument | GeneratedDocument;

type UploadedDocumentDetail = UploadedDocument & {
  markdown: string; // from MinIO
  /** Bytes of the stored object. */
  sizeBytes: number;
};

type GeneratedDocumentDetail = GeneratedDocument & {
  markdown: string;
  sizeBytes: number;
  citations: Citation[]; // `section` required
};
```

Query enums are lowercase strings matching the types above.

---

## Route index

| Method | Path | Pillar | Purpose |
|---|---|---|---|
| GET | `/health` | ops | Liveness |
| GET | `/api-docs.html` | ops | Generated OpenAPI UI |
| GET | `/api/v1/organizations` | ingest / chat / generate | Fund + portco dropdowns |
| GET | `/api/v1/dashboard` | dashboard | Sam’s morning board (one round-trip) |
| GET | `/api/v1/documents` | dashboard | Filterable lists / polling (`q` filename/title) |
| POST | `/api/v1/documents` | ingest | Add file (multipart) |
| GET | `/api/v1/documents/:id` | dashboard / generate | Open pipeline row or memo |
| POST | `/api/v1/documents/retry` | ingest | Batch re-enqueue (register **before** `:id/retry`) |
| POST | `/api/v1/documents/:id/retry` | ingest | Re-enqueue one failed/stuck upload |
| POST | `/api/v1/ingest-seeds` | ingest | Copy `data/*.md` → MinIO + rows + queue |
| GET | `/api/v1/chunks/:id` | converse / generate | Open source, find the passage |
| POST | `/api/v1/chat/stream` | converse | Grounded SSE chat |
| POST | `/api/v1/briefs/stream` | generate | Portco brief SSE, then persist |

Not in this slice (do not add): login, users, conversations CRUD, DLQ, Office upload, PDF export, re-ingest generated into retrieve, websocket, worker HTTP.

### Worker (not HTTP)

| Piece | Spec |
|---|---|
| Queue | ElasticMQ, name `ingest` |
| Message | `{ documentId }` |
| Pipeline | GetObject → extract → chunk → embed → replace chunks → `ready` / `failed` |
| Full spec | [Ingest worker](#ingest-worker) |

---

## Ops

### `GET /health`

**Input:** none.

**Output `200`:**

```ts
type HealthResponse = {
  status: "ok";
};
```

Does not prove Postgres/MinIO/queue. App process only.

### `GET /api-docs.html`

Static/generated Swagger UI. Not a JSON resource.

---

## Organizations

### `GET /api/v1/organizations`

Four seed rows. Not creatable from the UI.

**Input:** none.

**Output `200`:**

```ts
type ListOrganizationsResponse = {
  organizations: Organization[];
};
```

Order: `fund`, `pc1`, `pc2`, `pc3`.

**FE:** Add-file org dropdown; chat scope = multi-select **portco** chips (hide or disable `kind = fund`; copy must say fund is always retrieved). Generate: pick **one** portco (do not inherit a multi chat scope).

---

## Dashboard

### `GET /api/v1/dashboard`

Sam’s one view. Prefer this on first paint. Poll `GET /api/v1/documents` (or this) while statuses are `queued` / `processing`.

**Input:** none.

**Output `200`:**

```ts
type DashboardResponse = {
  needsMe: UploadedDocument[];
  pipeline: UploadedDocument[];
  generated: GeneratedDocument[];
};
```

| Field | SQL |
|---|---|
| `needsMe` | `source = uploaded` AND (`status = failed` OR stuck). **Stuck:** `status = processing` AND `updatedAt` older than **10 minutes**. Sort: `updatedAt` desc. |
| `pipeline` | `source = uploaded`, all statuses. Sort: `createdAt` desc. |
| `generated` | `source = generated`. Sort: `createdAt` desc. |

No vanity totals. Empty arrays, not `null`.

---

## Documents

### `GET /api/v1/documents`

**Query:**

```ts
type ListDocumentsQuery = {
  source?: DocumentSource;
  status?: DocumentStatus; // uploaded only; ignore/400 if source=generated and not ready
  organizationId?: string; // uuid
  origin?: DocumentOrigin;
  /** Case-insensitive substring on filename (uploaded) and filename+title (generated). Trimmed; max 120 chars; empty = ignored. */
  q?: string;
};
```

**Output `200`:**

```ts
type ListDocumentsResponse = {
  documents: DocumentListItem[];
};
```

Matching for `q`: `ILIKE '%' || q || '%'` — no full-text index, no ranking, no search over chunk content. **400** if `q` exceeds 120 chars.

Sort: `createdAt` desc. No pagination this slice (corpus is small).

**Invariant:** `status = "ready"` AND `chunkCount === 0` is a bug, not a state. Worker already fails zero-chunk ingest as `empty_content`. If a ready row ever has zero chunks, the UI treats it as failed.

### `POST /api/v1/documents`

Add file. **Multipart**, not JSON.

**Headers:** `Content-Type: multipart/form-data`

**Parts:**

| Part | Type | Rules |
|---|---|---|
| `file` | file | Required. Original filename must end `.md`. Body is markdown. |
| `organizationId` | text | Required. UUID of fund or a portco. |

**Output `201`:**

```ts
type CreateUploadedDocumentResponse = UploadedDocument; // status: "queued"
```

Server: PutObject MinIO → insert `documents` (`source=uploaded`, `origin=upload`, `status=queued`, `size_bytes` from the object) → enqueue `{ documentId }`. **Do not** chunk/embed inline.

**Errors:** 400 missing parts / unknown org; 415 not markdown.

### `GET /api/v1/documents/:id`

**Params:** `id` uuid.

**Output `200`:** `UploadedDocumentDetail | GeneratedDocumentDetail` (discriminate on `source`).

**404** if missing.

**FE:** pipeline row + error; generated memo (markdown + citations + flags + metadata).

### `POST /api/v1/documents/:id/retry`

Re-enqueue. No DLQ. Worker deletes existing chunks for this id before re-insert.

**Params:** `id` uuid. **Body:** empty object `{}` or none.

**Output `200`:** `UploadedDocument` with `status: "queued"`, `errorMessage: null`, `attemptCount` incremented.

**409** `conflict` unless `source = uploaded` AND (`status = failed` OR stuck processing as defined on the dashboard). **404** unknown id.

### `POST /api/v1/documents/retry`

Batch Retry all on Needs me. Register this route **before** `POST /documents/:id/retry`.

**Body:**

```ts
type BatchRetryRequest = {
  documentIds: string[]; // 1..50 uuids, unique
};
```

**Output `200`:**

```ts
type BatchRetryResponse = {
  /** Re-enqueued, status now "queued". */
  retried: UploadedDocument[];
  /** Refused ids — partial success is normal. */
  rejected: Array<{
    documentId: string;
    code: "not_found" | "conflict";
    message: string;
  }>;
};
```

Always `200` when the body validates, even if `retried` is empty. **400** on an empty array, >50 ids, or a non-uuid. Eligibility per document is identical to single retry. Each eligible row is re-enqueued independently (MinIO untouched; `attemptCount` bumped). No transaction across documents.

---

## Ingest seeds

### `POST /api/v1/ingest-seeds`

Copies each markdown file under `data/` into MinIO, inserts a `documents` row (org from path: `data/fund/` → fund, `data/portcos/PC1|PC2|PC3/` → that portco), enqueues. **Does not** read `data/` as the retrieve store after this. Skips `inbox/office/` and non-`.md`.

**Input:** empty JSON `{}` or no body.

**Output `200`:**

```ts
type IngestSeedsResponse = {
  created: number;
  skipped: number; // already present: unique (organizationId, seedPath)
  documents: UploadedDocument[]; // newly created only, status queued
};
```

Idempotent on seed path. Always 200 even if `created = 0`.

---

## Chunks (citation target)

### `GET /api/v1/chunks/:id`

**Params:** `id` uuid.

**Query:**

```ts
type ChunkQuery = {
  /** "none" (default) | "neighbors" (adds prev/next chunk) */
  context?: "none" | "neighbors";
};
```

**Output `200`:**

```ts
type ChunkResponse = {
  id: string;
  index: number;
  content: string;
  /** Nearest preceding markdown ATX heading in the source file, if any. */
  heading: string | null;
  document: {
    id: string;
    filename: string;
    source: "uploaded";
    organization: OrganizationRef;
    chunkCount: number;
  };
  /** Present only when context=neighbors. Either side may be null at a file edge. */
  context?: {
    previous: { id: string; index: number; content: string } | null;
    next: { id: string; index: number; content: string } | null;
  };
};
```

`heading` is stored on `chunks.heading` at ingest (ATX split already computed). **404** if missing (including chunks that belonged to a deleted doc). Generated rows have no chunks.

**FE:** citation drawer — passage in place + heading; optional `GET /documents/:id` for full markdown. Use `?context=neighbors` for the drawer.

---

## Chat

### `POST /api/v1/chat/stream`

Grounded RAG. Query embed = **same** `@xenova/transformers` model as ingest. Retrieve: **fund always** ∪ zero or more selected portcos (max 3). Empty / omitted → **fund only**. Only `source = uploaded` AND `status = ready` chunks. History is sent to Anthropic; retrieve runs **per this question** with the **current** scope.

This slice has no auth; the only user is fund-side (Sam, Hema). Cross-portco retrieve is allowed **for that user**. Isolation that matters commercially (a Portco Workspace tenant never seeing another portco) is future auth clamping this array — not an arity limit of one. Generate still takes exactly one portco (see below).

Versioned system prompt: `llm-prompts/v2/chat.md` (not `prompts/`). Instructs the model to end grounded clauses with 1-based markers: `Attrition in the service desk ran 31% in Q2 [1][2].` Markers are assigned in passage order, contiguous, and may repeat.

**Input JSON:**

```ts
type ChatStreamRequest = {
  message: string; // current user turn, min 1 char
  history: ChatMessage[]; // prior turns only; default []
  /** Zero or more portco org ids. Empty / omitted → fund only. Max 3. Order irrelevant; duplicates rejected. */
  portcoOrganizationIds?: string[];
  /** Deprecated: treated as a one-element `portcoOrganizationIds`. 400 if both are sent. */
  portcoOrganizationId?: string | null;
};
```

**400** if any id is unknown, is the fund org, has `kind != "portco"`, the array is longer than 3, or contains duplicates. **400** if both `portcoOrganizationId` and `portcoOrganizationIds` are present.

**Output:** SSE, then close.

```ts
type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "citations"; citations: Citation[] } // after the answer; each has `marker`; `section` omitted
  | { type: "done"; unsupported: boolean } // true when the model / API judged the KB silent
  | { type: "error"; code: ErrorCode; message: string };
```

Event order: zero or more `delta` → optional `citations` → `done` **or** `error`. Per-token citation payloads remain cut: FE renders live `[n]` markers **only after** the `citations` event; during streaming `[n]` is inert text.

Unmatched `[n]` in the text: emit citations the server can back; FE renders unmatched markers as plain text, never as a live control. A citation with no matching `[n]` is still returned (`marker` set; FE may list under “also retrieved”).

If the KB cannot support the answer: still stream the refusal text as `delta`s; `citations` is `[]` or omitted; `done.unsupported = true`; answer text must contain no markers. **No citation, no claim.**

Chat is **not** persisted. Citations are **not** written to `generated_citations`.

**FE:** multi-select portco chips; the scope line names every org in the retrieve set, fund included.

---

## Generate (portco brief)

### `POST /api/v1/briefs/stream`

From chat, for Dana. Fill `templates/portco-brief.md` (keep every heading; gaps stay visible). System prompt: `llm-prompts/v1/portco-brief.md`. Retrieve is **this one portco ∪ fund** (not the possibly-multi chat scope). Persist at end: MinIO + `documents` `source = generated`, `status = ready`, `organization_id` = **the portco** (not fund). Insert `generated_citations` (`section` = template heading; no `marker`). **Do not** create chunks for the brief. The FE asks which portco at generate time.

**Input JSON:**

```ts
type BriefStreamRequest = {
  portcoOrganizationId: string; // required, kind = portco
  history: ChatMessage[]; // chat context; default []
  createdByLabel?: string; // default "Sam"
};
```

**400** if org is missing, unknown, or `kind = fund`. **409** if that retrieve scope has zero ready uploaded documents.

**Output:** SSE.

```ts
type BriefStreamEvent =
  | { type: "delta"; text: string } // markdown as generated
  | { type: "persisted"; document: GeneratedDocumentDetail }
  | { type: "error"; code: ErrorCode; message: string };
```

Order: `delta`* → `persisted` **or** `error`. No separate citations event: they are on `document.citations`.

`filename` example: `{slug}-portco-brief-{yyyy-mm-dd}.md`. `title` from the template H1 / portco name.

**FE:** typing into a memo layout; on `persisted`, route to `/` dashboard generated list or a memo page keyed by `document.id`. Uncited streamed prose is not evidence — only `document.citations`.

---

## FE mapping (who calls what)

| UI | Calls |
|---|---|
| Add-file modal | `GET organizations` then `POST /documents` |
| Ingest Seeds | `POST /ingest-seeds` then poll dashboard/documents |
| Pipeline / KB table | `GET /dashboard` or `GET /documents?source=uploaded` |
| Needs me + Retry | dashboard `needsMe` → `POST /documents/:id/retry` or batch `POST /documents/retry` |
| Open failed error | `errorMessage` on list, or `GET /documents/:id` |
| Document library | `GET /documents` with `source` / org / status / `q` |
| Chat | `POST /chat/stream` (`fetch` SSE); `portcoOrganizationIds` + fund always |
| Generate brief | `POST /briefs/stream` with **one** portco + `history` |
| Open memo | `GET /documents/:id` (`source = generated`) |
| Citation | `GET /chunks/:id?context=neighbors` and/or parent `GET /documents/:id` |

Poll interval suggestion: 2s while any `queued`/`processing`, then stop.

---

## Ingest worker

Separate process. **Does not** serve HTTP. **Does not** call Anthropic. **Does not** ingest from the git `data/` tree (that is API **Ingest Seeds** only). API never extract/chunk/embeds inline.

```
API: PutObject + insert documents (queued) + SendMessage
        → ElasticMQ `ingest`
Worker: ReceiveMessage → processing → GetObject → extract → chunk → embed
        → txn: delete chunks + insert chunks + ready
        or: failed + errorMessage
        → DeleteMessage
```

### Process & boot

| Topic | Spec |
|---|---|
| Runtime | Node TypeScript, same repo as the API. Own compose service or host process — document in `DECISIONS.md`. |
| Boot | Ensure SQS queue `ingest` exists (`CreateQueue` if missing). Does **not** create the MinIO bucket (API owns that) but must tolerate the bucket already existing. |
| Poll | Long poll: `WaitTimeSeconds = 20`, `MaxNumberOfMessages = 1`. |
| Concurrency | **1** in-flight document this slice (xenova is memory-heavy; keep it simple). |
| Stop | Finish or fail the current document, then exit. Do not leave `processing` without a later redelivery. |

No worker health port. Liveness = process up + it is polling. Sam sees truth on the document row (`queued` / `processing` / `ready` / `failed`).

### Queue (ElasticMQ / SQS)

| Topic | Spec |
|---|---|
| Endpoint | Compose `queue` — `http://localhost:9324` from host; in-compose use the service DNS. |
| Credentials | Local dummy (`test` / `test` is fine). |
| Queue name | `ingest` |
| DLQ | **None.** Failed work is a row, not a second queue. |
| Visibility timeout | **300s** (cold xenova + embed). If the worker dies mid-job, the message returns and another attempt starts. |
| Producer | API only: after MinIO + `documents` row commit (`POST /documents`, ingest-seeds, retry). |
| Consumer | Worker only. |

**Message body** (JSON string, no SQS attributes required):

```ts
type IngestQueueMessage = {
  documentId: string; // uuid, documents.id, source = uploaded
};
```

Invalid JSON / missing `documentId`: log, **DeleteMessage** (poison; nothing to retry). Do not DLQ.

### MinIO

Worker **GetObject** only. Never Put/Delete objects.

| Topic | Spec |
|---|---|
| Bucket | `documents` (API creates on boot) |
| Object key | `documents.storage_key` on the row — do not reconstruct from filename |

**Key format (API writes, worker reads):**

```
uploaded/{organizationSlug}/{documentId}/{filename}
generated/{organizationSlug}/{documentId}/{filename}
```

`filename` is the display name (must end `.md`). Worker never touches `generated/`.

SDK: AWS S3, `forcePathStyle: true`, endpoint MinIO `:9000` (or compose DNS).

### Who may be ingested

Load `documents` by `documentId`. Then:

| Condition | Action |
|---|---|
| Row missing | DeleteMessage. Stop. |
| `source = generated` | DeleteMessage. Stop. Never chunk generated briefs. |
| `status = ready` | DeleteMessage. Stop. (Redelivery after success, before ack.) |
| `status = failed` | DeleteMessage. Stop. Sam must **Retry** (API re-queues). Do not auto-replay failures. |
| `source = uploaded` AND `status ∈ { queued, processing }` | Process. |

`processing` on receive = crash/redelivery. Continue; it is idempotent (see transaction).

### Status machine

Only the worker moves `queued → processing → ready | failed`. API sets `queued` on create/retry (and `ready` on **generated** rows, which the worker never sees).

```
queued ──worker starts──► processing ──success──► ready
                               │
                               └──failure──► failed
failed ──API Retry──► queued ──► (same)
```

| Transition | Writes |
|---|---|
| Start | `status = processing`, `errorMessage = null`, `updatedAt = now` |
| Success | `status = ready`, `readyAt = now`, `errorMessage = null`, chunks replaced |
| Failure | `status = failed`, `readyAt` unchanged (null if never ready), `errorMessage` = Sam-visible string, **no** chunk writes (see txn) |

`attemptCount` is incremented by the **API** on create (`1`) and Retry. Worker does not bump it.

### Pipeline steps (one message)

1. Validate message → load row → gate table above.
2. Set `processing`.
3. `GetObject(bucket, storage_key)`. Missing object → fail `object_not_found`.
4. Decode UTF-8 text. If empty or whitespace-only → fail `empty_content`.
5. If `filename` does not end `.md` → fail `unsupported_type` (API should have blocked this).
6. Chunk (below) → if zero chunks → fail `empty_content`.
7. Embed each chunk with **`@xenova/transformers`**, model **`Xenova/all-MiniLM-L6-v2`**, vector length **384**. Same model the API uses at query time. Fail `embed_failed` if the model throws.
8. **One Postgres transaction:**
   - `DELETE FROM chunks WHERE document_id = $id`
   - `INSERT` all chunks (`organization_id` **copied from the parent document**, `index` `0…n-1`, `content`, `heading`, `embedding`)
   - Update document `ready`
9. `DeleteMessage`.

On any fail after step 2: update document `failed` + `errorMessage`, then `DeleteMessage`. Do **not** leave the SQS message to retry on a timer — that would bypass Sam’s Retry button.

If the process crashes before `DeleteMessage`, visibility timeout redelivers. Safe because success is one txn and `ready` is ignored on receive.

### Chunking

Deterministic so retries produce the same passage boundaries (embeddings may still be bitwise-identical).

```ts
type ChunkRow = {
  documentId: string;
  organizationId: string; // copy from documents.organization_id
  index: number; // 0-based, contiguous
  content: string; // exact passage shown in citations
  heading: string | null; // nearest preceding ATX heading from the hard-boundary split
  embedding: number[]; // length 384, pgvector
};
```

Algorithm:

1. Normalize newlines to `\n`. Keep markdown (headings, lists). Do **not** strip YAML frontmatter — it is corpus text.
2. Split on markdown ATX headings (`/^(#{1,6})[ \t].+$/m`) as **hard boundaries**. The heading line stays with the section that follows. Persist that heading text on every chunk in the section (`chunks.heading`).
3. Inside a section, split on blank lines (`\n\n+`) into blocks. Trim each block. Drop empty blocks.
4. Pack consecutive blocks into chunks with **max 800 characters**. If a single block is longer, split on sentence boundaries (`. `, `? `, `! `) then on spaces; never discard text.
5. **Overlap:** prepend the last **100 characters** of the previous chunk to the next (trim to a space if possible), except the first chunk. Overlap is included in `content` (citations stay greppable).
6. `index` in pack order.

Do not emit a chunk that is only overlap. Citation UX: `GET /chunks/:id` returns this `content`.

### Embeddings

| Topic | Spec |
|---|---|
| Package | `@xenova/transformers` in the **worker** (ingest) and the **API** (query). |
| Model | `Xenova/all-MiniLM-L6-v2` |
| Dims | 384 — must match `chunks.embedding` / Prisma. |
| Input | chunk `content` string |
| Output | `number[384]` stored as pgvector. |

Cache the pipeline in process memory (load once). First message may be slow; that is why visibility is 300s.

### Failure messages (`errorMessage`)

Shown on the dashboard as-is. Keep them short and specific:

| Code (logs) | `errorMessage` (Sam) |
|---|---|
| `object_not_found` | `File missing from object storage.` |
| `empty_content` | `File is empty.` |
| `unsupported_type` | `Only markdown (.md) files can be ingested.` |
| `embed_failed` | `Embedding failed. Retry the document.` |
| `db_failed` | `Could not save chunks. Retry the document.` |
| other | `Ingest failed. Retry the document.` |

Log the stack separately. One bad file fails **that row only** — keep polling.

### Worker must not

- HTTP server, Anthropic, LangChain/LangGraph
- Second embedder / hosted embeddings
- Read `data/` from disk
- Put/Delete MinIO objects
- Enqueue messages
- Write `generated` rows or `generated_citations`
- Auto-retry failed rows without a new API message
- Fail the process because one document failed

### API producer (must match worker)

After commit of an uploaded row with `status = queued`:

```ts
await sqs.sendMessage({
  QueueUrl: ingestQueueUrl,
  MessageBody: JSON.stringify({ documentId: document.id }),
});
```

Retry: same message shape, after `status = queued` and `errorMessage = null`.

### Retrieve (API, not worker)

Worker only **writes** chunks. Chat/generate retrieve is API SQL — [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) “Retrieve (SQL shape)”. Anthropic stays on the API.
