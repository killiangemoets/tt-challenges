# API_SPECS_V2 — Second Brain (thin slice)

Supersedes `uploads/tt-challenges/API_SPECS.md` (v1). **V2 is v1 plus five additions**, every one of them forced by a screen in the prototype (`Second Brain.dc.html`). Nothing in v1 is removed and no existing shape changes meaning — a v1 client keeps working against a v2 server.

Everything in v1 that is not listed below is unchanged and still binding: conventions, error envelope, SSE rules, `GET /health`, `/api-docs.html`, `GET /api/v1/organizations`, `GET /api/v1/dashboard`, `POST /api/v1/documents`, `POST /api/v1/documents/:id/retry`, `POST /api/v1/ingest-seeds`, `POST /api/v1/chat/stream`, `POST /api/v1/briefs/stream`, the ingest worker spec, chunking, embeddings, the status machine, and the "not in this slice" list.

---

## Why each change exists

| # | Change | Screen that needs it | Why v1 can't serve it |
|---|---|---|---|
| 1 | `Citation.marker` + marker convention in answer text | Chat — inline citation markers | v1 returns citations as a flat final list with no way to tell *which claim* each one backs. Principle 3 ("uncited prose reads differently than cited prose") is unbuildable if every citation attaches to the whole turn. |
| 2 | `GET /api/v1/chunks/:id?context=neighbors` | Chat — citation drawer | The drawer shows the passage in place. v1 returns the 800-char chunk alone, so the reader lands mid-sentence on overlap and can't see the heading it sat under. |
| 3 | `q` on `GET /api/v1/documents` | Documents — filter bar | v1 filters by source/status/org/origin only. Sam's corpus has eight near-identically-named files per portco (`360-feedback-2026.md` ×3); filtering by org+status still leaves a wall. |
| 4 | `GET /api/v1/documents/:id` gains `sizeBytes`, `chunkCount` | Documents — detail panel, Dashboard — pipeline row | "Ready" with 0 chunks is a silent lie. Sam needs one number proving the document is actually retrievable. |
| 5 | `POST /api/v1/documents/:id/retry` accepts an array form: `POST /api/v1/documents/retry` | Dashboard — Needs me | Seeds fail in batches (a whole `inbox/office/` sweep, a dead MinIO). Retrying 9 rows is 9 round-trips and 9 optimistic UI states in v1. |
| 6 | `portcoOrganizationIds: string[]` on `POST /api/v1/chat/stream` | Chat — scope control | v1 allows at most one portco. Hema's standing questions are cross-portfolio ("which of our operators have turned around a struggling P&L"), and a fund-side user is entitled to the whole portfolio. See the isolation note below — this does **not** relax the Portco Workspace rule. |

### Isolation note (change 6)

v1's "never PC→PC" rule conflated two things: *who is asking* and *what may be retrieved*. The rule that matters commercially is the first one — a Portco Workspace user must only ever see their own org. That is unchanged and is enforced by the caller's identity, not by an arity limit on this parameter.

This slice has **no auth** (v1 convention, unchanged), and its only user is fund-side (Sam, Hema). A fund-side user may retrieve across any set of portcos plus the fund. When auth lands, the server clamps `portcoOrganizationIds` to the orgs the caller is entitled to and 403s on the rest; the wire shape does not change.

Generate is unaffected: `POST /api/v1/briefs/stream` still takes exactly one `portcoOrganizationId`, because the document is *about* one company. The FE therefore asks which portco at generate time rather than inheriting a possibly-multi chat scope.

Not added, deliberately: no counts/totals endpoint (vanity, SPEC cuts it), no conversation persistence, no websocket, no `PATCH /documents`, no generated-brief re-ingest.

---

## 1. Citations carry a marker

### Type change (additive)

```ts
type Citation = {
  chunkId: string;
  documentId: string;
  filename: string;
  organization: OrganizationRef;
  index: number;
  content: string;
  /** Chat: 1-based marker matching `[n]` in the answer text. Generate: omitted. */
  marker?: number;
  /** Generate: template heading. Chat: omitted. */
  section?: string;
};
```

`marker` and `section` are mutually exclusive: `chat/stream` sets `marker`, `briefs/stream` sets `section`. A `Citation` always carries exactly one of them.

### Answer-text convention

`llm-prompts/v1/chat.md` (bump to `v2/chat.md`) instructs the model to end each grounded sentence or clause with one or more bracketed integers: `Attrition in the service desk ran 31% in Q2 [1][2].` Markers are assigned in the order passages were given to the model, are 1-based, contiguous, and may repeat.

Server rules:

- Markers are validated after the turn. Any `[n]` in the streamed text with no matching citation is **stripped from the persisted/returned text is not possible** (chat is not persisted) — so instead the server emits the `citations` event with the markers it *can* back, and the FE renders an unmatched `[n]` as plain text, never as a live marker.
- A citation with no marker in the text is still returned (`marker` present, FE lists it under "also retrieved").
- Refusal turns (`done.unsupported = true`) must contain no markers and an empty `citations`.

### SSE (unchanged shape, richer payload)

```ts
type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "citations"; citations: Citation[] } // each with `marker`
  | { type: "done"; unsupported: boolean }
  | { type: "error"; code: ErrorCode; message: string };
```

Event order unchanged: `delta`* → optional `citations` → `done` | `error`.

**FE:** render markers only after the `citations` event arrives; during streaming, `[n]` is inert text. This keeps v1's cut of per-token citation payloads intact.

---

