import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']),
  api: z.object({
    host: z.string().min(1),
    port: z.coerce.number().int().positive(),
    allowedOrigins: z.array(z.string().url()),
  }),
  databaseUrl: z.string().min(1),
  minio: z.object({
    endpoint: z.string().url(),
    accessKey: z.string().min(1),
    secretKey: z.string().min(1),
    bucket: z.string().min(1),
  }),
  sqs: z.object({
    endpoint: z.string().url(),
    queueName: z.string().min(1),
  }),
  aws: z.object({
    region: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
  }),
  anthropicApiKey: z.string().optional(),
});

const env = process.env;

export const config = configSchema.parse({
  nodeEnv: env.NODE_ENV ?? 'development',
  api: {
    host: env.API_HOST ?? '0.0.0.0',
    port: env.API_PORT ?? 3000,
    allowedOrigins: JSON.parse(
      env.APP_ALLOWED_ORIGINS ?? '["http://localhost:5173"]',
    ),
  },
  databaseUrl:
    env.DATABASE_URL ??
    'postgresql://brain:brain@localhost:5432/secondbrain',
  minio: {
    endpoint: env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    accessKey: env.MINIO_ACCESS_KEY ?? 'minio-root',
    secretKey: env.MINIO_SECRET_KEY ?? 'minio-secret',
    bucket: env.MINIO_BUCKET ?? 'second-brain',
  },
  sqs: {
    endpoint: env.SQS_ENDPOINT ?? 'http://localhost:9324',
    queueName: env.SQS_QUEUE_NAME ?? 'ingest',
  },
  aws: {
    region: env.AWS_REGION ?? 'eu-west-1',
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? 'local',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? 'local',
  },
  anthropicApiKey: env.ANTHROPIC_API_KEY || undefined,
});
