import { SQSClient } from '@aws-sdk/client-sqs';

import { config } from '../config.js';

export const sqs = new SQSClient({
  endpoint: config.sqs.endpoint,
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});
