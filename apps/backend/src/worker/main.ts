import {
  CreateQueueCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import pino from 'pino';

import { config } from '../config.js';
import { db } from '../resources/db.js';
import { s3 } from '../resources/s3.js';
import { sqs } from '../resources/sqs.js';
import { processIngestMessage } from './process-message.js';

const logger = pino();

const start = async () => {
  const queue = await sqs.send(
    new CreateQueueCommand({
      QueueName: config.sqs.queueName,
      Attributes: { VisibilityTimeout: '300' },
    }),
  );
  if (!queue.QueueUrl) throw new Error('Queue URL was not returned.');

  let isStopping = false;
  const shutdown = (signal: string) => {
    isStopping = true;
    logger.info({
      event: 'INGEST_WORKER_STOPPING',
      indexed: { signal },
      raw: {},
    });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  logger.info({
    event: 'INGEST_WORKER_READY',
    indexed: {},
    raw: { queueName: config.sqs.queueName },
  });

  while (!isStopping) {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queue.QueueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 300,
      }),
    );
    for (const message of response.Messages ?? []) {
      try {
        const result = await processIngestMessage(message.Body, {
          db,
          s3,
          bucket: config.minio.bucket,
        });
        logger.info({
          event: 'INGEST_MESSAGE_PROCESSED',
          indexed: { outcome: result.outcome },
          raw: { messageId: message.MessageId },
        });
      } catch (error) {
        logger.error({
          event: 'INGEST_MESSAGE_FAILED',
          indexed: {},
          raw: { messageId: message.MessageId },
          error,
        });
      } finally {
        if (message.ReceiptHandle) {
          await sqs.send(
            new DeleteMessageCommand({
              QueueUrl: queue.QueueUrl,
              ReceiptHandle: message.ReceiptHandle,
            }),
          );
        }
      }
      if (isStopping) break;
    }
  }
  await db.$disconnect();
  logger.info({
    event: 'INGEST_WORKER_STOPPED',
    indexed: {},
    raw: {},
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
