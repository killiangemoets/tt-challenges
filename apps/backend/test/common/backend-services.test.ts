import type { S3Client } from '@aws-sdk/client-s3';
import type { SQSClient } from '@aws-sdk/client-sqs';
import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import {
  createBackendServices,
  retrieveChunks,
  type ServiceResources,
} from '../../src/common/services/backend.js';

const fund = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'fund',
  kind: 'fund',
  name: 'DAW Capital',
  createdAt: new Date(),
};
const portco = {
  id: '00000000-0000-4000-8000-000000000002',
  slug: 'pc1',
  kind: 'portco',
  name: 'Vantage',
  createdAt: new Date(),
};

const createResources = () => {
  const db = {
    organization: {
      findMany: vi.fn(async () => [fund, portco]),
      findUnique: vi.fn(async () => portco),
    },
    document: {
      findMany: vi.fn(async () => []),
    },
    $queryRawUnsafe: vi.fn(async () => []),
  };
  const resources: ServiceResources = {
    db: db as unknown as PrismaClient,
    s3: { send: vi.fn() } as unknown as S3Client,
    sqs: { send: vi.fn() } as unknown as SQSClient,
    anthropic: null,
    bucket: 'documents',
    queueName: 'ingest',
    repoRoot: '/repo',
    embed: vi.fn(async () => Array<number>(384).fill(0.1)),
  };
  return { resources, db };
};

describe('backend services', () => {
  it('returns organizations in slug order', async () => {
    const { resources, db } = createResources();
    const result = await createBackendServices(resources).listOrganizations();
    expect(db.organization.findMany).toHaveBeenCalledWith({
      orderBy: { slug: 'asc' },
    });
    expect(result).toEqual({
      organizations: [
        expect.objectContaining({ slug: 'fund' }),
        expect.objectContaining({ slug: 'pc1' }),
      ],
    });
  });

  it.each([
    ['note.pdf', 'text/markdown'],
    ['note.md', 'application/pdf'],
  ])('rejects unsupported upload %s / %s', async (filename, mimetype) => {
    const { resources } = createResources();
    await expect(
      createBackendServices(resources).uploadDocument({
        filename,
        mimetype,
        organizationId: portco.id,
        content: Buffer.from('content'),
      }),
    ).rejects.toMatchObject({
      statusCode: 415,
      code: 'unsupported_media_type',
    });
  });

  it('rejects uploads for an unknown organization', async () => {
    const { resources, db } = createResources();
    db.organization.findUnique.mockResolvedValueOnce(null as never);
    await expect(
      createBackendServices(resources).uploadDocument({
        filename: 'note.md',
        mimetype: 'text/markdown',
        organizationId: portco.id,
        content: Buffer.from('content'),
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'bad_request',
    });
  });

  it('keeps fund in retrieval scope and excludes generated/non-ready rows in SQL', async () => {
    const { resources, db } = createResources();
    await retrieveChunks(resources, 'leadership risk', [portco.id]);
    expect(db.organization.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ slug: 'fund' }, { id: { in: [portco.id] }, kind: 'portco' }],
      },
    });
    const [sql, vector, ids] = (
      db.$queryRawUnsafe.mock.calls as unknown[][]
    )[0];
    expect(sql).toContain("d.source = 'uploaded'");
    expect(sql).toContain("d.status = 'ready'");
    expect(vector).toMatch(/^\[/);
    expect(ids).toEqual([fund.id, portco.id]);
  });

  it('rejects an invalid portco retrieval scope', async () => {
    const { resources, db } = createResources();
    db.organization.findMany.mockResolvedValueOnce([fund]);
    await expect(
      retrieveChunks(resources, 'question', [portco.id]),
    ).rejects.toMatchObject({ statusCode: 400, code: 'bad_request' });
    expect(db.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('rejects chat and generation when Anthropic is not configured', async () => {
    const { resources } = createResources();
    const services = createBackendServices(resources);
    await expect(
      services.chat({ message: 'Question', history: [] }).next(),
    ).rejects.toMatchObject({ statusCode: 503 });
    await expect(
      services
        .brief({
          portcoOrganizationId: portco.id,
          history: [],
          createdByLabel: 'Sam',
        })
        .next(),
    ).rejects.toMatchObject({ statusCode: 503 });
  });
});
