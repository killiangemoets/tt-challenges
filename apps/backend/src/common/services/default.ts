import { config } from '../../config.js';
import { anthropic } from '../../resources/anthropic.js';
import { db } from '../../resources/db.js';
import { s3 } from '../../resources/s3.js';
import { sqs } from '../../resources/sqs.js';
import { createBackendServices } from './backend.js';

export const backendServices = createBackendServices({
  db,
  s3,
  sqs,
  anthropic,
  bucket: config.minio.bucket,
  queueName: config.sqs.queueName,
  repoRoot: config.repoRoot,
});
