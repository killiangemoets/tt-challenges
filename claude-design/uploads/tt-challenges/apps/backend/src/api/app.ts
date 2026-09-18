import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { config } from '../config.js';

export const buildApp = async () => {
  const app = Fastify({
    logger: config.nodeEnv !== 'test',
  });

  await app.register(cors, {
    origin: config.api.allowedOrigins,
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Second Brain API',
        version: '0.1.0',
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/api-docs.html',
  });

  app.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({ status: 'ok' }),
  );

  return app;
};
