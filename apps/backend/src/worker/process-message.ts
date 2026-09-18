import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import {
  DocumentSource,
  DocumentStatus,
  type PrismaClient,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { chunkMarkdown } from '../common/helpers/chunk-markdown.js';
import { embedText } from '../common/helpers/embed.js';

type WorkerDependencies = {
  db: PrismaClient;
  s3: S3Client;
  bucket: string;
  embed?: (text: string) => Promise<number[]>;
};

type IngestFailureCode =
  | 'object_not_found'
  | 'empty_content'
  | 'unsupported_type'
  | 'embed_failed'
  | 'db_failed'
  | 'other';

const messages: Record<IngestFailureCode, string> = {
  object_not_found: 'File missing from object storage.',
  empty_content: 'File is empty.',
  unsupported_type: 'Only markdown (.md) files can be ingested.',
  embed_failed: 'Embedding failed. Retry the document.',
  db_failed: 'Could not save chunks. Retry the document.',
  other: 'Ingest failed. Retry the document.',
};

class IngestError extends Error {
  constructor(public readonly code: IngestFailureCode) {
    super(messages[code]);
  }
}

export const processIngestMessage = async (
  body: string | undefined,
  dependencies: WorkerDependencies,
) => {
  let documentId: string;
  try {
    const value = JSON.parse(body ?? '') as { documentId?: unknown };
    if (
      typeof value.documentId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.documentId,
      )
    ) {
      return { outcome: 'ignored' as const };
    }
    documentId = value.documentId;
  } catch {
    return { outcome: 'ignored' as const };
  }

  const document = await dependencies.db.document.findUnique({
    where: { id: documentId },
  });
  if (
    !document ||
    document.source === DocumentSource.generated ||
    document.status === DocumentStatus.ready ||
    document.status === DocumentStatus.failed
  ) {
    return { outcome: 'ignored' as const };
  }

  await dependencies.db.document.update({
    where: { id: document.id },
    data: { status: 'processing', errorMessage: null },
  });

  let failure: IngestError | undefined;
  try {
    if (!document.filename.toLowerCase().endsWith('.md')) {
      throw new IngestError('unsupported_type');
    }
    let markdown: string;
    try {
      const object = await dependencies.s3.send(
        new GetObjectCommand({
          Bucket: dependencies.bucket,
          Key: document.storageKey,
        }),
      );
      markdown = (await object.Body?.transformToString()) ?? '';
    } catch {
      throw new IngestError('object_not_found');
    }
    const chunks = chunkMarkdown(markdown);
    if (!chunks.length) throw new IngestError('empty_content');

    const embed = dependencies.embed ?? embedText;
    let embedded: Array<(typeof chunks)[number] & { embedding: number[] }>;
    try {
      embedded = await Promise.all(
        chunks.map(async (chunk) => ({
          ...chunk,
          embedding: await embed(chunk.content),
        })),
      );
    } catch {
      throw new IngestError('embed_failed');
    }
    try {
      await dependencies.db.$transaction(async (tx) => {
        await tx.chunk.deleteMany({ where: { documentId: document.id } });
        for (const chunk of embedded) {
          const vector = `[${chunk.embedding.join(',')}]`;
          await tx.$executeRawUnsafe(
            `INSERT INTO chunks
              (id, document_id, organization_id, "index", content, heading, embedding, created_at)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::vector, now())`,
            randomUUID(),
            document.id,
            document.organizationId,
            chunk.index,
            chunk.content,
            chunk.heading,
            vector,
          );
        }
        await tx.document.update({
          where: { id: document.id },
          data: {
            status: 'ready',
            readyAt: new Date(),
            errorMessage: null,
          },
        });
      });
    } catch {
      throw new IngestError('db_failed');
    }
  } catch (error) {
    failure = error instanceof IngestError ? error : new IngestError('other');
  }

  if (failure) {
    await dependencies.db.document.update({
      where: { id: document.id },
      data: { status: 'failed', errorMessage: failure.message },
    });
    return { outcome: 'failed' as const, code: failure.code };
  }
  return { outcome: 'ready' as const };
};
