import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import {
  CreateQueueCommand,
  SendMessageCommand,
  type SQSClient,
} from '@aws-sdk/client-sqs';
import type Anthropic from '@anthropic-ai/sdk';
import {
  DocumentSource,
  DocumentStatus,
  type Document,
  type Organization,
  type PrismaClient,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';

import type { BriefInput, ChatInput } from '../schemas.js';
import { embedText } from '../helpers/embed.js';

type AppErrorCode =
  | 'bad_request'
  | 'unsupported_media_type'
  | 'not_found'
  | 'conflict'
  | 'failed_dependency'
  | 'internal';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: AppErrorCode,
    message: string,
    public readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** Anthropic rejections (billing, rate limits, outages) are dependency failures, not bugs. */
const anthropicMessage = (error: unknown) => {
  const detail =
    error && typeof error === 'object' && 'error' in error
      ? (error as { error?: { error?: { message?: unknown } } }).error?.error
          ?.message
      : undefined;
  return typeof detail === 'string' && detail
    ? `Anthropic rejected the request: ${detail}`
    : 'Anthropic is unavailable. Try again.';
};

export type SseEvent =
  | { type: 'delta'; text: string }
  | { type: 'citations'; citations: unknown[] }
  | { type: 'done'; unsupported: boolean }
  | { type: 'persisted'; document: unknown };

type DocumentWithRelations = Document & {
  organization: Organization;
  _count: { chunks: number };
};

type RetrievedChunk = {
  id: string;
  document_id: string;
  organization_id: string;
  index: number;
  content: string;
  heading: string | null;
  filename: string;
  organization_slug: string;
  organization_kind: 'fund' | 'portco';
  organization_name: string;
};

export type BackendServices = {
  initialize: () => Promise<void>;
  listOrganizations: () => Promise<unknown>;
  dashboard: () => Promise<unknown>;
  listDocuments: (query: {
    source?: 'uploaded' | 'generated';
    status?: 'queued' | 'processing' | 'ready' | 'failed';
    organizationId?: string;
    origin?: 'seed' | 'upload';
    q?: string;
  }) => Promise<unknown>;
  uploadDocument: (input: {
    filename: string;
    mimetype: string;
    organizationId: string;
    content: Buffer;
  }) => Promise<unknown>;
  getDocument: (id: string) => Promise<unknown>;
  retryDocument: (id: string) => Promise<unknown>;
  retryDocuments: (ids: string[]) => Promise<unknown>;
  ingestSeeds: () => Promise<unknown>;
  getChunk: (id: string, includeNeighbors: boolean) => Promise<unknown>;
  chat: (input: ChatInput) => AsyncGenerator<SseEvent>;
  brief: (input: BriefInput) => AsyncGenerator<SseEvent>;
};

export type ServiceResources = {
  db: PrismaClient;
  s3: S3Client;
  sqs: SQSClient;
  anthropic: Anthropic | null;
  bucket: string;
  queueName: string;
  repoRoot: string;
  embed?: (text: string) => Promise<number[]>;
};

const serializeOrganization = (organization: Organization) => ({
  id: organization.id,
  slug: organization.slug,
  kind: organization.kind,
  name: organization.name,
});

const serializeUploaded = (document: DocumentWithRelations) => ({
  id: document.id,
  source: 'uploaded' as const,
  origin: document.origin,
  status: document.status,
  organization: serializeOrganization(document.organization),
  filename: document.filename,
  seedPath: document.seedPath,
  errorMessage: document.errorMessage,
  attemptCount: document.attemptCount,
  chunkCount: document._count.chunks,
  readyAt: document.readyAt?.toISOString() ?? null,
  createdAt: document.createdAt.toISOString(),
  updatedAt: document.updatedAt.toISOString(),
});

const serializeGenerated = async (
  db: PrismaClient,
  document: DocumentWithRelations,
) => {
  const sources = document.sourceDocumentIds.length
    ? await db.document.findMany({
        where: { id: { in: document.sourceDocumentIds } },
        include: { organization: true },
      })
    : [];
  return {
    id: document.id,
    source: 'generated' as const,
    origin: null,
    status: 'ready' as const,
    organization: serializeOrganization(document.organization),
    filename: document.filename,
    title: document.title ?? document.filename,
    promptVersion: document.promptVersion ?? '',
    templateVersion: document.templateVersion ?? '',
    createdByLabel: document.createdByLabel ?? 'Sam',
    sourceDocuments: sources.map((source) => ({
      id: source.id,
      filename: source.filename,
      organization: serializeOrganization(source.organization),
    })),
    flags: document.flags ?? [],
    readyAt:
      document.readyAt?.toISOString() ?? document.createdAt.toISOString(),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
};

const serializeDocument = async (
  db: PrismaClient,
  document: DocumentWithRelations,
) =>
  document.source === DocumentSource.uploaded
    ? serializeUploaded(document)
    : serializeGenerated(db, document);

const SEED_EXTENSIONS = ['.md', '.docx', '.xlsx', '.pptx'];

/** Repo-relative paths of the corpus files the Ingest Seeds action registers. */
const listSeedPaths = async (repoRoot: string) => {
  const walk = async (directory: string): Promise<string[]> => {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(join(directory, entry.name))
          : Promise.resolve([join(directory, entry.name)]),
      ),
    );
    return nested.flat();
  };
  const paths = await walk(join(repoRoot, 'data'));
  return paths
    .filter((path) =>
      SEED_EXTENSIONS.some((extension) =>
        path.toLowerCase().endsWith(extension),
      ),
    )
    .map((path) => relative(repoRoot, path));
};

