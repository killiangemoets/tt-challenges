import type { FastifyPluginAsync } from 'fastify';

import type { BackendServices } from '../../../../../common/services/backend.js';

export const organizationsRoutes =
  (services: BackendServices): FastifyPluginAsync =>
  async (app) => {
    app.get('/', async () => services.listOrganizations());
  };
