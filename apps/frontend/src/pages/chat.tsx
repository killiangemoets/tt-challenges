import { useMemo, useState } from 'react';
import { FileText, LoaderCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CitationDrawer } from '@/components/citation-drawer';
import { MarkdownView } from '@/components/markdown-view';
import { Button, ErrorState, Modal } from '@/components/ui';
import {
  useChatStreamCommand,
  useGenerateBriefCommand,
  useOrganizationListQuery,
} from '@/hooks/data/use-second-brain';
import { getErrorMessage } from '@/resources/api';
import type { ChatMessage, Citation, GeneratedDocument } from '@/schemas/api';

type DisplayMessage = ChatMessage & {
  id: string;
  citations?: Citation[];
  unsupported?: boolean;
};

export const ChatPage = () => {
  const organizations = useOrganizationListQuery();
  const chat = useChatStreamCommand();
  const generate = useGenerateBriefCommand();
  const portcos =
    organizations.data?.filter(({ kind }) => kind === 'portco') ?? [];
  const [selectedPortcos, setSelectedPortcos] = useState<string[]>([]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [citation, setCitation] = useState<Citation>();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [briefPortcoId, setBriefPortcoId] = useState('');
  const [briefText, setBriefText] = useState('');
  const [generated, setGenerated] = useState<GeneratedDocument>();

  const history = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim())
        .map(({ role, content }) => ({ role, content })),
    [messages],
  );

  const togglePortco = (id: string) => {
    setSelectedPortcos((selected) =>
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id].slice(0, 3),
    );
  };

  const send = () => {
    const message = draft.trim();
    if (!message || chat.isPending) return;
    const assistantId = crypto.randomUUID();
    const priorHistory = history;
    setMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), role: 'user', content: message },
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setDraft('');
    chat.mutate({
      input: {
        message,
        history: priorHistory,
        portcoOrganizationIds: selectedPortcos,
      },
      handlers: {
        onDelta: (text) =>
          setMessages((items) =>
            items.map((item) =>
              item.id === assistantId
                ? { ...item, content: item.content + text }
                : item,
            ),
          ),
        onCitations: (citations) =>
          setMessages((items) =>
            items.map((item) =>
              item.id === assistantId ? { ...item, citations } : item,
            ),
          ),
        onDone: (unsupported) =>
          setMessages((items) =>
            items.map((item) =>
              item.id === assistantId ? { ...item, unsupported } : item,
            ),
          ),
      },
    });
  };

  const startGenerate = () => {
    if (!briefPortcoId || generate.isPending) return;
    setIsGenerateOpen(false);
    setBriefText('');
    setGenerated(undefined);
    generate.mutate({
      input: {
        portcoOrganizationId: briefPortcoId,
        history,
        createdByLabel: 'Sam Iyer',
      },
      handlers: {
        onDelta: (text) => setBriefText((value) => value + text),
        onPersisted: setGenerated,
      },
    });
  };

  const scopeNames = portcos
    .filter(({ id }) => selectedPortcos.includes(id))
    .map(({ name }) => name);

  return (
    <div className="flex min-h-[calc(100vh-60px)] flex-col">
      <header className="sticky top-15 z-20 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Retrieval scope</span>
          <span className="scope-chip scope-chip-fixed">
            <span className="size-1.5 rounded-full bg-primary" />
            Fund — always retrieved
          </span>
          {portcos.map((portco) => {
            const isSelected = selectedPortcos.includes(portco.id);
            return (
              <button
                aria-pressed={isSelected}
                className={
                  isSelected ? 'scope-chip scope-chip-on' : 'scope-chip'
                }
                key={portco.id}
                type="button"
                onClick={() => togglePortco(portco.id)}
              >
                {portco.name.split(' ')[0]}
              </button>
            );
          })}
          <Button
            className="ml-auto"
            variant="secondary"
            onClick={() => {
              setBriefPortcoId(selectedPortcos[0] ?? portcos[0]?.id ?? '');
              setIsGenerateOpen(true);
            }}
          >
            <FileText size={14} /> Generate portco brief
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8">
        {messages.length === 0 && (
          <section className="my-auto max-w-2xl">
            <p className="eyebrow text-primary">Grounded conversation</p>
            <h1 className="page-title mt-3">
              Ask what the record can support.
            </h1>
            <p className="mt-3 max-w-xl font-serif text-lg leading-8 text-muted-foreground">
              Every factual claim is connected to a source passage. When the
              corpus is silent, the brain says so.
            </p>
            <p className="mt-5 text-xs text-faint">
              Current scope: Fund
              {scopeNames.length ? ` ∪ ${scopeNames.join(' ∪ ')}` : ' only'}
            </p>
          </section>
        )}
        {messages.map((message) =>
          message.role === 'user' ? (
            <section className="border-l-2 border-strong pl-4" key={message.id}>
              <p className="eyebrow mb-2 text-faint">Sam</p>
              <p className="text-[15px] leading-7">{message.content}</p>
            </section>
          ) : (
            <section key={message.id}>
              <div className="mb-2 flex items-center gap-2">
                <p className="eyebrow text-primary">Second Brain</p>
                {!message.content && chat.isPending && (
                  <LoaderCircle
                    className="animate-spin text-primary"
                    size={14}
                  />
                )}
              </div>
              {message.unsupported ? (
                <div className="rounded border border-warning-border bg-status-warning p-5">
                  <p className="eyebrow mb-2 text-warning">
                    Not supported by the knowledge base
                  </p>
                  <MarkdownView markdown={message.content} />
                  <p className="mt-3 text-xs text-warning">
                    No citation, no claim. Add relevant source material or
                    narrow the question.
                  </p>
                </div>
              ) : (
                <MarkdownView
                  citations={message.citations}
                  markdown={message.content}
                  onCitation={setCitation}
                />
              )}
              {chat.isPending && message === messages[messages.length - 1] && (
                <p className="mt-3 text-xs text-faint">
                  Citations become active when the closing event arrives.
                </p>
              )}
              {!chat.isPending &&
                message.citations &&
                message.citations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.citations.map((item) => (
                      <button
                        className="source-chip"
                        key={item.chunkId}
                        type="button"
                        onClick={() => setCitation(item)}
                      >
                        [{item.marker}] {item.filename}
                      </button>
                    ))}
                  </div>
                )}
            </section>
          ),
        )}

        {(briefText || generate.isPending || generated) && (
          <section className="rounded border bg-card">
            <header className="flex flex-wrap items-center gap-3 border-b border-soft px-4 py-3">
              <p className="eyebrow text-primary">Portco brief</p>
              <span className="text-xs text-muted-foreground">
                {generate.isPending
                  ? 'filling templates/portco-brief.md'
                  : 'saved as a generated document'}
              </span>
              {generate.isPending && (
                <LoaderCircle
                  className="ml-auto animate-spin text-primary"
                  size={15}
                />
              )}
            </header>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6">
              {briefText}
            </pre>
            {generated && (
              <footer className="flex flex-wrap items-center gap-4 border-t border-ready-border bg-status-ready p-4">
                <p className="min-w-48 flex-1 text-xs text-primary-dark">
                  Saved. Review the memo with its citations, flags, and
                  provenance before using it.
                </p>
                <Link
                  className="rounded-sm bg-primary px-4 py-2 text-xs font-medium text-white"
                  to={`/documents/${generated.id}?source=generated`}
                >
                  Open the memo
                </Link>
              </footer>
            )}
          </section>
        )}
        {(chat.isError || generate.isError) && (
          <ErrorState message={getErrorMessage(chat.error ?? generate.error)} />
        )}
      </div>

      <footer className="sticky bottom-0 border-t bg-background px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded border border-strong bg-card p-2">
            <textarea
              aria-label="Ask the Second Brain"
              className="min-h-14 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none"
              placeholder="Ask about leadership, a search, or an assessment…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <Button
              aria-label="Ask"
              disabled={!draft.trim() || chat.isPending}
              onClick={send}
            >
              <Send size={15} /> Ask
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-faint">
            Every claim carries a passage. Unsupported questions get a stated
            gap, not a guess.
          </p>
        </div>
      </footer>

      {citation && (
        <CitationDrawer
          citation={citation}
          onClose={() => setCitation(undefined)}
        />
      )}
      {isGenerateOpen && (
        <Modal
          title="Generate a portco brief"
          description="A brief covers one portfolio company. Retrieval is that portco plus the fund, independent of chat scope."
          onClose={() => setIsGenerateOpen(false)}
        >
          <div className="space-y-2 p-5">
            {portcos.map((portco) => (
              <label
                className={
                  briefPortcoId === portco.id
                    ? 'flex cursor-pointer items-center gap-3 rounded-sm border border-primary bg-status-ready p-3'
                    : 'flex cursor-pointer items-center gap-3 rounded-sm border p-3'
                }
                key={portco.id}
              >
                <input
                  checked={briefPortcoId === portco.id}
                  name="brief-portco"
                  type="radio"
                  value={portco.id}
                  onChange={() => setBriefPortcoId(portco.id)}
                />
                <span>
                  <span className="block text-sm">{portco.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {portco.name} ∪ Fund
                  </span>
                </span>
              </label>
            ))}
          </div>
          <footer className="flex justify-end gap-2 border-t border-soft p-4">
            <Button variant="ghost" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!briefPortcoId} onClick={startGenerate}>
              Generate
            </Button>
          </footer>
        </Modal>
      )}
    </div>
  );
};