const getQueueUrl = async (sqs: SQSClient, queueName: string) => {
  const response = await sqs.send(
    new CreateQueueCommand({
      QueueName: queueName,
      Attributes: { VisibilityTimeout: '300' },
    }),
  );
  if (!response.QueueUrl) throw new Error('Queue URL was not returned.');
  return response.QueueUrl;
};

const putAndEnqueue = async (
  resources: ServiceResources,
  input: {
    organization: Organization;
    filename: string;
    content: Buffer;
    origin: 'seed' | 'upload';
    seedPath?: string;
  },
) => {
  const id = randomUUID();
  const storageKey = `uploaded/${input.organization.slug}/${id}/${input.filename}`;
  await resources.s3.send(
    new PutObjectCommand({
      Bucket: resources.bucket,
      Key: storageKey,
      Body: input.content,
      ContentType: input.filename.toLowerCase().endsWith('.md')
        ? 'text/markdown'
        : 'application/octet-stream',
    }),
  );
  const document = await resources.db.document.create({
    data: {
      id,
      organizationId: input.organization.id,
      source: 'uploaded',
      origin: input.origin,
      status: 'queued',
      filename: input.filename,
      storageKey,
      sizeBytes: input.content.byteLength,
      seedPath: input.seedPath,
      sourceDocumentIds: [],
    },
    include: { organization: true, _count: { select: { chunks: true } } },
  });
  const queueUrl = await getQueueUrl(resources.sqs, resources.queueName);
  await resources.sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({ documentId: document.id }),
    }),
  );
  return serializeUploaded(document);
};

const isStuck = (document: Document) =>
  document.status === DocumentStatus.processing &&
  document.updatedAt.getTime() < Date.now() - 10 * 60 * 1000;

