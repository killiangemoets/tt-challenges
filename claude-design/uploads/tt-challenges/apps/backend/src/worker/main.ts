import pino from 'pino';

const logger = pino();

const start = async () => {
  logger.info({
    event: 'INGEST_WORKER_READY',
    indexed: {},
    raw: {
      note: 'Queue consumption is added with the ingest feature.',
    },
  });

  await new Promise<void>((resolve) => {
    const shutdown = (signal: string) => {
      logger.info({
        event: 'INGEST_WORKER_STOPPING',
        indexed: { signal },
        raw: {},
      });
      resolve();
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  });
};

start().catch((error: unknown) => {
  logger.error({
    event: 'INGEST_WORKER_START_FAILED',
    indexed: {},
    raw: {},
    error,
  });
  process.exit(1);
});
