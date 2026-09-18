import type { FastifyPluginAsync } from 'fastify';

import { briefBody } from '../../../../../../common/schemas.js';
import type { BackendServices } from '../../../../../../common/services/backend.js';
import { parse, stream } from '../../helpers.js';

export const briefStreamRoutes =
  (services: BackendServices): FastifyPluginAsync =>
  async (app) => {
    app.post('/', async (request, reply) =>
      stream(reply, services.brief(parse(briefBody, request.body))),
    );
  };
