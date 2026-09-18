import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import {
  getChunk,
  getDashboard,
  getDocument,
  getDocuments,
  getOrganizations,
  ingestSeeds,
  retryDocument,
  retryDocuments,
  streamBrief,
  streamChat,
  uploadDocument,
  type BriefStreamHandlers,
  type BriefStreamInput,
  type ChatStreamHandlers,
  type ChatStreamInput,
  type DocumentFilters,
} from '@/resources/api';

export const ORGANIZATIONS_KEY = ['organizations'] as const;
export const DASHBOARD_KEY = ['dashboard'] as const;
export const DOCUMENTS_KEY = ['documents'] as const;
export const CHUNKS_KEY = ['chunks'] as const;

export const useOrganizationListQuery = () =>
  useQuery({ queryKey: ORGANIZATIONS_KEY, queryFn: getOrganizations });

export const useDashboardQuery = () =>
  useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: getDashboard,
    refetchInterval: (query) => {
      const pipeline = query.state.data?.pipeline ?? [];
      return pipeline.some(({ status }) =>
        ['queued', 'processing'].includes(status),
      )
        ? 2000
        : false;
    },
  });

export const useDocumentListQuery = (filters: DocumentFilters) =>
  useQuery({
    queryKey: [...DOCUMENTS_KEY, 'list', filters],
    queryFn: () => getDocuments(filters),
    refetchInterval: (query) => {
      const documents = query.state.data ?? [];
      return documents.some(
        (document) =>
          document.source === 'uploaded' &&
          ['queued', 'processing'].includes(document.status),
      )
        ? 2000
        : false;
    },
  });

export const useDocumentLibraryQuery = () => {
  const [params, setParams] = useSearchParams();
  const source =
    params.get('source') === 'generated' ? 'generated' : 'uploaded';
  const filters: DocumentFilters = {
    source,
    status:
      source === 'uploaded' ? (params.get('status') ?? undefined) : undefined,
    organizationId: params.get('organizationId') ?? undefined,
    q: params.get('q')?.trim() || undefined,
  };
  const query = useDocumentListQuery(filters);
  const setFilters = useCallback(
    (values: Partial<DocumentFilters>) => {
      const next = new URLSearchParams(params);
      Object.entries(values).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      if (values.source === 'generated') next.delete('status');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );
  return { ...query, filters, setFilters };
};

export const useDocumentByIdQuery = (id?: string) =>
  useQuery({
    queryKey: [...DOCUMENTS_KEY, 'detail', id],
    queryFn: () => getDocument(id!),
    enabled: Boolean(id),
  });

export const useChunkByIdQuery = (id?: string) =>
  useQuery({
    queryKey: [...CHUNKS_KEY, id],
    queryFn: () => getChunk(id!),
    enabled: Boolean(id),
  });

const useInvalidateDocuments = () => {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
    ]);
  };
};

export const useUploadDocumentCommand = () => {
  const invalidate = useInvalidateDocuments();
  return useMutation({ mutationFn: uploadDocument, onSuccess: invalidate });
};

export const useIngestSeedsCommand = () => {
  const invalidate = useInvalidateDocuments();
  return useMutation({ mutationFn: ingestSeeds, onSuccess: invalidate });
};

export const useRetryDocumentCommand = () => {
  const invalidate = useInvalidateDocuments();
  return useMutation({ mutationFn: retryDocument, onSuccess: invalidate });
};

export const useRetryDocumentsCommand = () => {
  const invalidate = useInvalidateDocuments();
  return useMutation({ mutationFn: retryDocuments, onSuccess: invalidate });
};

export const useChatStreamCommand = () =>
  useMutation({
    mutationFn: ({
      input,
      handlers,
    }: {
      input: ChatStreamInput;
      handlers: ChatStreamHandlers;
    }) => streamChat(input, handlers),
  });

export const useGenerateBriefCommand = () => {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      input,
      handlers,
    }: {
      input: BriefStreamInput;
      handlers: BriefStreamHandlers;
    }) => streamBrief(input, handlers),
    onSuccess: invalidate,
  });
};
