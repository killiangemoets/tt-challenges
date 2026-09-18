import type { FastifyPluginAsync } from 'fastify';

import { chatBody } from '../../../../../../common/schemas.js';
import type { BackendServices } from '../../../../../../common/services/backend.js';
import { parse, stream } from '../../helpers.js';

export const chatStreamRoutes =
  (services: BackendServices): FastifyPluginAsync =>
  async (app) => {
    app.post('/', async (request, reply) =>
      stream(reply, services.chat(parse(chatBody, request.body))),
    );
  };
