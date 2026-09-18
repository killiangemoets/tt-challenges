import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { CitationDrawer } from '@/components/citation-drawer';
import { MarkdownView } from '@/components/markdown-view';
import {
  Button,
  Card,
  Empty,
  ErrorState,
  Loading,
  StatusBadge,
} from '@/components/ui';
import {
  useDocumentByIdQuery,
  useDocumentLibraryQuery,
  useIngestSeedsCommand,
  useOrganizationListQuery,
  useRetryDocumentCommand,
} from '@/hooks/data/use-second-brain';
import { getErrorMessage } from '@/resources/api';
import type { Citation } from '@/schemas/api';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const DocumentsPage = () => {
  const { id } = useParams();
  const organizations = useOrganizationListQuery();
  const documents = useDocumentLibraryQuery();
  const setFilters = documents.setFilters;
  const detail = useDocumentByIdQuery(id);
  const seeds = useIngestSeedsCommand();
  const retry = useRetryDocumentCommand();
  const [query, setQuery] = useState(documents.filters.q ?? '');
  const [citation, setCitation] = useState<Citation>();

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setFilters({ q: query || undefined }),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [query, setFilters]);

  const selected = detail.data;

  return (
    <div className="page-wide">
      <header className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-sm border border-strong">
          {(['uploaded', 'generated'] as const).map((source) => (
            <button
              className={
                documents.filters.source === source
                  ? 'bg-foreground px-4 py-2 text-xs font-medium capitalize text-white'
                  : 'bg-card px-4 py-2 text-xs font-medium capitalize'
              }
              key={source}
              type="button"
              onClick={() => documents.setFilters({ source })}
            >
              {source}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter by organisation"
          className="field w-auto"
          value={documents.filters.organizationId ?? ''}
          onChange={(event) =>
            documents.setFilters({
              organizationId: event.target.value || undefined,
            })
          }
        >
          <option value="">All organisations</option>
          {organizations.data?.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
        {documents.filters.source === 'uploaded' && (
          <select
            aria-label="Filter by status"
            className="field w-auto"
            value={documents.filters.status ?? ''}
            onChange={(event) =>
              documents.setFilters({
                status: event.target.value || undefined,
              })
            }
          >
            <option value="">Any status</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="failed">Failed</option>
          </select>
        )}
        <label className="relative min-w-48 flex-1 sm:max-w-72">
          <span className="sr-only">Filter by filename</span>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            size={14}
          />
          <input
            className="field pl-9"
            maxLength={120}
            placeholder="Filter by filename"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Button
          className="ml-auto"
          disabled={seeds.isPending}
          variant="secondary"
          onClick={() => seeds.mutate()}
        >
          {seeds.isPending ? 'Queuing…' : 'Ingest seeds'}
        </Button>
      </header>

      {(documents.isError || detail.isError || seeds.isError) && (
        <ErrorState
          message={getErrorMessage(
            documents.error ?? detail.error ?? seeds.error,
          )}
        />
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.35fr)]">
        <Card>
          <div className="border-b border-soft px-4 py-3 text-xs text-muted-foreground">
            {documents.data?.length ?? 0}{' '}
            {documents.filters.source === 'uploaded'
              ? 'source documents'
              : 'generated briefs'}
          </div>
          {documents.isLoading && <Loading />}
          {documents.data?.length === 0 && (
            <Empty>No documents match these filters.</Empty>
          )}
          {documents.data?.map((document) => (
            <Link
              className={
                selected?.id === document.id
                  ? 'block border-b border-l-2 border-l-primary bg-subtle px-4 py-3'
                  : 'block border-b border-l-2 border-l-transparent px-4 py-3 hover:bg-subtle'
              }
              key={document.id}
              to={`/documents/${document.id}?${new URLSearchParams(
                Object.entries(documents.filters).filter((entry) =>
                  Boolean(entry[1]),
                ) as string[][],
              ).toString()}`}
            >
              <div className="flex items-center gap-3">
                <p
                  className={
                    document.source === 'generated'
                      ? 'min-w-0 flex-1 truncate font-serif text-[15px] font-semibold'
                      : 'min-w-0 flex-1 truncate font-mono text-xs'
                  }
                >
                  {document.source === 'generated'
                    ? document.title
                    : document.filename}
                </p>
                <StatusBadge status={document.status} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {document.organization.name} · {formatDate(document.createdAt)}
              </p>
            </Link>
          ))}
        </Card>

        {!selected && !detail.isLoading && (
          <Card>
            <Empty>Select a document to read it.</Empty>
          </Card>
        )}
        {detail.isLoading && (
          <Card>
            <Loading label="Loading document…" />
          </Card>
        )}
        {selected?.source === 'uploaded' && 'markdown' in selected && (
          <Card>
            <header className="border-b border-soft p-5">
              <p className="eyebrow mb-2">Uploaded document</p>
              <h1 className="break-all font-mono text-base">
                {selected.filename}
              </h1>
            </header>
            <dl className="grid grid-cols-2 gap-5 border-b border-soft p-5 text-xs sm:grid-cols-4">
              <div>
                <dt className="field-label">Organisation</dt>
                <dd>{selected.organization.name}</dd>
              </div>
              <div>
                <dt className="field-label">Status</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
              <div>
                <dt className="field-label">Passages</dt>
                <dd>{selected.chunkCount}</dd>
              </div>
              <div>
                <dt className="field-label">Size</dt>
                <dd>{Math.ceil(selected.sizeBytes / 1024)} KB</dd>
              </div>
            </dl>
            {selected.errorMessage && (
              <div className="flex flex-wrap items-center gap-4 border-b border-error-border bg-status-error p-5">
                <div className="min-w-48 flex-1">
                  <p className="eyebrow text-destructive">Ingest failed</p>
                  <p className="mt-1 text-sm">{selected.errorMessage}</p>
                </div>
                <Button
                  disabled={retry.isPending}
                  variant="danger"
                  onClick={() => retry.mutate(selected.id)}
                >
                  Retry
                </Button>
              </div>
            )}
            <div className="p-5">
              <p className="eyebrow mb-3">Stored markdown</p>
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-sm border bg-background p-4 font-mono text-xs leading-6">
                {selected.markdown}
              </pre>
            </div>
          </Card>
        )}
        {selected?.source === 'generated' && 'markdown' in selected && (
          <Card>
            <header className="flex flex-wrap items-center gap-3 border-b border-soft bg-subtle px-6 py-4">
              <p className="eyebrow text-primary">Generated document</p>
              <span className="text-xs text-muted-foreground">
                read-only · not re-ingested
              </span>
              <span className="ml-auto font-mono text-[11px] text-faint">
                {selected.filename}
              </span>
            </header>
            <article className="mx-auto max-w-3xl px-6 py-9 sm:px-10">
              <div className="mb-7 grid gap-4 border-y border-strong py-4 text-xs sm:grid-cols-2">
                <p>
                  <span className="field-label">Generated</span>
                  {formatDate(selected.createdAt)}
                </p>
                <p>
                  <span className="field-label">For</span>Dana Deline · IC /
                  board
                </p>
                <p>
                  <span className="field-label">Scope</span>
                  {selected.organization.name} ∪ Fund
                </p>
                <p>
                  <span className="field-label">Sources</span>
                  {selected.sourceDocuments.length} documents ·{' '}
                  {selected.citations.length} passages
                </p>
              </div>
              <MarkdownView
                citations={selected.citations}
                markdown={selected.markdown}
                onCitation={setCitation}
              />
              {selected.flags.length > 0 && (
                <section className="mt-8 space-y-2">
                  <h2 className="memo-h2">Flags</h2>
                  {selected.flags.map((flag) => (
                    <div
                      className="rounded-sm border border-warning-border bg-status-warning p-4 text-sm"
                      key={`${flag.code}-${flag.detail}`}
                    >
                      <span className="mr-3 text-[10px] font-semibold uppercase tracking-wider text-warning">
                        {flag.code.replaceAll('_', ' ')}
                      </span>
                      {flag.detail}
                    </div>
                  ))}
                </section>
              )}
              <dl className="mt-9 grid gap-4 border-t border-soft pt-5 font-mono text-[11px] text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="field-label">Prompt</dt>
                  <dd>{selected.promptVersion}</dd>
                </div>
                <div>
                  <dt className="field-label">Template</dt>
                  <dd>{selected.templateVersion}</dd>
                </div>
              </dl>
            </article>
          </Card>
        )}
      </div>
      {citation && (
        <CitationDrawer
          citation={citation}
          onClose={() => setCitation(undefined)}
        />
      )}
    </div>
  );
};
