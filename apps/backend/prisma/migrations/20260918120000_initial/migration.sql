CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "OrganizationKind" AS ENUM ('fund', 'portco');
CREATE TYPE "DocumentSource" AS ENUM ('uploaded', 'generated');
CREATE TYPE "DocumentOrigin" AS ENUM ('seed', 'upload');
CREATE TYPE "DocumentStatus" AS ENUM ('queued', 'processing', 'ready', 'failed');

CREATE TABLE organizations (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  kind "OrganizationKind" NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  source "DocumentSource" NOT NULL,
  origin "DocumentOrigin",
  status "DocumentStatus" NOT NULL,
  filename text NOT NULL,
  title text,
  storage_key text NOT NULL UNIQUE,
  size_bytes integer,
  seed_path text,
  error_message text,
  attempt_count integer NOT NULL DEFAULT 1,
  ready_at timestamptz,
  prompt_version text,
  template_version text,
  created_by_label text,
  source_document_ids uuid[] NOT NULL DEFAULT '{}',
  flags jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_org_seed_key UNIQUE (organization_id, seed_path),
  CONSTRAINT documents_source_fields CHECK (
    (source = 'uploaded' AND origin IS NOT NULL)
    OR
    (source = 'generated' AND origin IS NULL AND status = 'ready')
  )
);

CREATE TABLE chunks (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  "index" integer NOT NULL,
  content text NOT NULL,
  heading text,
  embedding vector(384) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chunks_document_index_key UNIQUE (document_id, "index")
);

CREATE TABLE generated_citations (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES chunks(id),
  section text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT generated_citations_document_chunk_section_key UNIQUE (document_id, chunk_id, section)
);

CREATE INDEX documents_source_status_idx ON documents(source, status);
CREATE INDEX documents_organization_id_idx ON documents(organization_id);
CREATE INDEX chunks_organization_id_idx ON chunks(organization_id);
CREATE INDEX chunks_embedding_hnsw_idx ON chunks USING hnsw (embedding vector_cosine_ops);

INSERT INTO organizations (id, slug, kind, name) VALUES
  ('00000000-0000-4000-8000-000000000001', 'fund', 'fund', 'DAW Capital'),
  ('00000000-0000-4000-8000-000000000002', 'pc1', 'portco', 'Vantage Managed Services'),
  ('00000000-0000-4000-8000-000000000003', 'pc2', 'portco', 'Cascade Care Group'),
  ('00000000-0000-4000-8000-000000000004', 'pc3', 'portco', 'Ridgeline Freight & Logistics');
