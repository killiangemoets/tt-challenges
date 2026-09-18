import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { config } from '../config.js';
import { createV1Routes } from './routes/api/v1/index.js';
import { AppError, type BackendServices } from '../common/services/backend.js';
import { backendServices } from '../common/services/default.js';

type BuildAppOptions = {
  services?: BackendServices;
  initializeResources?: boolean;
};

export const buildApp = async (options: BuildAppOptions = {}) => {
  const services = options.services ?? backendServices;
  const app = Fastify({
    logger: config.nodeEnv !== 'test',
    routerOptions: { ignoreTrailingSlash: true },
  });

  if (options.initializeResources !== false) await services.initialize();

  await app.register(cors, {
    origin: config.api.allowedOrigins,
  });
  await app.register(multipart, {
    limits: { files: 1, fileSize: 10 * 1024 * 1024 },
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
              status: { type: 'string', const: 'ok' },
            },
          },
        },
      },
    },
    async () => ({ status: 'ok' }),
  );

  app.setErrorHandler((error, _request, reply) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(500, 'internal', 'Unexpected server error.');
    app.log.error({
      event: 'API_REQUEST_FAILED',
      indexed: { code: appError.code, statusCode: appError.statusCode },
      raw: {},
      error,
    });
    void reply.code(appError.statusCode).send({
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details ? { details: appError.details } : {}),
      },
    });
  });

  await app.register(createV1Routes(services), { prefix: '/api/v1' });

  return app;
};