## 2. `GET /api/v1/chunks/:id`

**Params:** `id` uuid.

**Query (new):**

```ts
type ChunkQuery = {
  /** "none" (default, = v1 response) | "neighbors" (adds prev/next chunk) */
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

`heading` is derived at ingest time and stored on the chunk row (`chunks.heading text null`) — it is free, because chunking already splits on ATX headings as hard boundaries. The worker writes it in the same insert; no extra pipeline step.

**404** unchanged.

---

## 3. `GET /api/v1/documents`

**Query:**

```ts
type ListDocumentsQuery = {
  source?: DocumentSource;
  status?: DocumentStatus;
  organizationId?: string;
  origin?: DocumentOrigin;
  /** NEW. Case-insensitive substring match on filename (uploaded) and filename+title (generated). Trimmed; max 120 chars; empty = ignored. */
  q?: string;
};
```

Matching is `ILIKE '%' || q || '%'` in SQL — no full-text index, no ranking, no search over chunk content (that is what chat is for). Sort unchanged: `createdAt` desc. Still no pagination.

**400** if `q` exceeds 120 chars.

---

## 4. Document detail gains proof-of-retrievability

```ts
type UploadedDocumentDetail = UploadedDocument & {
  markdown: string;
  /** Bytes of the stored object. */
  sizeBytes: number;
  /** Rows in `chunks` for this document. 0 unless status = ready. */
  chunkCount: number;
};

type GeneratedDocumentDetail = GeneratedDocument & {
  markdown: string;
  sizeBytes: number;
  citations: Citation[]; // `section` required
};
```

`chunkCount` is also added to `UploadedDocument` (the **list** item) so the dashboard pipeline table can show it without N detail calls:

```ts
type UploadedDocument = { /* ...v1 fields... */ chunkCount: number };
```

Generated rows have no chunks and therefore no `chunkCount` (v1 already says the worker never chunks them).

**Invariant the FE relies on:** `status = "ready" && chunkCount === 0` is a bug, not a state. The server may surface it as `status = "failed"` with `errorMessage: "Ingested with no retrievable passages. Retry the document."`; until it does, the UI shows the row as failed.

---

## 5. Batch retry

Single-document retry (`POST /api/v1/documents/:id/retry`) is unchanged.

### `POST /api/v1/documents/retry`

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
  /** Everything refused, with the reason — partial success is normal. */
  rejected: Array<{
    documentId: string;
    code: "not_found" | "conflict";
    message: string;
  }>;
};
```

Always `200` when the body validates, even if `retried` is empty — the caller reconciles from the two arrays. **400** on an empty array, >50 ids, or a non-uuid. Eligibility per document is identical to v1 single retry (`source = uploaded` AND (`failed` OR stuck `processing`)); each eligible row gets its own MinIO-untouched re-enqueue and its own `attemptCount` bump. No transaction across documents: one bad id must not block the other eight.

---

## 6. Chat scope accepts several portcos

```ts
type ChatStreamRequest = {
  message: string;
  history: ChatMessage[];
  /** NEW. Zero or more portco org ids. Empty / omitted → fund only. Max 3 (the portfolio). Order irrelevant; duplicates rejected. */
  portcoOrganizationIds?: string[];
  /** DEPRECATED, still honoured: treated as a one-element `portcoOrganizationIds`. 400 if both are sent. */
  portcoOrganizationId?: string | null;
};
```

Retrieve set = `fund ∪ portcoOrganizationIds`. Still **SQL-scoped**, not prompt-only: `WHERE chunks.organization_id = ANY($1)` with the fund id always in the array. Fund is always in the set and the UI must say so (unchanged).

**400** if any id is unknown, is the fund org, has `kind != "portco"`, the array is longer than 3, or contains duplicates. **400** if `portcoOrganizationId` and `portcoOrganizationIds` are both present.

The `done` event is unchanged. Retrieval still runs per question with the **current** scope — history is not a license to widen it.

**FE:** multi-select chips; the scope line names every org in the retrieve set, fund included.

## Route index (v2)

| Method | Path | Change |
|---|---|---|
| GET | `/health` | — |
| GET | `/api-docs.html` | — |
| GET | `/api/v1/organizations` | — |
| GET | `/api/v1/dashboard` | `UploadedDocument.chunkCount` |
| GET | `/api/v1/documents` | `q` |
| POST | `/api/v1/documents` | — |
| GET | `/api/v1/documents/:id` | `sizeBytes`, `chunkCount` |
| POST | `/api/v1/documents/:id/retry` | — |
| **POST** | **`/api/v1/documents/retry`** | **new** |
| POST | `/api/v1/ingest-seeds` | — |
| GET | `/api/v1/chunks/:id` | `context`, `heading`, `document.chunkCount` |
| POST | `/api/v1/chat/stream` | `Citation.marker`, `portcoOrganizationIds` |
| POST | `/api/v1/briefs/stream` | — |

Route-order note: register `POST /documents/retry` before `POST /documents/:id/retry` so `retry` is never parsed as an `:id` (it would 400 on the uuid check anyway, but the ordering makes the intent explicit).

## Schema deltas implied

| Table | Column | Note |
|---|---|---|
| `chunks` | `heading text null` | Written by the worker from the ATX boundary it already computes. |
| `documents` | `size_bytes integer null` | Written by the API on PutObject. |
| — | `chunkCount` | Not a column: `count(*)` over `chunks` grouped by `document_id`, joined in the list query. |

No migration touches the retrieve path, the queue payload, or the status machine.
