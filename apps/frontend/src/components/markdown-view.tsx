import type { ReactNode } from 'react';

import type { Citation } from '@/schemas/api';

const renderInline = (
  text: string,
  citations: Citation[],
  onCitation?: (citation: Citation) => void,
) => {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, index): ReactNode => {
    const marker = part.match(/^\[(\d+)]$/)?.[1];
    const citation = citations.find((item) => item.marker === Number(marker));
    if (!citation || !onCitation) return part;
    return (
      <button
        aria-label={`Open citation ${marker}`}
        className="citation"
        key={`${part}-${index}`}
        type="button"
        onClick={() => onCitation(citation)}
      >
        {marker}
      </button>
    );
  });
};

export const MarkdownView = ({
  markdown,
  citations = [],
  onCitation,
}: {
  markdown: string;
  citations?: Citation[];
  onCitation?: (citation: Citation) => void;
}) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  return (
    <div className="memo">
      {lines.map((line, index) => {
        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length;
          const content = renderInline(heading[2], citations, onCitation);
          if (level === 1)
            return (
              <h1 className="memo-h1" key={index}>
                {content}
              </h1>
            );
          return (
            <h2 className="memo-h2" key={index}>
              {content}
            </h2>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <div className="memo-list" key={index}>
              <span>—</span>
              <span>{renderInline(line.slice(2), citations, onCitation)}</span>
            </div>
          );
        }
        if (!line.trim()) return <div className="h-3" key={index} />;
        return <p key={index}>{renderInline(line, citations, onCitation)}</p>;
      })}
    </div>
  );
};
