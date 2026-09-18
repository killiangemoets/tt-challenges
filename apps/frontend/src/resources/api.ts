import axios from 'axios';

import type {
  ApiError,
  ChatMessage,
  Citation,
  Chunk,
  Dashboard,
  DocumentDetail,
  DocumentListItem,
  GeneratedDocument,
  Organization,
  UploadedDocument,
} from '@/schemas/api';

/** `VITE_API_URL` is the API origin; the app prefix lives here. */
const apiOrigin = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: apiOrigin.endsWith('/api/v1') ? apiOrigin : `${apiOrigin}/api/v1`,
});

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data.error.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
};

export const getOrganizations = async () => {
  const { data } = await api.get<{ organizations: Organization[] }>(
    '/organizations',
  );
  return data.organizations;
};

export const getDashboard = async () => {
  const { data } = await api.get<Dashboard>('/dashboard');
  return data;
};

export type DocumentFilters = {
  source: 'uploaded' | 'generated';
  status?: string;
  organizationId?: string;
  q?: string;
};

export const getDocuments = async (filters: DocumentFilters) => {
  const { data } = await api.get<{ documents: DocumentListItem[] }>(
    '/documents',
    { params: filters },
  );
  return data.documents;
};

export const getDocument = async (id: string) => {
  const { data } = await api.get<DocumentDetail>(`/documents/${id}`);
  return data;
};

export const getChunk = async (id: string) => {
  const { data } = await api.get<Chunk>(`/chunks/${id}`, {
    params: { context: 'neighbors' },
  });
  return data;
};

export const uploadDocument = async (input: {
  file: File;
  organizationId: string;
}) => {
  const body = new FormData();
  body.append('file', input.file);
  body.append('organizationId', input.organizationId);
  const { data } = await api.post<UploadedDocument>('/documents', body);
  return data;
};

export const ingestSeeds = async () => {
  const { data } = await api.post<{
    created: number;
    skipped: number;
    documents: UploadedDocument[];
  }>('/ingest-seeds', {});
  return data;
};

export const retryDocument = async (id: string) => {
  const { data } = await api.post<UploadedDocument>(
    `/documents/${id}/retry`,
    {},
  );
  return data;
};

export const retryDocuments = async (documentIds: string[]) => {
  const { data } = await api.post<{
    retried: UploadedDocument[];
    rejected: Array<{ documentId: string; code: string; message: string }>;
  }>('/documents/retry', { documentIds });
  return data;
};

type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'done'; unsupported: boolean }
  | { type: 'persisted'; document: DocumentDetail }
  | { type: 'error'; code: string; message: string };

const parseEventBlock = (block: string): StreamEvent | null => {
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  if (!data) return null;
  return JSON.parse(data) as StreamEvent;
};

const postStream = async (
  path: string,
  body: object,
  onEvent: (event: StreamEvent) => void,
) => {
  const response = await fetch(`${api.defaults.baseURL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json()) as ApiError;
    throw new Error(payload.error.message);
  }
  if (!response.body) throw new Error('The stream could not be opened.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const event = parseEventBlock(block);
      if (event) onEvent(event);
    }
    if (done) break;
  }
  const event = parseEventBlock(buffer);
  if (event) onEvent(event);
};

export type ChatStreamInput = {
  message: string;
  history: ChatMessage[];
  portcoOrganizationIds: string[];
};

export type ChatStreamHandlers = {
  onDelta: (text: string) => void;
  onCitations: (citations: Citation[]) => void;
  onDone: (unsupported: boolean) => void;
};

export const streamChat = async (
  input: ChatStreamInput,
  handlers: ChatStreamHandlers,
) =>
  postStream('/chat/stream', input, (event) => {
    if (event.type === 'delta') handlers.onDelta(event.text);
    if (event.type === 'citations') handlers.onCitations(event.citations);
    if (event.type === 'done') handlers.onDone(event.unsupported);
    if (event.type === 'error') throw new Error(event.message);
  });

export type BriefStreamInput = {
  portcoOrganizationId: string;
  history: ChatMessage[];
  createdByLabel: string;
};

export type BriefStreamHandlers = {
  onDelta: (text: string) => void;
  onPersisted: (document: GeneratedDocument) => void;
};

export const streamBrief = async (
  input: BriefStreamInput,
  handlers: BriefStreamHandlers,
) =>
  postStream('/briefs/stream', input, (event) => {
    if (event.type === 'delta') handlers.onDelta(event.text);
    if (event.type === 'persisted' && event.document.source === 'generated') {
      handlers.onPersisted(event.document);
    }
    if (event.type === 'error') throw new Error(event.message);
  });
