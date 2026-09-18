import { z } from 'zod';

export const organizationSchema = z.object({
  id: z.string(),
  slug: z.enum(['fund', 'pc1', 'pc2', 'pc3']),
  kind: z.enum(['fund', 'portco']),
  name: z.string(),
});

export type Organization = z.infer<typeof organizationSchema>;

export type OrganizationRef = Organization;
export type DocumentStatus = 'queued' | 'processing' | 'ready' | 'failed';

export type Flag = {
  code: string;
  detail: string;
  section?: string;
};

export type Citation = {
  chunkId: string;
  documentId: string;
  filename: string;
  organization: OrganizationRef;
  index: number;
  content: string;
  marker?: number;
  section?: string;
};

export type UploadedDocument = {
  id: string;
  source: 'uploaded';
  origin: 'seed' | 'upload';
  status: DocumentStatus;
  organization: OrganizationRef;
  filename: string;
  seedPath: string | null;
  errorMessage: string | null;
  attemptCount: number;
  chunkCount: number;
  readyAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedDocument = {
  id: string;
  source: 'generated';
  origin: null;
  status: 'ready';
  organization: OrganizationRef;
  filename: string;
  title: string;
  promptVersion: string;
  templateVersion: string;
  createdByLabel: string;
  sourceDocuments: Array<{
    id: string;
    filename: string;
    organization: OrganizationRef;
  }>;
  flags: Flag[];
  readyAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentListItem = UploadedDocument | GeneratedDocument;
export type DocumentDetail =
  | (UploadedDocument & { markdown: string; sizeBytes: number })
  | (GeneratedDocument & {
      markdown: string;
      sizeBytes: number;
      citations: Citation[];
    });

export type Dashboard = {
  needsMe: UploadedDocument[];
  pipeline: UploadedDocument[];
  generated: GeneratedDocument[];
};

export type Chunk = {
  id: string;
  index: number;
  content: string;
  heading: string | null;
  document: {
    id: string;
    filename: string;
    source: 'uploaded';
    organization: OrganizationRef;
    chunkCount: number;
  };
  context?: {
    previous: { id: string; index: number; content: string } | null;
    next: { id: string; index: number; content: string } | null;
  };
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ApiError = { error: { code: string; message: string } };
