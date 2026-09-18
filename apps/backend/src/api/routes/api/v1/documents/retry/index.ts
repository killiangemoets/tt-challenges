import type { FastifyPluginAsync } from 'fastify';

import { batchRetryBody } from '../../../../../../common/schemas.js';
import type { BackendServices } from '../../../../../../common/services/backend.js';
import { parse } from '../../helpers.js';

export const documentRetryRoutes =
  (services: BackendServices): FastifyPluginAsync =>
  async (app) => {
    app.post('/', async (request) => {
      const body = parse(batchRetryBody, request.body);
      return services.retryDocuments(body.documentIds);
    });
  };
