# Database schema

Postgres + pgvector. Prisma owns migrations; similarity search uses parameterized raw SQL.

Locked product rules this draft follows:

- Org provenance on the row (fund / PC1 / PC2 / PC3). Isolation in the schema, not handler `if`s. Full ACL is cut.
- **One `documents` table.** Discriminator `source`: `uploaded` | `generated`. UI still lists them separately.
- Ingest (`source = uploaded`): MinIO object + `documents` row → queue → worker inserts **chunks**. Status: `queued | processing | ready | failed`.
- Generate (`source = generated`): MinIO + same table, `status = ready`. **No chunks** (re-ingest into the retriever is cut).
- Retrieve in SQL: uploaded + ready only; fund always eligible. **Chat:** fund ∪ 0–3 selected portcos (fund-side user; this slice has no auth). **Generate:** exactly one portco ∪ fund.
- No users table (Dana does not log in). Chat history is request-scoped, not persisted.

## ER

```
  organizations 1──────── * documents
                               │
                               │ source = uploaded, status = ready
                               │
                               └─── * chunks
                                        ▲
  documents (source = generated)        │
      └─── * generated_citations ───────┘  (chunk_id)
```

## Tables

### `organizations`

Four seed rows. Not created from the UI in this slice.

| Column       | Type        | Notes                                                           |
| ------------ | ----------- | --------------------------------------------------------------- |
| `id`         | uuid PK     |                                                                 |
| `slug`       | text UNIQUE | `fund` \| `pc1` \| `pc2` \| `pc3` — dropdown + retrieval filter |
| `kind`       | enum        | `fund` \| `portco`                                              |
| `name`       | text        | e.g. DAW Capital, Vantage Managed Services                      |
| `created_at` | timestamptz |                                                                 |

`kind = fund` is the row always included in retrieve. Chat scope: `WHERE chunks.organization_id = ANY(fund_id ∪ selected_portco_ids)` with `selected_portco_ids` length 0–3. Generate scope: `fund_id ∪ { that_portco_id }`.

### `documents`

Uploads, seeds, and generated briefs.

| Column                      | Type                    | Notes                                                                                |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `id`                        | uuid PK                 | Queue message body is this id (uploaded only)                                        |
| `organization_id`           | uuid FK → organizations | Uploaded: file provenance. Generated: **the portco the brief is about** (not fund)   |
| `source`                    | enum                    | `uploaded` \| `generated`                                                            |
| `origin`                    | enum NULL               | `seed` \| `upload` when `source = uploaded`; NULL when generated                     |
| `status`                    | enum                    | `queued` \| `processing` \| `ready` \| `failed`. Generated rows are inserted `ready` |
| `filename`                  | text                    | Display name (`.md` only)                                                            |
| `title`                     | text NULL               | Generated memo title; NULL for uploads                                               |
| `storage_key`               | text UNIQUE             | MinIO object key                                                                     |
| `size_bytes`                | int NULL                | Object size; API writes on PutObject (upload, seeds, generated)                      |
| `seed_path`                 | text NULL               | Relative path under `data/` for seeds; NULL otherwise                                |
| `error_message`             | text NULL               | Visible on dashboard / Retry (uploaded ingest)                                       |
| `attempt_count`             | int                     | Retry increments; no DLQ                                                             |
| `ready_at`                  | timestamptz NULL        | Set when status → `ready`                                                            |
| `prompt_version`            | text NULL               | Generated only, e.g. `llm-prompts/v1/portco-brief.md`                                |
| `template_version`          | text NULL               | Generated only, e.g. `templates/portco-brief.md`                                     |
| `created_by_label`          | text NULL               | Trust “who”; default `Sam` on generate                                               |
| `source_document_ids`       | uuid[] NULL             | Generated: uploaded docs retrieval used                                              |
| `flags`                     | jsonb NULL              | Generated alerts, e.g. `[{ "code": "single_source", "detail": "…" }]`                |
| `created_at` / `updated_at` | timestamptz             |                                                                                      |

Constraints:

