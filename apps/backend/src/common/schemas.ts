import { z } from 'zod';

export const uuid = z.string().uuid();
export const idParams = z.object({ id: uuid });
export const documentSource = z.enum(['uploaded', 'generated']);
export const documentStatus = z.enum([
  'queued',
  'processing',
  'ready',
  'failed',
]);
export const documentOrigin = z.enum(['seed', 'upload']);

export const listDocumentsQuery = z
  .object({
    source: documentSource.optional(),
    status: documentStatus.optional(),
    organizationId: uuid.optional(),
    origin: documentOrigin.optional(),
    q: z.string().trim().max(120).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.source === 'generated' &&
      value.status &&
      value.status !== 'ready'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Generated documents can only have ready status.',
      });
    }
  });

export const batchRetryBody = z.object({
  documentIds: z
    .array(uuid)
    .min(1)
    .max(50)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'documentIds must be unique.',
    ),
});

export const chunkQuery = z.object({
  context: z.enum(['none', 'neighbors']).default('none'),
});

export const chatMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const chatBody = z
  .object({
    message: z.string().trim().min(1),
    history: z.array(chatMessage).default([]),
    portcoOrganizationIds: z.array(uuid).max(3).optional(),
    portcoOrganizationId: uuid.nullable().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.portcoOrganizationIds !== undefined &&
      value.portcoOrganizationId !== undefined
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Use portcoOrganizationIds only.',
      });
    }
    const ids = value.portcoOrganizationIds ?? [];
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        path: ['portcoOrganizationIds'],
        message: 'Organization ids must be unique.',
      });
    }
  });

export const briefBody = z.object({
  portcoOrganizationId: uuid,
  history: z.array(chatMessage).default([]),
  createdByLabel: z.string().trim().min(1).max(100).default('Sam'),
});

export type ChatInput = z.infer<typeof chatBody>;
export type BriefInput = z.infer<typeof briefBody>;
