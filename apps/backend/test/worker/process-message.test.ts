import type { S3Client } from '@aws-sdk/client-s3';
import type { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processIngestMessage } from '../../src/worker/process-message.js';

const id = '00000000-0000-4000-8000-000000000002';
const document = {
  id,
  organizationId: '00000000-0000-4000-8000-000000000003',
  source: 'uploaded',
  status: 'queued',
  filename: 'source.md',
  storageKey: 'uploaded/pc2/source.md',
};

const createDependencies = () => {
  const tx = {
    chunk: { deleteMany: vi.fn(async () => ({ count: 0 })) },
    document: { update: vi.fn(async () => document) },
    $executeRawUnsafe: vi.fn(async () => 1),
  };
  const db = {
    document: {
      findUnique: vi.fn(async () => document),
      update: vi.fn(async () => document),
    },
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const s3 = {
    send: vi.fn(async () => ({
      Body: { transformToString: vi.fn(async () => '# Heading\n\nEvidence') },
    })),
  };
  return {
    dependencies: {
      db: db as unknown as PrismaClient,
      s3: s3 as unknown as S3Client,
      bucket: 'documents',
      embed: vi.fn(async () => Array<number>(384).fill(0.1)),
    },
    db,
    s3,
    tx,
  };
};

describe('processIngestMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([undefined, '', '{}', '{"documentId":"bad"}'])(
    'acknowledges poison body %s',
    async (body) => {
      const { dependencies, db } = createDependencies();
      expect(await processIngestMessage(body, dependencies)).toEqual({
        outcome: 'ignored',
      });
      expect(db.document.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each([
    null,
    { ...document, source: 'generated', status: 'ready' },
    { ...document, status: 'ready' },
    { ...document, status: 'failed' },
  ])('ignores ineligible documents', async (row) => {
    const { dependencies, db } = createDependencies();
    db.document.findUnique.mockResolvedValueOnce(row as typeof document);
    expect(
      await processIngestMessage(
        JSON.stringify({ documentId: id }),
        dependencies,
      ),
    ).toEqual({ outcome: 'ignored' });
  });

  it('moves to processing, atomically replaces chunks, and becomes ready', async () => {
    const { dependencies, db, tx } = createDependencies();
    const result = await processIngestMessage(
      JSON.stringify({ documentId: id }),
      dependencies,
    );
    expect(result).toEqual({ outcome: 'ready' });
    expect(db.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'processing' }),
      }),
    );
    expect(tx.chunk.deleteMany).toHaveBeenCalledWith({
      where: { documentId: id },
    });
    expect(tx.$executeRawUnsafe).toHaveBeenCalled();
    expect(tx.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ready' }),
      }),
    );
  });

  it('processes a redelivered processing document idempotently', async () => {
    const { dependencies, db } = createDependencies();
    db.document.findUnique.mockResolvedValueOnce({
      ...document,
      status: 'processing',
    });
    expect(
      await processIngestMessage(
        JSON.stringify({ documentId: id }),
        dependencies,
      ),
    ).toEqual({ outcome: 'ready' });
  });

  it.each([
    [
      'missing object',
      async (state: ReturnType<typeof createDependencies>) => {
        state.s3.send.mockRejectedValueOnce(new Error('missing'));
      },
      'object_not_found',
      'File missing from object storage.',
    ],
    [
      'empty content',
      async (state: ReturnType<typeof createDependencies>) => {
        state.s3.send.mockResolvedValueOnce({
          Body: { transformToString: vi.fn(async () => '   ') },
        });
      },
      'empty_content',
      'File is empty.',
    ],
    [
      'embedding error',
      async (state: ReturnType<typeof createDependencies>) => {
        vi.mocked(state.dependencies.embed).mockRejectedValueOnce(
          new Error('model'),
        );
      },
      'embed_failed',
      'Embedding failed. Retry the document.',
    ],
    [
      'database error',
      async (state: ReturnType<typeof createDependencies>) => {
        state.db.$transaction.mockRejectedValueOnce(new Error('db'));
      },
      'db_failed',
      'Could not save chunks. Retry the document.',
    ],
  ] as const)(
    'marks a document failed on %s',
    async (_label, arrange, code, message) => {
      const state = createDependencies();
      await arrange(state);
      const result = await processIngestMessage(
        JSON.stringify({ documentId: id }),
        state.dependencies,
      );
      expect(result).toEqual({ outcome: 'failed', code });
      expect(state.db.document.update).toHaveBeenLastCalledWith({
        where: { id },
        data: { status: 'failed', errorMessage: message },
      });
    },
  );

  it.each(['source.docx', 'source.xlsx', 'source.pptx'])(
    'marks unsupported Office seed %s as failed with guidance',
    async (filename) => {
      const state = createDependencies();
      state.db.document.findUnique.mockResolvedValueOnce({
        ...document,
        filename,
      });
      expect(
        await processIngestMessage(
          JSON.stringify({ documentId: id }),
          state.dependencies,
        ),
      ).toEqual({ outcome: 'failed', code: 'unsupported_type' });
      expect(state.db.document.update).toHaveBeenLastCalledWith({
        where: { id },
        data: {
          status: 'failed',
          errorMessage:
            'This Office file cannot be parsed yet. Convert it to Markdown (.md), then upload it.',
        },
      });
      expect(state.s3.send).not.toHaveBeenCalled();
    },
  );
});