- Unique `(organization_id, seed_path)` where `seed_path IS NOT NULL`.
- Worker deletes existing `chunks` for this id before re-insert on Retry.
- Worker / enqueue only for `source = uploaded`.
- Chunks exist only for `source = uploaded` AND `status = ready`.
- `chunkCount` on API list/detail is `COUNT(chunks)` by `document_id`, not a stored column. Ready with zero chunks is a bug (worker fails ingest as empty).

Dashboard: **Needs me** = `source = uploaded` AND `status = failed` (optionally stuck `processing`). **Pipeline / KB** = `source = uploaded`. **Generated** = `source = generated`.

### `chunks`

Only for **ready uploaded** documents. Generated markdown is not chunked.

| Column            | Type                                  | Notes                                                                               |
| ----------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `id`              | uuid PK                               | Citation target (“open the source, find the line”)                                  |
| `document_id`     | uuid FK → documents ON DELETE CASCADE | Parent must be `source = uploaded`                                                  |
| `organization_id` | uuid FK → organizations               | **Copied from the parent document** so retrieve filters chunks without a join guess |
| `index`           | int                                   | Order inside the file (`0…n`)                                                       |
| `content`         | text                                  | Passage shown in citations                                                          |
| `heading`         | text NULL                             | Nearest preceding ATX heading from the chunker hard boundary; written at ingest     |
| `embedding`       | vector(384)                           | Dimension = xenova model (draft: MiniLM-L6-v2). Change with the model, not per row  |
| `created_at`      | timestamptz                           |                                                                                     |

Indexes: `(document_id, index)` unique; `(organization_id)` for scope; vector index (HNSW / IVFFlat) when we migrate.

### `generated_citations`

Structured evidence for a **generated** `documents` row. Chat citations are **not** stored here (end-of-turn SSE with `marker` only).

| Column        | Type                                  | Notes                                |
| ------------- | ------------------------------------- | ------------------------------------ |
| `id`          | uuid PK                               |                                      |
| `document_id` | uuid FK → documents ON DELETE CASCADE | Parent must be `source = generated`  |
| `chunk_id`    | uuid FK → chunks                      | Real passage from an uploaded doc    |
| `section`     | text                                  | Template heading the claim sat under |
| `marker`      | int NULL                              | The `[n]` the claim carries in the saved markdown; NULL for rows written before markers were stored |
| `created_at`  | timestamptz                           |                                      |

## What is intentionally absent

| Skip                            | Why                                                         |
| ------------------------------- | ----------------------------------------------------------- |
| `generated_documents` table     | One `documents` table; split is `source` + UI lists         |
| `users` / sessions / ACL tables | No login; provenance ≠ enforcement                          |
| `conversations` / `messages`    | Multi-turn is sent to Anthropic from the client/API payload |
| Chunks on generated rows        | Re-ingest loop cut                                          |
| Queue / job table               | ElasticMQ is the job store; Postgres holds document status  |
| People / identity graph         | Out of slice (silent risk if we pretend otherwise)          |

## Retrieve (SQL shape)

```
fund_id := organizations.slug = 'fund'
scope  := { fund_id } ∪ selected_portco_ids   -- chat: 0–3 portcos; generate: exactly one

SELECT chunks.* FROM chunks
JOIN documents ON documents.id = chunks.document_id
WHERE documents.source = 'uploaded'
  AND documents.status = 'ready'
  AND chunks.organization_id = ANY(scope)
ORDER BY embedding <=> $query_vector
LIMIT k
```

Generated rows never appear in this query. Neighbor context for a citation drawer is `index ± 1` on the same `document_id`, not extra stored columns.

---

## Locked at checkpoint 3

Locked: one `documents` table with `source = uploaded | generated`;
`organizations` as first-class rows; `generated_citations.chunk_id` as a foreign
key to `chunks`; `source_document_ids` as `uuid[]`; and
`Xenova/all-MiniLM-L6-v2` embeddings as `vector(384)`.

Locked with the Claude Design prototype (`claude-design/`): `chunks.heading`, `documents.size_bytes`, chat retrieve across multiple portcos, citation `marker` on the wire (chat cites are SSE-only; generated cites store the marker so a saved brief keeps its clickable `[n]`).