export const retrieveChunks = async (
  resources: ServiceResources,
  query: string,
  portcoIds: string[],
): Promise<RetrievedChunk[]> => {
  const organizations = await resources.db.organization.findMany({
    where: {
      OR: [{ slug: 'fund' }, { id: { in: portcoIds }, kind: 'portco' }],
    },
  });
  const foundPortcos = organizations.filter((org) => org.kind === 'portco');
  if (foundPortcos.length !== portcoIds.length) {
    throw new AppError(
      400,
      'bad_request',
      'Unknown or invalid portco organization.',
    );
  }
  const vector = `[${(await (resources.embed ?? embedText)(query)).join(',')}]`;
  const organizationIds = organizations.map((organization) => organization.id);
  return resources.db.$queryRawUnsafe<RetrievedChunk[]>(
    `SELECT c.id, c.document_id, c.organization_id, c."index", c.content, c.heading,
      d.filename, o.slug AS organization_slug, o.kind::text AS organization_kind, o.name AS organization_name
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     JOIN organizations o ON o.id = c.organization_id
     WHERE d.source = 'uploaded' AND d.status = 'ready'
       AND c.organization_id = ANY($2::uuid[])
     ORDER BY c.embedding <=> $1::vector
     LIMIT 10`,
    vector,
    organizationIds,
  );
};

const citationFrom = (
  chunk: RetrievedChunk,
  extra: { marker?: number; section?: string },
) => ({
  chunkId: chunk.id,
  documentId: chunk.document_id,
  filename: chunk.filename,
  organization: {
    id: chunk.organization_id,
    slug: chunk.organization_slug,
    kind: chunk.organization_kind,
    name: chunk.organization_name,
  },
  index: chunk.index,
  content: chunk.content,
  ...extra,
});

const extractSectionCitations = (markdown: string, chunkCount: number) => {
  let section = 'Evidence';
  const citations: Array<{ marker: number; section: string }> = [];
  for (const line of markdown.split('\n')) {
    if (/^#{1,6}\s+/.test(line))
      section = line.replace(/^#{1,6}\s+/, '').trim();
    for (const match of line.matchAll(/\[(\d+)\]/g)) {
      const marker = Number(match[1]);
      if (marker >= 1 && marker <= chunkCount)
        citations.push({ marker, section });
    }
  }
  return citations.filter(
    (citation, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.marker === citation.marker &&
          candidate.section === citation.section,
      ) === index,
  );
};

const streamAnthropic = async function* (
  anthropic: Anthropic,
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
) {
  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system,
      messages,
    });
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  } catch (error) {
    throw new AppError(
      503,
      'failed_dependency',
      anthropicMessage(error),
      undefined,
      { cause: error },
    );
  }
};

