import pino from 'pino';

import { buildApp } from './app.js';
import { config } from '../config.js';

const startupLogger = pino();

const start = async () => {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({
      event: 'API_STOPPING',
      indexed: { signal },
      raw: {},
    });
    await app.close();
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({
    host: config.api.host,
    port: config.api.port,
  });
};

start().catch((error: unknown) => {
  startupLogger.error({
    event: 'API_START_FAILED',
    indexed: {},
    raw: {},
    error,
  });
  process.exit(1);
});
