import { S3Client } from '@aws-sdk/client-s3';

import { config } from '../config.js';

export const s3 = new S3Client({
  endpoint: config.minio.endpoint,
  forcePathStyle: true,
  region: config.aws.region,
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
});