export const createBackendServices = (
  resources: ServiceResources,
): BackendServices => ({
  initialize: async () => {
    try {
      await resources.s3.send(
        new HeadBucketCommand({ Bucket: resources.bucket }),
      );
    } catch {
      await resources.s3.send(
        new CreateBucketCommand({ Bucket: resources.bucket }),
      );
    }
    await getQueueUrl(resources.sqs, resources.queueName);
  },

  listOrganizations: async () => ({
    organizations: (
      await resources.db.organization.findMany({
        orderBy: { slug: 'asc' },
      })
    ).map(serializeOrganization),
  }),

  dashboard: async () => {
    const documents = await resources.db.document.findMany({
      include: { organization: true, _count: { select: { chunks: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const uploaded = documents.filter(
      (document) => document.source === DocumentSource.uploaded,
    );
    const seedPaths = await listSeedPaths(resources.repoRoot);
    const registered = new Set(
      documents.map((document) => document.seedPath).filter(Boolean),
    );
    return {
      seeds: {
        total: seedPaths.length,
        ingested: seedPaths.filter((path) => registered.has(path)).length,
      },
      needsMe: uploaded
        .filter(
          (document) =>
            document.status === DocumentStatus.failed || isStuck(document),
        )
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map(serializeUploaded),
      pipeline: uploaded.map(serializeUploaded),
      generated: await Promise.all(
        documents
          .filter((document) => document.source === DocumentSource.generated)
          .map((document) => serializeGenerated(resources.db, document)),
      ),
    };
  },

  listDocuments: async (query) => {
    const q = query.q?.trim();
    const documents = await resources.db.document.findMany({
      where: {
        source: query.source,
        status: query.status,
        organizationId: query.organizationId,
        origin: query.origin,
        ...(q
          ? {
              OR: [
                { filename: { contains: q, mode: 'insensitive' } },
                { title: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { organization: true, _count: { select: { chunks: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      documents: await Promise.all(
        documents.map((document) => serializeDocument(resources.db, document)),
      ),
    };
  },

  uploadDocument: async (input) => {
    if (!input.filename.toLowerCase().endsWith('.md')) {
      throw new AppError(
        415,
        'unsupported_media_type',
        'Only markdown (.md) files can be uploaded.',
      );
    }
    if (
      input.mimetype &&
      !['text/markdown', 'text/plain', 'application/octet-stream'].includes(
        input.mimetype,
      )
    ) {
      throw new AppError(
        415,
        'unsupported_media_type',
        'Only markdown (.md) files can be uploaded.',
      );
    }
    const decoded = input.content.toString('utf8');
    if (decoded.includes('\uFFFD') || decoded.includes('\0')) {
      throw new AppError(
        415,
        'unsupported_media_type',
        'Only markdown (.md) files can be uploaded.',
      );
    }
    const organization = await resources.db.organization.findUnique({
      where: { id: input.organizationId },
    });
    if (!organization) {
      throw new AppError(400, 'bad_request', 'Unknown organization.');
    }
    return putAndEnqueue(resources, {
      ...input,
      organization,
      origin: 'upload',
    });
  },

  getDocument: async (id) => {
    const document = await resources.db.document.findUnique({
      where: { id },
      include: {
        organization: true,
        _count: { select: { chunks: true } },
        generatedCitations: {
          orderBy: { marker: 'asc' },
          include: {
            chunk: {
              include: { organization: true, document: true },
            },
          },
        },
      },
    });
    if (!document) throw new AppError(404, 'not_found', 'Document not found.');
    const isMarkdown = document.filename.toLowerCase().endsWith('.md');
    const object = isMarkdown
      ? await resources.s3.send(
          new GetObjectCommand({
            Bucket: resources.bucket,
            Key: document.storageKey,
          }),
        )
      : undefined;
    const markdown = (await object?.Body?.transformToString()) ?? '';
    const base = await serializeDocument(resources.db, document);
    return {
      ...base,
      markdown,
      sizeBytes: document.sizeBytes ?? Buffer.byteLength(markdown),
      ...(document.source === DocumentSource.generated
        ? {
            citations: document.generatedCitations.map(
              ({ section, marker, chunk }) =>
                citationFrom(
                  {
                    id: chunk.id,
                    document_id: chunk.documentId,
                    organization_id: chunk.organizationId,
                    index: chunk.index,
                    content: chunk.content,
                    heading: chunk.heading,
                    filename: chunk.document.filename,
                    organization_slug: chunk.organization.slug,
                    organization_kind: chunk.organization.kind,
                    organization_name: chunk.organization.name,
                  },
                  { section, ...(marker === null ? {} : { marker }) },
                ),
            ),
          }
        : {}),
    };
  },

  retryDocument: async (id) => {
    const document = await resources.db.document.findUnique({
      where: { id },
      include: { organization: true, _count: { select: { chunks: true } } },
    });
    if (!document) throw new AppError(404, 'not_found', 'Document not found.');
    if (
      document.source !== DocumentSource.uploaded ||
      (document.status !== DocumentStatus.failed && !isStuck(document))
    ) {
      throw new AppError(
        409,
        'conflict',
        'Document is not eligible for retry.',
      );
    }
    const updated = await resources.db.document.update({
      where: { id },
      data: {
        status: 'queued',
        errorMessage: null,
        attemptCount: { increment: 1 },
      },
      include: { organization: true, _count: { select: { chunks: true } } },
    });
    const queueUrl = await getQueueUrl(resources.sqs, resources.queueName);
    await resources.sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ documentId: id }),
      }),
    );
    return serializeUploaded(updated);
  },

  retryDocuments: async (ids) => {
    const retried: unknown[] = [];
    const rejected: Array<{
      documentId: string;
      code: 'not_found' | 'conflict';
      message: string;
    }> = [];
    for (const id of ids) {
      try {
        retried.push(await createBackendServices(resources).retryDocument(id));
      } catch (error) {
        if (
          error instanceof AppError &&
          [404, 409].includes(error.statusCode)
        ) {
          rejected.push({
            documentId: id,
            code: error.statusCode === 404 ? 'not_found' : 'conflict',
            message: error.message,
          });
        } else throw error;
      }
    }
    return { retried, rejected };
  },

  ingestSeeds: async () => {
    const seedPaths = await listSeedPaths(resources.repoRoot);
    const organizations = await resources.db.organization.findMany();
    const documents: unknown[] = [];
    let skipped = 0;
    for (const seedPath of seedPaths) {
      const slug = seedPath.startsWith('data/fund/')
        ? 'fund'
        : seedPath.match(/data\/portcos\/(PC[123])\//)?.[1].toLowerCase();
      const organization = organizations.find((item) => item.slug === slug);
      if (!organization) continue;
      const exists = await resources.db.document.findFirst({
        where: { organizationId: organization.id, seedPath },
      });
      if (exists) {
        skipped += 1;
        continue;
      }
      documents.push(
        await putAndEnqueue(resources, {
          organization,
          filename: basename(seedPath),
          content: await readFile(join(resources.repoRoot, seedPath)),
          origin: 'seed',
          seedPath,
        }),
      );
    }
    return { created: documents.length, skipped, documents };
  },

  getChunk: async (id, includeNeighbors) => {
    const chunk = await resources.db.chunk.findUnique({
      where: { id },
      include: {
        organization: true,
        document: {
          include: { _count: { select: { chunks: true } } },
        },
      },
    });
    if (!chunk || chunk.document.source !== DocumentSource.uploaded) {
      throw new AppError(404, 'not_found', 'Chunk not found.');
    }
    const neighbor = (
      value: { id: string; index: number; content: string } | null,
    ) => value && { id: value.id, index: value.index, content: value.content };
    const context = includeNeighbors
      ? {
          previous: neighbor(
            await resources.db.chunk.findUnique({
              where: {
                documentId_index: {
                  documentId: chunk.documentId,
                  index: chunk.index - 1,
                },
              },
            }),
          ),
          next: neighbor(
            await resources.db.chunk.findUnique({
              where: {
                documentId_index: {
                  documentId: chunk.documentId,
                  index: chunk.index + 1,
                },
              },
            }),
          ),
        }
      : undefined;
    return {
      id: chunk.id,
      index: chunk.index,
      content: chunk.content,
      heading: chunk.heading,
      document: {
        id: chunk.document.id,
        filename: chunk.document.filename,
        source: 'uploaded',
        organization: serializeOrganization(chunk.organization),
        chunkCount: chunk.document._count.chunks,
      },
      ...(context ? { context } : {}),
    };
  },

  chat: async function* (input) {
    if (!resources.anthropic) {
      throw new AppError(
        503,
        'failed_dependency',
        'Anthropic is not configured.',
      );
    }
    const ids =
      input.portcoOrganizationIds ??
      (input.portcoOrganizationId ? [input.portcoOrganizationId] : []);
    const chunks = await retrieveChunks(resources, input.message, ids);
    if (!chunks.length) {
      yield {
        type: 'delta',
        text: "I don't know based on the knowledge base.",
      };
      yield { type: 'done', unsupported: true };
      return;
    }
    const prompt = await readFile(
      join(resources.repoRoot, 'llm-prompts/v2/chat.md'),
      'utf8',
    );
    const evidence = chunks
      .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
      .join('\n\n');
    let answer = '';
    for await (const delta of streamAnthropic(resources.anthropic, prompt, [
      ...input.history,
      {
        role: 'user',
        content: `Evidence:\n${evidence}\n\nQuestion: ${input.message}`,
      },
    ])) {
      answer += delta;
      yield { type: 'delta', text: delta };
    }
    const markers = new Set(
      [...answer.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1])),
    );
    const citations = chunks
      .map((chunk, index) => ({ chunk, marker: index + 1 }))
      .filter(({ marker }) => markers.has(marker))
      .map(({ chunk, marker }) => citationFrom(chunk, { marker }));
    yield { type: 'citations', citations };
    yield { type: 'done', unsupported: citations.length === 0 };
  },

  brief: async function* (input) {
    if (!resources.anthropic) {
      throw new AppError(
        503,
        'failed_dependency',
        'Anthropic is not configured.',
      );
    }
    const organization = await resources.db.organization.findUnique({
      where: { id: input.portcoOrganizationId },
    });
    if (!organization || organization.kind !== 'portco') {
      throw new AppError(400, 'bad_request', 'A valid portco is required.');
    }
    const chunks = await retrieveChunks(
      resources,
      input.history.at(-1)?.content ?? organization.name,
      [organization.id],
    );
    if (!chunks.length) {
      throw new AppError(
        409,
        'conflict',
        'No ready knowledge base exists for this portco.',
      );
    }
    const [prompt, template] = await Promise.all([
      readFile(
        join(resources.repoRoot, 'llm-prompts/v1/portco-brief.md'),
        'utf8',
      ),
      readFile(join(resources.repoRoot, 'templates/portco-brief.md'), 'utf8'),
    ]);
    const evidence = chunks
      .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
      .join('\n\n');
    let markdown = '';
    for await (const delta of streamAnthropic(resources.anthropic, prompt, [
      ...input.history,
      {
        role: 'user',
        content: `Fill this template without removing headings:\n${template}\n\nEvidence:\n${evidence}`,
      },
    ])) {
      markdown += delta;
      yield { type: 'delta', text: delta };
    }
    const id = randomUUID();
    const filename = `${organization.slug}-portco-brief-${new Date()
      .toISOString()
      .slice(0, 10)}.md`;
    const storageKey = `generated/${organization.slug}/${id}/${filename}`;
    await resources.s3.send(
      new PutObjectCommand({
        Bucket: resources.bucket,
        Key: storageKey,
        Body: markdown,
        ContentType: 'text/markdown',
      }),
    );
    const sourceDocumentIds = [
      ...new Set(chunks.map((chunk) => chunk.document_id)),
    ];
    const sectionCitations = extractSectionCitations(markdown, chunks.length);
    const flags =
      sourceDocumentIds.length === 1
        ? [
            {
              code: 'single_source',
              detail: 'Only one source document supports this brief.',
            },
          ]
        : [];
    await resources.db.$transaction(async (tx) => {
      await tx.document.create({
        data: {
          id,
          organizationId: organization.id,
          source: 'generated',
          origin: null,
          status: 'ready',
          filename,
          title: `${organization.name} — leadership vs plan`,
          storageKey,
          sizeBytes: Buffer.byteLength(markdown),
          readyAt: new Date(),
          promptVersion: 'llm-prompts/v1/portco-brief.md',
          templateVersion: 'templates/portco-brief.md',
          createdByLabel: input.createdByLabel,
          sourceDocumentIds,
          flags,
        },
      });
      await tx.generatedCitation.createMany({
        data: sectionCitations.map(({ marker, section }) => ({
          documentId: id,
          chunkId: chunks[marker - 1].id,
          section,
          marker,
        })),
        skipDuplicates: true,
      });
    });
    yield {
      type: 'persisted',
      document: await createBackendServices(resources).getDocument(id),
    };
  },
});
