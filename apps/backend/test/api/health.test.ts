import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../src/api/app.js';

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('API bootstrap', () => {
  it('reports health without product dependencies', async () => {
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('serves generated API documentation', async () => {
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api-docs.html/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
