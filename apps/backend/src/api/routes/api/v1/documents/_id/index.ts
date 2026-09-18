import type { FastifyPluginAsync } from 'fastify';

import { idParams } from '../../../../../../common/schemas.js';
import type { BackendServices } from '../../../../../../common/services/backend.js';
import { parse } from '../../helpers.js';

export const documentDetailRoutes =
  (services: BackendServices): FastifyPluginAsync =>
  async (app) => {
    app.get('/', async (request) => {
      const { id } = parse(idParams, request.params);
      return services.getDocument(id);
    });
  };
