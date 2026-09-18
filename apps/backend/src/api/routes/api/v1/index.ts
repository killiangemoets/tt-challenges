import type { FastifyPluginAsync } from 'fastify';

import type { BackendServices } from '../../../../common/services/backend.js';
import { briefStreamRoutes } from './briefs/stream/index.js';
import { chatStreamRoutes } from './chat/stream/index.js';
import { chunkDetailRoutes } from './chunks/_id/index.js';
import { dashboardRoutes } from './dashboard/index.js';
import { documentDetailRoutes } from './documents/_id/index.js';
import { documentDetailRetryRoutes } from './documents/_id/retry/index.js';
import { documentsRoutes } from './documents/index.js';
import { documentRetryRoutes } from './documents/retry/index.js';
import { ingestSeedsRoutes } from './ingest-seeds/index.js';
import { organizationsRoutes } from './organizations/index.js';

export const createV1Routes = (
  services: BackendServices,
): FastifyPluginAsync => {
  return async (app) => {
    await app.register(organizationsRoutes(services), {
      prefix: '/organizations',
    });
    await app.register(dashboardRoutes(services), { prefix: '/dashboard' });
    await app.register(documentRetryRoutes(services), {
      prefix: '/documents/retry',
    });
    await app.register(documentDetailRetryRoutes(services), {
      prefix: '/documents/:id/retry',
    });
    await app.register(documentDetailRoutes(services), {
      prefix: '/documents/:id',
    });
    await app.register(documentsRoutes(services), { prefix: '/documents' });
    await app.register(ingestSeedsRoutes(services), {
      prefix: '/ingest-seeds',
    });
    await app.register(chunkDetailRoutes(services), {
      prefix: '/chunks/:id',
    });
    await app.register(chatStreamRoutes(services), {
      prefix: '/chat/stream',
    });
    await app.register(briefStreamRoutes(services), {
      prefix: '/briefs/stream',
    });
  };
};
