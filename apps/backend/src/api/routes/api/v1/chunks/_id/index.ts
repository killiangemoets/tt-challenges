import type { FastifyPluginAsync } from 'fastify';

import { chunkQuery, idParams } from '../../../../../../common/schemas.js';
import type { BackendServices } from '../../../../../../common/services/backend.js';
import { parse } from '../../helpers.js';

export const chunkDetailRoutes =
  (services: BackendServices): FastifyPluginAsync =>
  async (app) => {
    app.get('/', async (request) => {
      const { id } = parse(idParams, request.params);
      const query = parse(chunkQuery, request.query);
      return services.getChunk(id, query.context === 'neighbors');
    });
  };
