import type { FastifyReply } from 'fastify';
import { z } from 'zod';

import {
  AppError,
  type SseEvent,
} from '../../../../common/services/backend.js';

export const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(
      400,
      'bad_request',
      'Request validation failed.',
      result.error.issues,
    );
  }
  return result.data;
};

const writeEvent = (reply: FastifyReply, event: SseEvent) => {
  reply.raw.write(`event: message\ndata: ${JSON.stringify(event)}\n\n`);
};

export const stream = async (
  reply: FastifyReply,
  events: AsyncGenerator<SseEvent>,
) => {
  const first = await events.next();
  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  try {
    if (!first.done) writeEvent(reply, first.value);
    for await (const event of events) writeEvent(reply, event);
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(500, 'internal', 'Streaming failed.');
    reply.raw.write(
      `event: error\ndata: ${JSON.stringify({
        type: 'error',
        code: appError.code,
        message: appError.message,
      })}\n\n`,
    );
  } finally {
    reply.raw.end();
  }
};
