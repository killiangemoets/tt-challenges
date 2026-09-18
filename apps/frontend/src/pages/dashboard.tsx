import { AlertTriangle, Database, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Button,
  Card,
  Empty,
  ErrorState,
  Loading,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import {
  useDashboardQuery,
  useIngestSeedsCommand,
  useRetryDocumentCommand,
  useRetryDocumentsCommand,
} from '@/hooks/data/use-second-brain';
import { getErrorMessage } from '@/resources/api';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const DashboardPage = () => {
  const dashboard = useDashboardQuery();
  const seeds = useIngestSeedsCommand();
  const retry = useRetryDocumentCommand();
  const retryAll = useRetryDocumentsCommand();

  if (dashboard.isLoading)
    return <Loading label="Loading the morning board…" />;
  if (dashboard.isError) {
    return (
      <ErrorState
        message={getErrorMessage(dashboard.error)}
        retry={() => dashboard.refetch()}
      />
    );
  }

  const data = dashboard.data!;
  const mutationError = seeds.error ?? retry.error ?? retryAll.error;
  const seedsIngested = data.seeds.ingested === data.seeds.total;

  return (
    <div className="page space-y-6">
      <header className="flex flex-wrap items-end gap-5">
        <div className="min-w-64 flex-1">
          <p className="eyebrow mb-2">Sam’s workspace</p>
          <h1 className="page-title">Morning board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What needs you, what is becoming searchable, and what the fund has
            generated.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Button
            disabled={seeds.isPending || seedsIngested}
            variant="secondary"
            onClick={() => seeds.mutate()}
          >
            <Database size={15} />
            {seedsIngested
              ? 'Seeds ingested'
              : seeds.isPending
                ? 'Queuing seeds…'
                : 'Ingest seeds'}
          </Button>
          <p className="text-xs text-muted-foreground">
            {data.seeds.ingested} of {data.seeds.total} seed files from{' '}
            <code>data/</code> registered
          </p>
        </div>
      </header>

      {mutationError && <ErrorState message={getErrorMessage(mutationError)} />}
      {seeds.isSuccess && (
        <p className="rounded-sm border border-ready-border bg-status-ready p-3 text-sm text-primary-dark">
          Queued {seeds.data.created} seed document
          {seeds.data.created === 1 ? '' : 's'}; skipped {seeds.data.skipped}.
        </p>
      )}

      <Card>
        <SectionHeader
          title="Needs me"
          action={
            data.needsMe.length > 0 ? (
              <Button
                disabled={retryAll.isPending}
                variant="danger"
                onClick={() =>
                  retryAll.mutate(data.needsMe.map((document) => document.id))
                }
              >
                <RefreshCw size={14} /> Retry all
              </Button>
            ) : null
          }
        />
        {data.needsMe.length === 0 ? (
          <Empty>
            Nothing needs you. No failed or stuck documents in the pipeline.
          </Empty>
        ) : (
          data.needsMe.map((document) => (
            <div
              className="flex flex-wrap items-start gap-4 border-b border-soft px-4 py-4 last:border-0"
              key={document.id}
            >
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 text-destructive"
                size={17}
              />
              <div className="min-w-56 flex-1">
                <Link
                  className="font-mono text-sm hover:text-primary"
                  to={`/documents/${document.id}`}
                >
                  {document.filename}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {document.organization.name} · attempt {document.attemptCount}
                </p>
                <p className="mt-2 text-sm text-destructive">
                  {document.errorMessage ?? 'Processing appears stuck.'}
                </p>
              </div>
              <StatusBadge status={document.status} />
              <Button
                disabled={retry.isPending}
                variant="danger"
                onClick={() => retry.mutate(document.id)}
              >
                Retry
              </Button>
            </div>
          ))
        )}
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader
            title="Pipeline · uploaded & seeded"
            action={
              <span className="text-xs text-muted-foreground">
                {
                  data.pipeline.filter(({ status }) => status === 'ready')
                    .length
                }{' '}
                ready · {data.pipeline.length} total
              </span>
            }
          />
          {data.pipeline.length === 0 ? (
            <Empty>Ingest the seed corpus or add a markdown file.</Empty>
          ) : (
            <div>
              {data.pipeline.map((document) => {
                const isInvalidReady =
                  document.status === 'ready' && document.chunkCount === 0;
                return (
                  <Link
                    className="grid grid-cols-[minmax(0,1fr)_auto_4rem] items-center gap-3 border-b border-soft px-4 py-3 hover:bg-subtle"
                    key={document.id}
                    to={`/documents/${document.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs">
                        {document.filename}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {document.organization.name} · {document.origin} ·{' '}
                        {formatDate(document.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge
                      status={isInvalidReady ? 'failed' : document.status}
                    />
                    <span
                      className={
                        isInvalidReady
                          ? 'text-right font-mono text-xs text-destructive'
                          : 'text-right font-mono text-xs text-muted-foreground'
                      }
                    >
                      {document.status === 'ready' ? document.chunkCount : '—'}
                    </span>
                  </Link>
                );
              })}
              <p className="px-4 py-3 text-[11px] leading-5 text-faint">
                Passages are retrievable chunks. Ready with zero passages is
                surfaced as a failure.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Generated briefs"
            action={
              <span className="text-xs text-muted-foreground">
                kept separate from uploads
              </span>
            }
          />
          {data.generated.length === 0 ? (
            <Empty>
              No briefs yet. Start in Chat, then generate one for a portco.
            </Empty>
          ) : (
            data.generated.map((document) => (
              <Link
                className="block border-b border-soft px-4 py-4 hover:bg-subtle"
                key={document.id}
                to={`/documents/${document.id}`}
              >
                <h3 className="font-serif text-lg font-semibold">
                  {document.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {document.organization.name} ·{' '}
                  {formatDate(document.createdAt)} · {document.createdByLabel} ·{' '}
                  {document.sourceDocuments.length} sources
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {document.flags.map((flag) => (
                    <span className="flag" key={`${flag.code}-${flag.detail}`}>
                      {flag.code.replaceAll('_', ' ')}
                    </span>
                  ))}
                </div>
              </Link>
            ))
          )}
          <div className="p-4">
            <Link className="text-sm font-medium text-primary" to="/documents">
              Open the document library →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
