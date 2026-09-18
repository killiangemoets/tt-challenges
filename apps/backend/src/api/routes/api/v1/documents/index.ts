import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { listDocumentsQuery } from '../../../../../common/schemas.js';
import {
  AppError,
  type BackendServices,
} from '../../../../../common/services/backend.js';
import { parse } from '../helpers.js';

export const documentsRoutes =
  (services: BackendServices): FastifyPluginAsync =>
  async (app) => {
    app.get('/', async (request) =>
      services.listDocuments(parse(listDocumentsQuery, request.query)),
    );

    app.post('/', async (request, reply) => {
      if (!request.isMultipart()) {
        throw new AppError(
          400,
          'bad_request',
          'Multipart form data is required.',
        );
      }
      let organizationId: string | undefined;
      let file:
        { filename: string; mimetype: string; content: Buffer } | undefined;
      for await (const part of request.parts()) {
        if (part.type === 'file' && part.fieldname === 'file') {
          file = {
            filename: part.filename,
            mimetype: part.mimetype,
            content: await part.toBuffer(),
          };
        } else if (
          part.type === 'field' &&
          part.fieldname === 'organizationId'
        ) {
          organizationId = String(part.value);
        }
      }
      if (!file || !organizationId) {
        throw new AppError(
          400,
          'bad_request',
          'file and organizationId are required.',
        );
      }
      return reply.code(201).send(
        await services.uploadDocument({
          ...file,
          organizationId: parse(z.string().uuid(), organizationId),
        }),
      );
    });
  };
