import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../src/api/app.js';
import type {
  BackendServices,
  SseEvent,
} from '../../src/common/services/backend.js';

const id = '00000000-0000-4000-8000-000000000002';

const generator = async function* (events: SseEvent[]) {
  for (const event of events) yield event;
};

const createServices = (): BackendServices => ({
  initialize: vi.fn(async () => undefined),
  listOrganizations: vi.fn(async () => ({ organizations: [] })),
  dashboard: vi.fn(async () => ({
    needsMe: [],
    pipeline: [],
    generated: [],
  })),
  listDocuments: vi.fn(async () => ({ documents: [] })),
  uploadDocument: vi.fn(async () => ({ id, status: 'queued' })),
  getDocument: vi.fn(async () => ({ id, source: 'uploaded' })),
  retryDocument: vi.fn(async () => ({ id, status: 'queued' })),
  retryDocuments: vi.fn(async () => ({ retried: [], rejected: [] })),
  ingestSeeds: vi.fn(async () => ({ created: 0, skipped: 0, documents: [] })),
  getChunk: vi.fn(async () => ({ id, content: 'passage' })),
  chat: vi.fn(() =>
    generator([
      { type: 'delta', text: 'Grounded [1]' },
      { type: 'citations', citations: [] },
      { type: 'done', unsupported: false },
    ]),
  ),
  brief: vi.fn(() =>
    generator([
      { type: 'delta', text: '# Brief' },
      { type: 'persisted', document: { id } },
    ]),
  ),
});

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
let services: BackendServices;

beforeEach(() => {
  services = createServices();
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

const appForTest = async () => {
  const app = await buildApp({ services, initializeResources: false });
  apps.push(app);
  return app;
};

describe('API v1 routes', () => {
  it.each([
    ['/api/v1/organizations', 'listOrganizations'],
    ['/api/v1/dashboard', 'dashboard'],
    ['/api/v1/documents', 'listDocuments'],
    [`/api/v1/documents/${id}`, 'getDocument'],
    [`/api/v1/chunks/${id}`, 'getChunk'],
  ] as const)('serves GET %s', async (url, method) => {
    const response = await (await appForTest()).inject({ method: 'GET', url });
    expect(response.statusCode).toBe(200);
    expect(services[method]).toHaveBeenCalledOnce();
  });

  it('validates document filters', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'GET',
      url: '/api/v1/documents?source=generated&status=failed',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('bad_request');
  });

  it('uploads markdown multipart data', async () => {
    const boundary = 'second-brain-boundary';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="organizationId"',
      '',
      id,
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="note.md"',
      'Content-Type: text/markdown',
      '',
      '# Note',
      `--${boundary}--`,
      '',
    ].join('\r\n');
    const response = await (
      await appForTest()
    ).inject({
      method: 'POST',
      url: '/api/v1/documents',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(response.statusCode).toBe(201);
    expect(services.uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'note.md',
        organizationId: id,
      }),
    );
  });

  it('rejects upload without multipart', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'POST',
      url: '/api/v1/documents',
      payload: {},
    });
    expect(response.statusCode).toBe(400);
  });

  it('routes single and batch retries independently', async () => {
    const app = await appForTest();
    const single = await app.inject({
      method: 'POST',
      url: `/api/v1/documents/${id}/retry`,
    });
    const batch = await app.inject({
      method: 'POST',
      url: '/api/v1/documents/retry',
      payload: { documentIds: [id] },
    });
    expect(single.statusCode).toBe(200);
    expect(batch.statusCode).toBe(200);
    expect(services.retryDocument).toHaveBeenCalledWith(id);
    expect(services.retryDocuments).toHaveBeenCalledWith([id]);
  });

  it('rejects invalid batch retries', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'POST',
      url: '/api/v1/documents/retry',
      payload: { documentIds: [] },
    });
    expect(response.statusCode).toBe(400);
  });

  it('starts seed ingestion', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'POST',
      url: '/api/v1/ingest-seeds',
    });
    expect(response.statusCode).toBe(200);
    expect(services.ingestSeeds).toHaveBeenCalledOnce();
  });

  it('requests chunk neighbors', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'GET',
      url: `/api/v1/chunks/${id}?context=neighbors`,
    });
    expect(response.statusCode).toBe(200);
    expect(services.getChunk).toHaveBeenCalledWith(id, true);
  });

  it('streams ordered chat events', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'POST',
      url: '/api/v1/chat/stream',
      payload: { message: 'What changed?', history: [] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.body).toContain('"type":"delta"');
    expect(response.body).toContain('"type":"citations"');
    expect(response.body).toContain('"type":"done"');
  });

  it('rejects duplicate chat scopes', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'POST',
      url: '/api/v1/chat/stream',
      payload: {
        message: 'Compare',
        portcoOrganizationIds: [id, id],
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it('streams and persists a brief', async () => {
    const response = await (
      await appForTest()
    ).inject({
      method: 'POST',
      url: '/api/v1/briefs/stream',
      payload: { portcoOrganizationId: id, history: [] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('"type":"delta"');
    expect(response.body).toContain('"type":"persisted"');
  });

  it('returns the standard application error envelope', async () => {
    vi.mocked(services.getDocument).mockRejectedValueOnce(
      new Error('private detail'),
    );
    const response = await (
      await appForTest()
    ).inject({
      method: 'GET',
      url: `/api/v1/documents/${id}`,
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: { code: 'internal', message: 'Unexpected server error.' },
    });
  });
});
