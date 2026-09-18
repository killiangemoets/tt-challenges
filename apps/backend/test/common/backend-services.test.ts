import type { S3Client } from '@aws-sdk/client-s3';
import type { SQSClient } from '@aws-sdk/client-sqs';
import type { PrismaClient } from '@prisma/client';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
      findFirst: vi.fn(
        async (query: {
          where: { organizationId: string; seedPath: string };
        }) => {
          void query;
          return { id: 'existing' };
        },
      ),
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
  it('registers markdown and Office seed paths', async () => {
    const { resources, db } = createResources();
    const repoRoot = await mkdtemp(join(tmpdir(), 'second-brain-'));
    const seedDirectory = join(repoRoot, 'data/portcos/PC1/inbox');
    await mkdir(seedDirectory, { recursive: true });
    await Promise.all(
      ['source.md', 'source.docx', 'source.xlsx', 'source.pptx'].map(
        (filename) => writeFile(join(seedDirectory, filename), 'content'),
      ),
    );
    resources.repoRoot = repoRoot;

    try {
      await createBackendServices(resources).ingestSeeds();
    } finally {
      await rm(repoRoot, { recursive: true });
    }

    expect(db.document.findFirst).toHaveBeenCalledTimes(4);
    expect(
      db.document.findFirst.mock.calls.map(([query]) => query.where.seedPath),
    ).toEqual(
      expect.arrayContaining([
        'data/portcos/PC1/inbox/source.docx',
        'data/portcos/PC1/inbox/source.md',
        'data/portcos/PC1/inbox/source.pptx',
        'data/portcos/PC1/inbox/source.xlsx',
      ]),
    );
  });

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

  it('maps an Anthropic rejection to failed_dependency with its reason', async () => {
    const { resources, db } = createResources();
    db.organization.findMany.mockResolvedValueOnce([fund]);
    db.$queryRawUnsafe.mockResolvedValueOnce([
      {
        id: 'chunk-1',
        document_id: 'doc-1',
        organization_id: portco.id,
        index: 0,
        content: 'Evidence passage',
        heading: null,
        filename: 'source.md',
        organization_slug: portco.slug,
        organization_kind: portco.kind,
        organization_name: portco.name,
      },
    ] as never);
    resources.anthropic = {
      messages: {
        stream: () => {
          throw {
            status: 400,
            error: {
              error: { message: 'Your credit balance is too low' },
            },
          };
        },
      },
    } as unknown as typeof resources.anthropic;

    resources.repoRoot = resolve(process.cwd(), '../..');

    const events = createBackendServices(resources).chat({
      message: 'Question',
      history: [],
    });
    await expect(events.next()).rejects.toMatchObject({
      statusCode: 503,
      code: 'failed_dependency',
      message: 'Anthropic rejected the request: Your credit balance is too low',
    });
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
