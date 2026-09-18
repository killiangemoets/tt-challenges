import { ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button, ErrorState, Loading } from '@/components/ui';
import { useChunkByIdQuery } from '@/hooks/data/use-second-brain';
import type { Citation } from '@/schemas/api';

export const CitationDrawer = ({
  citation,
  onClose,
}: {
  citation: Citation;
  onClose: () => void;
}) => {
  const chunk = useChunkByIdQuery(citation.chunkId);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-xl">
      <header className="flex items-center border-b border-soft px-5 py-4">
        <h2 className="eyebrow">Source passage</h2>
        <Button
          aria-label="Close source passage"
          className="ml-auto"
          variant="ghost"
          onClick={onClose}
        >
          <X size={17} />
        </Button>
      </header>
      {chunk.isLoading && <Loading label="Loading source passage…" />}
      {chunk.isError && <ErrorState message="Could not load this passage." />}
      {chunk.data && (
        <div className="flex-1 overflow-y-auto p-5">
          <p className="break-all font-mono text-sm">
            {chunk.data.document.filename}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {chunk.data.document.organization.name} · passage{' '}
            {chunk.data.index + 1} of {chunk.data.document.chunkCount}
            {chunk.data.heading ? ` · ${chunk.data.heading}` : ''}
          </p>
          {chunk.data.context?.previous && (
            <p className="mt-6 line-clamp-3 text-xs leading-5 text-faint">
              {chunk.data.context.previous.content}
            </p>
          )}
          <blockquote className="mt-3 whitespace-pre-wrap rounded-sm border border-l-2 border-l-primary bg-background p-4 font-serif text-[15px] leading-7">
            {chunk.data.content}
          </blockquote>
          {chunk.data.context?.next && (
            <p className="mt-3 line-clamp-3 text-xs leading-5 text-faint">
              {chunk.data.context.next.content}
            </p>
          )}
          <div className="mt-6">
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              to={`/documents/${chunk.data.document.id}`}
              onClick={onClose}
            >
              Open full document <ExternalLink size={14} />
            </Link>
          </div>
          <p className="mt-8 border-t border-soft pt-4 text-[11px] leading-5 text-faint">
            Passage returned verbatim with neighboring context. Chunk overlap is
            included so the text remains greppable in its source.
          </p>
        </div>
      )}
    </aside>
  );
};
